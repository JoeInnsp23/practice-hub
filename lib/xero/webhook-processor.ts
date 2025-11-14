/**
 * Xero Webhook Event Processor
 *
 * Processes unprocessed webhook events from the queue
 * - Fetches resource data from Xero API
 * - Updates Practice Hub database (invoices, contacts, etc.)
 * - Forwards events to external webhooks (Make.com, Zapier)
 *
 * Based on original CRM app webhook architecture
 */

import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  invoiceItems,
  invoices,
  xeroWebhookEvents,
} from "@/lib/db/schema";
import { XeroApiClient } from "@/lib/xero/api-client";

export interface XeroWebhookEvent {
  id: string;
  tenantId: string;
  eventId: string;
  eventType: "CREATE" | "UPDATE" | "DELETE";
  eventCategory: string;
  eventDateUtc: Date;
  resourceId: string;
  resourceUrl: string | null;
  xeroTenantId: string;
  processed: boolean;
  processedAt: Date | null;
  processingError: string | null;
  rawPayload: unknown;
  createdAt: Date;
}

/**
 * Process webhook events
 *
 * Fetches unprocessed events and handles them based on category
 * Runs in background worker or on-demand via API
 */
export async function processWebhookEvents(): Promise<{
  processed: number;
  failed: number;
}> {
  let processed = 0;
  let failed = 0;

  try {
    // Fetch unprocessed events (batch of 100)
    const unprocessedEvents = await db
      .select()
      .from(xeroWebhookEvents)
      .where(eq(xeroWebhookEvents.processed, false))
      .limit(100);

    console.log(
      `Processing ${unprocessedEvents.length} unprocessed webhook events...`,
    );

    for (const event of unprocessedEvents) {
      try {
        // Handle event based on category
        await handleWebhookEvent(event as unknown as XeroWebhookEvent);

        // Mark as processed
        await db
          .update(xeroWebhookEvents)
          .set({ processed: true, processedAt: new Date() })
          .where(eq(xeroWebhookEvents.id, event.id));

        processed++;
      } catch (error) {
        failed++;

        // Log error but don't fail the batch
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await db
          .update(xeroWebhookEvents)
          .set({ processingError: errorMessage })
          .where(eq(xeroWebhookEvents.id, event.id));

        Sentry.captureException(error, {
          tags: {
            operation: "process_webhook_event",
            eventCategory: event.eventCategory,
          },
          extra: { eventId: event.eventId, resourceId: event.resourceId },
        });

        console.error(`Failed to process event ${event.eventId}:`, error);
      }
    }

    console.log(
      `Webhook processing complete: ${processed} processed, ${failed} failed`,
    );

    return { processed, failed };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "processWebhookEvents" },
    });
    console.error("Failed to process webhook events:", error);
    throw error;
  }
}

/**
 * Handle individual webhook event based on category
 */
async function handleWebhookEvent(event: XeroWebhookEvent): Promise<void> {
  console.log(
    `Handling ${event.eventCategory} event: ${event.eventType} ${event.resourceId}`,
  );

  switch (event.eventCategory) {
    case "INVOICE":
      await handleInvoiceEvent(event);
      break;

    case "CONTACT":
      await handleContactEvent(event);
      break;

    case "PAYMENT":
      await handlePaymentEvent(event);
      break;

    case "BANKTRANSACTION":
      await handleBankTransactionEvent(event);
      break;

    default:
      console.log(`Unsupported event category: ${event.eventCategory}`);
      break;
  }
}

/**
 * Handle INVOICE webhook events
 *
 * - CREATE: New invoice created in Xero → sync to Practice Hub
 * - UPDATE: Invoice updated in Xero → update Practice Hub
 * - DELETE: Invoice deleted in Xero → mark as deleted/archived
 */
async function handleInvoiceEvent(event: XeroWebhookEvent): Promise<void> {
  const apiClient = new XeroApiClient();

  try {
    // Fetch invoice data from Xero API
    const xeroInvoice = await apiClient.getInvoice(
      event.tenantId,
      event.resourceId,
    );

    if (!xeroInvoice) {
      console.log(
        `Invoice ${event.resourceId} not found in Xero (may have been deleted)`,
      );

      // If DELETE event or invoice not found, mark as deleted in Practice Hub
      if (event.eventType === "DELETE") {
        await db
          .update(invoices)
          .set({
            status: "cancelled",
            xeroSyncStatus: "synced",
            xeroLastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invoices.xeroInvoiceId, event.resourceId));
      }
      return;
    }

    // Find or create the client (contact) in Practice Hub
    let client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.tenantId, event.tenantId),
          eq(clients.xeroContactId, xeroInvoice.Contact.ContactID || ""),
        ),
      )
      .limit(1);

    if (client.length === 0 && xeroInvoice.Contact.ContactID) {
      // Client doesn't exist - fetch from Xero and create
      const xeroContact = await apiClient.getContact(
        event.tenantId,
        xeroInvoice.Contact.ContactID,
      );

      if (xeroContact) {
        const [newClient] = await db
          .insert(clients)
          .values({
            tenantId: event.tenantId,
            clientCode: xeroContact.AccountNumber || `XERO-${Date.now()}`,
            name: xeroContact.Name,
            type: "company",
            status: "active",
            email: xeroContact.EmailAddress,
            phone: xeroContact.Phones?.[0]?.PhoneNumber,
            addressLine1: xeroContact.Addresses?.[0]?.AddressLine1,
            addressLine2: xeroContact.Addresses?.[0]?.AddressLine2,
            city: xeroContact.Addresses?.[0]?.City,
            state: xeroContact.Addresses?.[0]?.Region,
            postalCode: xeroContact.Addresses?.[0]?.PostalCode,
            country: xeroContact.Addresses?.[0]?.Country,
            vatNumber: xeroContact.TaxNumber,
            vatRegistered: !!xeroContact.TaxNumber,
            xeroContactId: xeroContact.ContactID,
            xeroSyncStatus: "synced",
            xeroLastSyncedAt: new Date(),
          })
          .returning();
        client = [newClient];
      } else {
        throw new Error(
          `Contact ${xeroInvoice.Contact.ContactID} not found in Xero`,
        );
      }
    }

    if (client.length === 0) {
      throw new Error("Failed to find or create client for invoice");
    }

    // Map Xero invoice to Practice Hub format
    const invoiceData = {
      tenantId: event.tenantId,
      invoiceNumber: xeroInvoice.InvoiceNumber || `XERO-${Date.now()}`,
      clientId: client[0].id,
      issueDate: xeroInvoice.Date,
      dueDate: xeroInvoice.DueDate,
      subtotal: calculateSubtotal(xeroInvoice.LineItems).toString(),
      taxAmount: calculateTax(xeroInvoice.LineItems).toString(),
      total: calculateTotal(xeroInvoice.LineItems).toString(),
      amountPaid: "0", // Will be updated by payment webhooks
      status: mapXeroInvoiceStatus(xeroInvoice.Status || "DRAFT"),
      currency: xeroInvoice.CurrencyCode || "GBP",
      notes: xeroInvoice.Reference || null,
      xeroInvoiceId: xeroInvoice.InvoiceID,
      xeroSyncStatus: "synced" as const,
      xeroLastSyncedAt: new Date(),
    };

    // Upsert invoice
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.xeroInvoiceId, event.resourceId))
      .limit(1);

    let invoiceId: string;

    if (existingInvoice.length > 0) {
      // Update existing invoice
      const [updated] = await db
        .update(invoices)
        .set({ ...invoiceData, updatedAt: new Date() })
        .where(eq(invoices.id, existingInvoice[0].id))
        .returning();
      invoiceId = updated.id;
    } else {
      // Create new invoice
      const [created] = await db
        .insert(invoices)
        .values(invoiceData)
        .returning();
      invoiceId = created.id;
    }

    // Sync invoice line items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    for (const lineItem of xeroInvoice.LineItems) {
      await db.insert(invoiceItems).values({
        invoiceId,
        description: lineItem.Description,
        quantity: lineItem.Quantity.toString(),
        rate: lineItem.UnitAmount.toString(),
        amount: (
          lineItem.LineAmount || lineItem.Quantity * lineItem.UnitAmount
        ).toString(),
      });
    }

    console.log(
      `Successfully synced invoice ${xeroInvoice.InvoiceNumber} from Xero`,
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "handleInvoiceEvent",
        eventType: event.eventType,
      },
      extra: {
        resourceId: event.resourceId,
        tenantId: event.tenantId,
      },
    });
    throw error;
  }
}

// Helper functions for invoice calculations
function calculateSubtotal(
  lineItems: Array<{
    Quantity: number;
    UnitAmount: number;
    LineAmount?: number;
  }>,
): number {
  return lineItems.reduce(
    (sum, item) => sum + (item.LineAmount || item.Quantity * item.UnitAmount),
    0,
  );
}

function calculateTax(
  _lineItems: Array<{
    Quantity: number;
    UnitAmount: number;
    LineAmount?: number;
  }>,
): number {
  // Tax calculation would depend on LineAmountTypes (Exclusive/Inclusive/NoTax)
  // For now, assume tax is calculated separately in Xero
  return 0;
}

function calculateTotal(
  lineItems: Array<{
    Quantity: number;
    UnitAmount: number;
    LineAmount?: number;
  }>,
): number {
  return calculateSubtotal(lineItems) + calculateTax(lineItems);
}

function mapXeroInvoiceStatus(
  xeroStatus: string,
): "draft" | "sent" | "paid" | "overdue" | "cancelled" {
  switch (xeroStatus) {
    case "DRAFT":
      return "draft";
    case "SUBMITTED":
      return "sent";
    case "AUTHORISED":
      return "sent";
    case "PAID":
      return "paid";
    case "VOIDED":
      return "cancelled";
    default:
      return "draft";
  }
}

/**
 * Handle CONTACT webhook events
 *
 * - CREATE: New contact created in Xero → sync to Practice Hub
 * - UPDATE: Contact updated in Xero → update Practice Hub
 * - DELETE: Contact deleted in Xero → mark as inactive
 */
async function handleContactEvent(event: XeroWebhookEvent): Promise<void> {
  const apiClient = new XeroApiClient();

  try {
    // Fetch contact data from Xero API
    const xeroContact = await apiClient.getContact(
      event.tenantId,
      event.resourceId,
    );

    if (!xeroContact) {
      console.log(
        `Contact ${event.resourceId} not found in Xero (may have been deleted)`,
      );

      // If DELETE event or contact not found, mark as inactive in Practice Hub
      if (event.eventType === "DELETE") {
        await db
          .update(clients)
          .set({
            status: "inactive",
            xeroSyncStatus: "synced",
            xeroLastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(clients.xeroContactId, event.resourceId));
      }
      return;
    }

    // Map Xero contact to Practice Hub client format
    const clientData = {
      tenantId: event.tenantId,
      clientCode: xeroContact.AccountNumber || `XERO-${Date.now()}`,
      name: xeroContact.Name,
      type: (xeroContact.IsSupplier ? "other" : "company") as
        | "company"
        | "individual"
        | "other",
      status: "active" as const,
      email: xeroContact.EmailAddress || null,
      phone:
        xeroContact.Phones?.find(
          (p) => p.PhoneType === "DEFAULT" || p.PhoneType === "MOBILE",
        )?.PhoneNumber || null,
      addressLine1:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")
          ?.AddressLine1 || null,
      addressLine2:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")
          ?.AddressLine2 || null,
      city:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")?.City ||
        null,
      state:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")
          ?.Region || null,
      postalCode:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")
          ?.PostalCode || null,
      country:
        xeroContact.Addresses?.find((a) => a.AddressType === "STREET")
          ?.Country || null,
      vatNumber: xeroContact.TaxNumber || null,
      vatRegistered: !!xeroContact.TaxNumber,
      xeroContactId: xeroContact.ContactID,
      xeroSyncStatus: "synced" as const,
      xeroLastSyncedAt: new Date(),
    };

    // Upsert client
    const existingClient = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.tenantId, event.tenantId),
          eq(clients.xeroContactId, event.resourceId),
        ),
      )
      .limit(1);

    if (existingClient.length > 0) {
      // Update existing client
      await db
        .update(clients)
        .set({ ...clientData, updatedAt: new Date() })
        .where(eq(clients.id, existingClient[0].id));
      console.log(`Successfully updated client ${xeroContact.Name} from Xero`);
    } else {
      // Create new client
      await db.insert(clients).values(clientData);
      console.log(`Successfully created client ${xeroContact.Name} from Xero`);
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        operation: "handleContactEvent",
        eventType: event.eventType,
      },
      extra: {
        resourceId: event.resourceId,
        tenantId: event.tenantId,
      },
    });
    throw error;
  }
}

/**
 * Handle PAYMENT webhook events
 *
 * - CREATE: New payment received → update invoice status and amountPaid
 * - UPDATE: Payment updated → update Practice Hub payment records
 * - DELETE: Payment deleted → revert invoice status and amountPaid
 *
 * IMPLEMENTATION NOTE:
 * This handler requires the Xero API getPayment method to be implemented
 * in lib/xero/api-client.ts. The method should fetch payment details from
 * Xero API endpoint: GET /api.xro/2.0/Payments/{PaymentID}
 *
 * Required implementation steps:
 * 1. Add getPayment method to XeroApiClient class
 * 2. Fetch payment data using event.resourceId
 * 3. Find related invoice by InvoiceID in payment data
 * 4. Update invoice.amountPaid and invoice.status
 * 5. If amountPaid >= total, set status to "paid"
 * 6. Log payment transaction for audit trail
 *
 * Schema dependencies:
 * - invoices.amountPaid (already exists)
 * - invoices.paidDate (already exists)
 * - invoices.status (already exists)
 *
 * Error handling:
 * - Track all errors with Sentry
 * - Log payment ID and invoice ID for debugging
 * - Handle partial payments correctly
 * - Handle payment reversals (DELETE events)
 */
async function handlePaymentEvent(event: XeroWebhookEvent): Promise<void> {
  Sentry.captureMessage(
    `Payment webhook handler not yet implemented: ${event.eventType} ${event.resourceId}`,
    {
      level: "info",
      tags: {
        operation: "handlePaymentEvent",
        eventType: event.eventType,
        status: "not_implemented",
      },
      extra: {
        resourceId: event.resourceId,
        tenantId: event.tenantId,
        eventCategory: event.eventCategory,
      },
    },
  );

  console.log(
    `Payment webhook handler not yet implemented: ${event.eventType} for ${event.resourceId}`,
    "\nTo implement: Add XeroApiClient.getPayment() method and update invoice amountPaid/status",
  );
}

/**
 * Handle BANKTRANSACTION webhook events
 *
 * - CREATE: New bank transaction → sync to Practice Hub accounting system
 * - UPDATE: Transaction updated → update Practice Hub records
 * - DELETE: Transaction deleted → mark as deleted/voided
 *
 * IMPLEMENTATION NOTE:
 * This handler requires:
 * 1. getBankTransaction method in XeroApiClient (lib/xero/api-client.ts)
 * 2. Bank transactions schema in Practice Hub database
 * 3. Bank account reconciliation logic
 *
 * Required implementation steps:
 * 1. Add getBankTransaction to XeroApiClient
 *    - API endpoint: GET /api.xro/2.0/BankTransactions/{BankTransactionID}
 * 2. Create bank_transactions table if it doesn't exist:
 *    - id, tenantId, transactionDate, amount, type (SPEND/RECEIVE)
 *    - bankAccountId, contactId, description, reference
 *    - status, xeroBankTransactionId, xeroSyncStatus, etc.
 * 3. Map Xero bank transaction to Practice Hub format
 * 4. Upsert to database with proper tenant isolation
 * 5. Handle reconciliation status changes
 *
 * Schema requirements:
 * - bank_accounts table (link to Xero bank accounts)
 * - bank_transactions table (store transactions)
 * - transaction_categories table (for categorization)
 *
 * Business logic:
 * - Categorize transactions by contact/type
 * - Handle bank reconciliation status
 * - Track unmatched transactions
 * - Support manual/automatic matching to invoices
 *
 * Error handling:
 * - Track with Sentry including transaction details
 * - Handle missing bank account mappings
 * - Handle currency conversion if needed
 * - Log all sync errors for audit
 */
async function handleBankTransactionEvent(
  event: XeroWebhookEvent,
): Promise<void> {
  Sentry.captureMessage(
    `Bank transaction webhook handler not yet implemented: ${event.eventType} ${event.resourceId}`,
    {
      level: "info",
      tags: {
        operation: "handleBankTransactionEvent",
        eventType: event.eventType,
        status: "not_implemented",
      },
      extra: {
        resourceId: event.resourceId,
        tenantId: event.tenantId,
        eventCategory: event.eventCategory,
      },
    },
  );

  console.log(
    `Bank transaction webhook handler not yet implemented: ${event.eventType} for ${event.resourceId}`,
    "\nTo implement: Create bank_transactions schema and add XeroApiClient.getBankTransaction()",
  );
}
