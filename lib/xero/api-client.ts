/**
 * Xero API Client - Push data from Practice Hub to Xero
 *
 * Handles two-way sync: Practice Hub → Xero
 * - Create/update contacts (clients)
 * - Create/update invoices
 * - Create/update payments
 * - Auto token refresh
 *
 * Based on original CRM app architecture
 */

import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrationSettings } from "@/lib/db/schema";
import { decryptObject, encryptObject } from "@/lib/services/encryption";

interface XeroCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  selectedTenantId: string;
  tokenType: string;
  scope: string;
  [key: string]: unknown;
}

interface XeroContact {
  ContactID?: string;
  Name: string;
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  Addresses?: Array<{
    AddressType: "POBOX" | "STREET";
    AddressLine1?: string;
    AddressLine2?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
  }>;
  Phones?: Array<{
    PhoneType: "DEFAULT" | "DDI" | "MOBILE" | "FAX";
    PhoneNumber: string;
  }>;
  TaxNumber?: string; // VAT number
  AccountNumber?: string; // Client code
  IsSupplier?: boolean;
  IsCustomer?: boolean;
}

interface XeroInvoice {
  InvoiceID?: string;
  Type: "ACCREC" | "ACCPAY"; // ACCREC = sales invoice, ACCPAY = bill
  Contact: {
    ContactID?: string;
    Name?: string;
  };
  Date: string; // YYYY-MM-DD
  DueDate: string; // YYYY-MM-DD
  LineItems: Array<{
    Description: string;
    Quantity: number;
    UnitAmount: number;
    AccountCode?: string;
    TaxType?: string;
    LineAmount?: number;
  }>;
  InvoiceNumber?: string;
  Reference?: string;
  Status?: "DRAFT" | "SUBMITTED" | "AUTHORISED";
  CurrencyCode?: string;
  LineAmountTypes?: "Exclusive" | "Inclusive" | "NoTax";
}

interface XeroPayment {
  Invoice: {
    InvoiceID: string;
  };
  Account: {
    Code: string; // Bank account code
  };
  Date: string; // YYYY-MM-DD
  Amount: number;
  Reference?: string;
}

/**
 * Xero API Client for pushing data to Xero
 */
export class XeroApiClient {
  private baseUrl = "https://api.xero.com/api.xro/2.0";

  /**
   * Get Xero credentials for a tenant
   * Automatically refreshes if expired
   */
  async getCredentials(tenantId: string): Promise<XeroCredentials | null> {
    try {
      const settings = await db
        .select()
        .from(integrationSettings)
        .where(
          and(
            eq(integrationSettings.tenantId, tenantId),
            eq(integrationSettings.integrationType, "xero"),
            eq(integrationSettings.enabled, true),
          ),
        )
        .limit(1);

      if (settings.length === 0 || !settings[0].credentials) {
        return null;
      }

      const credentials = decryptObject<XeroCredentials>(
        settings[0].credentials,
      );

      // Check if token is expired or expires within 5 minutes
      const expiresAt = new Date(credentials.expiresAt);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        // Refresh token
        return await this.refreshToken(tenantId, credentials);
      }

      return credentials;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "getXeroCredentials" },
        extra: { tenantId },
      });
      console.error("Failed to get Xero credentials:", error);
      return null;
    }
  }

  /**
   * Refresh Xero access token
   */
  private async refreshToken(
    tenantId: string,
    credentials: XeroCredentials,
  ): Promise<XeroCredentials> {
    try {
      const response = await fetch("https://identity.xero.com/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: credentials.refreshToken,
          client_id: process.env.XERO_CLIENT_ID!,
          client_secret: process.env.XERO_CLIENT_SECRET!,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const updatedCredentials: XeroCredentials = {
        ...credentials,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      };

      // Save updated credentials
      await db
        .update(integrationSettings)
        .set({
          credentials: encryptObject(updatedCredentials),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(integrationSettings.tenantId, tenantId),
            eq(integrationSettings.integrationType, "xero"),
          ),
        );

      return updatedCredentials;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "refreshXeroToken" },
        extra: { tenantId },
      });
      throw error;
    }
  }

  /**
   * Create or update a contact in Xero
   */
  async createOrUpdateContact(
    tenantId: string,
    contact: XeroContact,
  ): Promise<{ ContactID: string } | null> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) {
        throw new Error("Xero credentials not found or disabled");
      }

      const response = await fetch(`${this.baseUrl}/Contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Xero-Tenant-Id": credentials.selectedTenantId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Contacts: [contact] }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Xero API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.Contacts[0];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "createOrUpdateXeroContact" },
        extra: { tenantId, contactName: contact.Name },
      });
      throw error;
    }
  }

  /**
   * Create or update an invoice in Xero
   */
  async createOrUpdateInvoice(
    tenantId: string,
    invoice: XeroInvoice,
  ): Promise<{ InvoiceID: string } | null> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) {
        throw new Error("Xero credentials not found or disabled");
      }

      const response = await fetch(`${this.baseUrl}/Invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Xero-Tenant-Id": credentials.selectedTenantId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Invoices: [invoice] }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Xero API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.Invoices[0];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "createOrUpdateXeroInvoice" },
        extra: { tenantId, invoiceNumber: invoice.InvoiceNumber },
      });
      throw error;
    }
  }

  /**
   * Create a payment in Xero
   */
  async createPayment(
    tenantId: string,
    payment: XeroPayment,
  ): Promise<{ PaymentID: string } | null> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) {
        throw new Error("Xero credentials not found or disabled");
      }

      const response = await fetch(`${this.baseUrl}/Payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Xero-Tenant-Id": credentials.selectedTenantId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Payments: [payment] }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Xero API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.Payments[0];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "createXeroPayment" },
        extra: { tenantId },
      });
      throw error;
    }
  }

  /**
   * Get a contact from Xero by ID
   */
  async getContact(
    tenantId: string,
    contactId: string,
  ): Promise<XeroContact | null> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) {
        throw new Error("Xero credentials not found or disabled");
      }

      const response = await fetch(`${this.baseUrl}/Contacts/${contactId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Xero-Tenant-Id": credentials.selectedTenantId,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.text();
        throw new Error(`Xero API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.Contacts[0];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "getXeroContact" },
        extra: { tenantId, contactId },
      });
      return null;
    }
  }

  /**
   * Get an invoice from Xero by ID
   */
  async getInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<XeroInvoice | null> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) {
        throw new Error("Xero credentials not found or disabled");
      }

      const response = await fetch(`${this.baseUrl}/Invoices/${invoiceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          "Xero-Tenant-Id": credentials.selectedTenantId,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const error = await response.text();
        throw new Error(`Xero API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.Invoices[0];
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "getXeroInvoice" },
        extra: { tenantId, invoiceId },
      });
      return null;
    }
  }
}
