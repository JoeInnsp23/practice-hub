/**
 * Xero Sync Orchestration Service
 *
 * Coordinates two-way sync between Practice Hub and Xero
 * - Push changes from Practice Hub → Xero (invoices, clients, payments)
 * - Update sync status in database
 * - Handle conflicts and errors
 * - Provide retry logic for failed syncs
 *
 * Based on original CRM app sync architecture
 */

import { db } from "@/lib/db";
import { clients, invoices } from "@/lib/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { XeroApiClient } from "./api-client";

const xeroClient = new XeroApiClient();

export type SyncStatus = "synced" | "pending" | "error";

/**
 * Sync a client to Xero
 *
 * Maps Practice Hub client to Xero Contact and creates/updates in Xero
 */
export async function syncClientToXero(
  clientId: string,
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch client from database
    const client = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.tenantId, tenantId)))
      .limit(1);

    if (client.length === 0) {
      throw new Error(`Client ${clientId} not found`);
    }

    const clientData = client[0];

    // Map Practice Hub client to Xero Contact format
    const xeroContact = {
      ContactID: clientData.xeroContactId || undefined,
      Name: clientData.name,
      EmailAddress: clientData.email || undefined,
      FirstName: clientData.firstName || undefined,
      LastName: clientData.lastName || undefined,
      AccountNumber: clientData.clientCode || undefined, // Client code → Account number
      TaxNumber: clientData.vatNumber || undefined,
      Addresses: clientData.address
        ? [
            {
              AddressType: "STREET" as const,
              AddressLine1: clientData.address,
              City: clientData.city || undefined,
              PostalCode: clientData.postcode || undefined,
              Country: "GB", // Default to UK
            },
          ]
        : undefined,
      Phones: clientData.phone
        ? [
            {
              PhoneType: "DEFAULT" as const,
              PhoneNumber: clientData.phone,
            },
          ]
        : undefined,
      IsCustomer: true,
      IsSupplier: false,
    };

    // Push to Xero
    const result = await xeroClient.createOrUpdateContact(tenantId, xeroContact);

    if (!result) {
      throw new Error("Xero API returned no data");
    }

    // Update client with Xero ID and sync status
    await db
      .update(clients)
      .set({
        xeroContactId: result.ContactID,
        xeroSyncStatus: "synced",
        xeroLastSyncedAt: new Date(),
        xeroSyncError: null,
      })
      .where(eq(clients.id, clientId));

    console.log(`Client ${clientId} synced to Xero successfully (ContactID: ${result.ContactID})`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync status to error
    await db
      .update(clients)
      .set({
        xeroSyncStatus: "error",
        xeroSyncError: errorMessage,
      })
      .where(eq(clients.id, clientId));

    Sentry.captureException(error, {
      tags: { operation: "syncClientToXero" },
      extra: { clientId, tenantId },
    });

    console.error(`Failed to sync client ${clientId} to Xero:`, error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync an invoice to Xero
 *
 * Maps Practice Hub invoice to Xero Invoice and creates/updates in Xero
 */
export async function syncInvoiceToXero(
  invoiceId: string,
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch invoice with client data
    const invoice = await db
      .select({
        invoice: invoices,
        client: clients,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
      .limit(1);

    if (invoice.length === 0) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const { invoice: invoiceData, client: clientData } = invoice[0];

    // Ensure client is synced to Xero first
    if (!clientData.xeroContactId) {
      console.log(`Client ${clientData.id} not synced to Xero yet, syncing now...`);
      const clientSyncResult = await syncClientToXero(clientData.id, tenantId);
      if (!clientSyncResult.success) {
        throw new Error(`Failed to sync client first: ${clientSyncResult.error}`);
      }

      // Re-fetch client to get Xero ID
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientData.id))
        .limit(1);

      if (updatedClient.length === 0 || !updatedClient[0].xeroContactId) {
        throw new Error("Client sync failed - no Xero contact ID");
      }

      clientData.xeroContactId = updatedClient[0].xeroContactId;
    }

    // Map Practice Hub invoice to Xero Invoice format
    const xeroInvoice = {
      InvoiceID: invoiceData.xeroInvoiceId || undefined,
      Type: "ACCREC" as const, // Sales invoice
      Contact: {
        ContactID: clientData.xeroContactId,
      },
      Date: typeof invoiceData.issueDate === "string" ? invoiceData.issueDate : invoiceData.issueDate.toISOString().split("T")[0], // YYYY-MM-DD
      DueDate: typeof invoiceData.dueDate === "string" ? invoiceData.dueDate : invoiceData.dueDate.toISOString().split("T")[0],
      InvoiceNumber: invoiceData.invoiceNumber || undefined,
      Reference: undefined,
      Status: invoiceData.status === "draft" ? ("DRAFT" as const) : ("AUTHORISED" as const),
      LineItems: [
        {
          Description: invoiceData.notes || "Services provided",
          Quantity: 1,
          UnitAmount: Number(invoiceData.subtotal),
          TaxType: invoiceData.taxAmount && Number(invoiceData.taxAmount) > 0 ? "OUTPUT2" : "NONE", // OUTPUT2 = 20% VAT
        },
      ],
      LineAmountTypes: "Exclusive" as const,
      CurrencyCode: "GBP",
    };

    // Push to Xero
    const result = await xeroClient.createOrUpdateInvoice(tenantId, xeroInvoice);

    if (!result) {
      throw new Error("Xero API returned no data");
    }

    // Update invoice with Xero ID and sync status
    await db
      .update(invoices)
      .set({
        xeroInvoiceId: result.InvoiceID,
        xeroSyncStatus: "synced",
        xeroLastSyncedAt: new Date(),
        xeroSyncError: null,
      })
      .where(eq(invoices.id, invoiceId));

    console.log(`Invoice ${invoiceId} synced to Xero successfully (InvoiceID: ${result.InvoiceID})`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync status to error
    await db
      .update(invoices)
      .set({
        xeroSyncStatus: "error",
        xeroSyncError: errorMessage,
      })
      .where(eq(invoices.id, invoiceId));

    Sentry.captureException(error, {
      tags: { operation: "syncInvoiceToXero" },
      extra: { invoiceId, tenantId },
    });

    console.error(`Failed to sync invoice ${invoiceId} to Xero:`, error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Sync a payment to Xero
 *
 * Creates a payment record in Xero for an invoice
 */
export async function syncPaymentToXero(
  invoiceId: string,
  tenantId: string,
  paymentAmount: number,
  paymentDate: Date,
  bankAccountCode = "200", // Default bank account code
  reference?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch invoice to ensure it's synced to Xero
    const invoice = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
      .limit(1);

    if (invoice.length === 0) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const invoiceData = invoice[0];

    // Ensure invoice is synced to Xero first
    if (!invoiceData.xeroInvoiceId) {
      console.log(`Invoice ${invoiceId} not synced to Xero yet, syncing now...`);
      const invoiceSyncResult = await syncInvoiceToXero(invoiceId, tenantId);
      if (!invoiceSyncResult.success) {
        throw new Error(`Failed to sync invoice first: ${invoiceSyncResult.error}`);
      }

      // Re-fetch invoice to get Xero ID
      const updatedInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);

      if (updatedInvoice.length === 0 || !updatedInvoice[0].xeroInvoiceId) {
        throw new Error("Invoice sync failed - no Xero invoice ID");
      }

      invoiceData.xeroInvoiceId = updatedInvoice[0].xeroInvoiceId;
    }

    // Create payment in Xero
    const xeroPayment = {
      Invoice: {
        InvoiceID: invoiceData.xeroInvoiceId,
      },
      Account: {
        Code: bankAccountCode,
      },
      Date: paymentDate.toISOString().split("T")[0], // YYYY-MM-DD
      Amount: paymentAmount,
      Reference: reference,
    };

    const result = await xeroClient.createPayment(tenantId, xeroPayment);

    if (!result) {
      throw new Error("Xero API returned no data");
    }

    console.log(`Payment synced to Xero successfully (PaymentID: ${result.PaymentID})`);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    Sentry.captureException(error, {
      tags: { operation: "syncPaymentToXero" },
      extra: { invoiceId, tenantId, paymentAmount },
    });

    console.error(`Failed to sync payment for invoice ${invoiceId} to Xero:`, error);

    return { success: false, error: errorMessage };
  }
}

/**
 * Mark entity as pending sync
 *
 * Called when an entity is created/updated in Practice Hub
 */
export async function markClientAsPendingSync(clientId: string): Promise<void> {
  await db
    .update(clients)
    .set({
      xeroSyncStatus: "pending",
      xeroSyncError: null,
    })
    .where(eq(clients.id, clientId));
}

export async function markInvoiceAsPendingSync(invoiceId: string): Promise<void> {
  await db
    .update(invoices)
    .set({
      xeroSyncStatus: "pending",
      xeroSyncError: null,
    })
    .where(eq(invoices.id, invoiceId));
}

/**
 * Retry failed syncs
 *
 * Queries for entities with sync errors and retries them
 */
export async function retryFailedSyncs(
  tenantId: string,
): Promise<{ clientsRetried: number; invoicesRetried: number }> {
  let clientsRetried = 0;
  let invoicesRetried = 0;

  try {
    // Retry failed client syncs
    const failedClients = await db
      .select()
      .from(clients)
      .where(and(eq(clients.tenantId, tenantId), eq(clients.xeroSyncStatus, "error")))
      .limit(50); // Batch size

    for (const client of failedClients) {
      const result = await syncClientToXero(client.id, tenantId);
      if (result.success) {
        clientsRetried++;
      }
    }

    // Retry failed invoice syncs
    const failedInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.tenantId, tenantId), eq(invoices.xeroSyncStatus, "error")))
      .limit(50); // Batch size

    for (const invoice of failedInvoices) {
      const result = await syncInvoiceToXero(invoice.id, tenantId);
      if (result.success) {
        invoicesRetried++;
      }
    }

    console.log(
      `Retry complete: ${clientsRetried} clients, ${invoicesRetried} invoices synced successfully`,
    );

    return { clientsRetried, invoicesRetried };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "retryFailedSyncs" },
      extra: { tenantId },
    });
    console.error("Failed to retry syncs:", error);
    throw error;
  }
}

/**
 * Process pending syncs
 *
 * Queries for entities marked as "pending" and syncs them to Xero
 */
export async function processPendingSyncs(
  tenantId: string,
): Promise<{ clientsSynced: number; invoicesSynced: number }> {
  let clientsSynced = 0;
  let invoicesSynced = 0;

  try {
    // Process pending client syncs
    const pendingClients = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.tenantId, tenantId),
          or(eq(clients.xeroSyncStatus, "pending"), isNull(clients.xeroSyncStatus)),
        ),
      )
      .limit(50); // Batch size

    for (const client of pendingClients) {
      const result = await syncClientToXero(client.id, tenantId);
      if (result.success) {
        clientsSynced++;
      }
    }

    // Process pending invoice syncs
    const pendingInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          or(eq(invoices.xeroSyncStatus, "pending"), isNull(invoices.xeroSyncStatus)),
        ),
      )
      .limit(50); // Batch size

    for (const invoice of pendingInvoices) {
      const result = await syncInvoiceToXero(invoice.id, tenantId);
      if (result.success) {
        invoicesSynced++;
      }
    }

    console.log(
      `Pending sync complete: ${clientsSynced} clients, ${invoicesSynced} invoices synced successfully`,
    );

    return { clientsSynced, invoicesSynced };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "processPendingSyncs" },
      extra: { tenantId },
    });
    console.error("Failed to process pending syncs:", error);
    throw error;
  }
}
