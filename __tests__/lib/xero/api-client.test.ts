/**
 * Tests for Xero API Client
 *
 * Tests Xero API interactions for creating/updating contacts, invoices, payments
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { integrationSettings, tenants } from "@/lib/db/schema";
import { encryptObject } from "@/lib/services/encryption";
import { XeroApiClient } from "@/lib/xero/api-client";

// Mock fetch
global.fetch = vi.fn();

describe("XeroApiClient", () => {
  const testTenantId = "550e8400-e29b-41d4-a716-446655440999"; // Different from sync-service tests
  const xeroClient = new XeroApiClient();

  beforeEach(async () => {
    // Clear test data (order matters due to foreign key constraints)
    await db
      .delete(integrationSettings)
      .where(eq(integrationSettings.tenantId, testTenantId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));

    // Create test tenant
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Tenant API",
      slug: "test-tenant-api",
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCredentials", () => {
    it("should return decrypted credentials", async () => {
      // Setup: Create integration settings with credentials
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Execute: Get credentials
      const result = await xeroClient.getCredentials(testTenantId);

      // Assert: Credentials returned and decrypted
      expect(result).toBeTruthy();
      expect(result?.accessToken).toBe("test-access-token");
      expect(result?.refreshToken).toBe("test-refresh-token");
      expect(result?.selectedTenantId).toBe("xero-tenant-123");
    });

    it("should return null if credentials not found", async () => {
      // Execute: Get credentials (no integration exists)
      const result = await xeroClient.getCredentials("non-existent-tenant");

      // Assert: Returns null
      expect(result).toBeNull();
    });

    it("should auto-refresh if token expires within 5 minutes", async () => {
      // Setup: Create integration with expiring token
      const credentials = {
        accessToken: "old-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // Expires in 2 minutes
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Token refresh response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
          expires_in: 1800,
          token_type: "Bearer",
        }),
      });

      // Execute: Get credentials (should trigger auto-refresh)
      const result = await xeroClient.getCredentials(testTenantId);

      // Assert: New credentials returned
      expect(result).toBeTruthy();
      expect(result?.accessToken).toBe("new-access-token");
      expect(result?.refreshToken).toBe("new-refresh-token");

      // Assert: Credentials updated in database
      const updatedSettings = await db
        .select()
        .from(integrationSettings)
        .where(eq(integrationSettings.tenantId, testTenantId))
        .limit(1);

      expect(updatedSettings[0]).toBeTruthy();
    });
  });

  describe("createOrUpdateContact", () => {
    it("should create a contact in Xero", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Contacts: [
            {
              ContactID: "xero-contact-123",
              Name: "Test Company Ltd",
              EmailAddress: "test@example.com",
            },
          ],
        }),
      });

      // Execute: Create contact
      const contact = {
        Name: "Test Company Ltd",
        EmailAddress: "test@example.com",
        AccountNumber: "TEST001",
        IsCustomer: true,
        IsSupplier: false,
      };

      const result = await xeroClient.createOrUpdateContact(
        testTenantId,
        contact,
      );

      // Assert: Contact created successfully
      expect(result).toBeTruthy();
      expect(result?.ContactID).toBe("xero-contact-123");

      // Assert: Correct API call made
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.xero.com/api.xro/2.0/Contacts",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "Xero-Tenant-Id": "xero-tenant-123",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ Contacts: [contact] }),
        }),
      );
    });

    it("should handle API errors", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API error
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limit exceeded",
      });

      // Execute & Assert: Should throw error
      const contact = {
        Name: "Test Company Ltd",
        EmailAddress: "test@example.com",
        IsCustomer: true,
        IsSupplier: false,
      };

      await expect(
        xeroClient.createOrUpdateContact(testTenantId, contact),
      ).rejects.toThrow("Xero API error: 429");
    });
  });

  describe("createOrUpdateInvoice", () => {
    it("should create an invoice in Xero", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Invoices: [
            {
              InvoiceID: "xero-invoice-123",
              InvoiceNumber: "INV-001",
              Type: "ACCREC",
            },
          ],
        }),
      });

      // Execute: Create invoice
      const invoice = {
        Type: "ACCREC" as const,
        Contact: {
          ContactID: "xero-contact-123",
        },
        Date: "2025-01-01",
        DueDate: "2025-01-31",
        InvoiceNumber: "INV-001",
        LineItems: [
          {
            Description: "Test services",
            Quantity: 1,
            UnitAmount: 1000,
            TaxType: "OUTPUT2",
          },
        ],
        LineAmountTypes: "Exclusive" as const,
        CurrencyCode: "GBP",
      };

      const result = await xeroClient.createOrUpdateInvoice(
        testTenantId,
        invoice,
      );

      // Assert: Invoice created successfully
      expect(result).toBeTruthy();
      expect(result?.InvoiceID).toBe("xero-invoice-123");

      // Assert: Correct API call made
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.xero.com/api.xro/2.0/Invoices",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "Xero-Tenant-Id": "xero-tenant-123",
          }),
        }),
      );
    });
  });

  describe("createPayment", () => {
    it("should create a payment in Xero", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Payments: [
            {
              PaymentID: "xero-payment-123",
              Amount: 1000.0,
            },
          ],
        }),
      });

      // Execute: Create payment
      const payment = {
        Invoice: {
          InvoiceID: "xero-invoice-123",
        },
        Account: {
          Code: "200",
        },
        Date: "2025-01-15",
        Amount: 1000,
        Reference: "Payment received",
      };

      const result = await xeroClient.createPayment(testTenantId, payment);

      // Assert: Payment created successfully
      expect(result).toBeTruthy();
      expect(result?.PaymentID).toBe("xero-payment-123");
    });
  });

  describe("getContact", () => {
    it("should fetch a contact from Xero", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Contacts: [
            {
              ContactID: "xero-contact-123",
              Name: "Test Company Ltd",
              EmailAddress: "test@example.com",
            },
          ],
        }),
      });

      // Execute: Get contact
      const result = await xeroClient.getContact(
        testTenantId,
        "xero-contact-123",
      );

      // Assert: Contact fetched successfully
      expect(result).toBeTruthy();
      expect(result?.ContactID).toBe("xero-contact-123");
      expect(result?.Name).toBe("Test Company Ltd");
    });

    it("should return null if contact not found", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API 404 response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Contact not found",
      });

      // Execute: Get contact
      const result = await xeroClient.getContact(testTenantId, "non-existent");

      // Assert: Returns null
      expect(result).toBeNull();
    });
  });

  describe("getInvoice", () => {
    it("should fetch an invoice from Xero", async () => {
      // Setup: Create integration settings
      const credentials = {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        selectedTenantId: "xero-tenant-123",
        tokenType: "Bearer",
        scope: "accounting.transactions",
      };

      await db.insert(integrationSettings).values({
        tenantId: testTenantId,
        integrationType: "xero",
        enabled: true,
        credentials: encryptObject(credentials),
        syncStatus: "connected",
      });

      // Mock: Xero API response
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          Invoices: [
            {
              InvoiceID: "xero-invoice-123",
              InvoiceNumber: "INV-001",
              Type: "ACCREC",
            },
          ],
        }),
      });

      // Execute: Get invoice
      const result = await xeroClient.getInvoice(
        testTenantId,
        "xero-invoice-123",
      );

      // Assert: Invoice fetched successfully
      expect(result).toBeTruthy();
      expect(result?.InvoiceID).toBe("xero-invoice-123");
      expect(result?.InvoiceNumber).toBe("INV-001");
    });
  });
});
