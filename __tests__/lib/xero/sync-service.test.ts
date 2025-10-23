/**
 * Tests for Xero Sync Service
 *
 * Tests two-way sync orchestration between Practice Hub and Xero
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  clients,
  integrationSettings,
  invoices,
  tenants,
} from "@/lib/db/schema";
import { encryptObject } from "@/lib/services/encryption";

// Hoist mock functions to module scope BEFORE mocking
const {
  mockGetCredentials,
  mockCreateOrUpdateContact,
  mockCreateOrUpdateInvoice,
  mockCreatePayment,
} = vi.hoisted(() => ({
  mockGetCredentials: vi.fn(),
  mockCreateOrUpdateContact: vi.fn(),
  mockCreateOrUpdateInvoice: vi.fn(),
  mockCreatePayment: vi.fn(),
}));

// Mock XeroApiClient before importing sync-service
vi.mock("@/lib/xero/api-client", () => ({
  XeroApiClient: vi.fn().mockImplementation(() => ({
    getCredentials: mockGetCredentials,
    createOrUpdateContact: mockCreateOrUpdateContact,
    createOrUpdateInvoice: mockCreateOrUpdateInvoice,
    createPayment: mockCreatePayment,
  })),
}));

// Import after mocking
import {
  markClientAsPendingSync,
  markInvoiceAsPendingSync,
  processPendingSyncs,
  retryFailedSyncs,
  syncClientToXero,
  syncInvoiceToXero,
} from "@/lib/xero/sync-service";

describe("Xero Sync Service", () => {
  // Use valid UUIDs for testing
  const testTenantId = "550e8400-e29b-41d4-a716-446655440000";
  const testClientId = "550e8400-e29b-41d4-a716-446655440001";
  const testInvoiceId = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(async () => {
    // Clear test data (order matters due to foreign key constraints)
    await db.delete(invoices).where(eq(invoices.tenantId, testTenantId));
    await db.delete(clients).where(eq(clients.tenantId, testTenantId));
    await db
      .delete(integrationSettings)
      .where(eq(integrationSettings.tenantId, testTenantId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));

    // Create test tenant
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Tenant",
      slug: "test-tenant",
    });

    // Reset mocks
    vi.clearAllMocks();
    mockGetCredentials.mockReset();
    mockCreateOrUpdateContact.mockReset();
    mockCreateOrUpdateInvoice.mockReset();
    mockCreatePayment.mockReset();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe("syncClientToXero", () => {
    it("should sync a new client to Xero successfully", async () => {
      // Setup: Create test client
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
        phone: "01234567890",
        addressLine1: "123 Test St",
        city: "London",
        postalCode: "SW1A 1AA",
        vatNumber: "GB123456789",
      });

      // Setup: Create Xero integration settings
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

      // Mock: XeroApiClient methods
      mockGetCredentials.mockResolvedValue(credentials);
      mockCreateOrUpdateContact.mockResolvedValue({
        ContactID: "xero-contact-123",
      });

      // Execute: Sync client to Xero
      const result = await syncClientToXero(testClientId, testTenantId);

      // Assert: Sync successful
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Assert: Client updated with Xero ID and sync status
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId))
        .limit(1);

      expect(updatedClient[0].xeroContactId).toBe("xero-contact-123");
      expect(updatedClient[0].xeroSyncStatus).toBe("synced");
      expect(updatedClient[0].xeroLastSyncedAt).toBeTruthy();
      expect(updatedClient[0].xeroSyncError).toBeNull();
    });

    it("should handle sync errors and update status", async () => {
      // Setup: Create test client
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
      });

      // Setup: Create Xero integration settings
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

      // Mock: XeroApiClient to throw error
      mockGetCredentials.mockResolvedValue(credentials);
      mockCreateOrUpdateContact.mockRejectedValue(
        new Error("Xero API error: Rate limit exceeded"),
      );

      // Execute: Sync client to Xero
      const result = await syncClientToXero(testClientId, testTenantId);

      // Assert: Sync failed
      expect(result.success).toBe(false);
      expect(result.error).toBe("Xero API error: Rate limit exceeded");

      // Assert: Client updated with error status
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId))
        .limit(1);

      expect(updatedClient[0].xeroSyncStatus).toBe("error");
      expect(updatedClient[0].xeroSyncError).toBe(
        "Xero API error: Rate limit exceeded",
      );
    });
  });

  describe("syncInvoiceToXero", () => {
    it("should sync invoice and auto-sync client if needed", async () => {
      // Setup: Create test client (not yet synced)
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
        xeroContactId: null, // Not synced yet
      });

      // Setup: Create test invoice
      await db.insert(invoices).values({
        id: testInvoiceId,
        tenantId: testTenantId,
        clientId: testClientId,
        invoiceNumber: "INV-001",
        issueDate: new Date("2025-01-01"),
        dueDate: new Date("2025-01-31"),
        subtotal: "1000.00",
        taxAmount: "200.00",
        total: "1200.00",
        status: "draft",
      });

      // Setup: Create Xero integration settings
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

      // Mock: XeroApiClient methods
      mockGetCredentials.mockResolvedValue(credentials);
      mockCreateOrUpdateContact.mockResolvedValue({
        ContactID: "xero-contact-123",
      });
      mockCreateOrUpdateInvoice.mockResolvedValue({
        InvoiceID: "xero-invoice-123",
      });

      // Execute: Sync invoice to Xero
      const result = await syncInvoiceToXero(testInvoiceId, testTenantId);

      // Assert: Sync successful
      expect(result.success).toBe(true);

      // Assert: Client was auto-synced first
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId))
        .limit(1);

      expect(updatedClient[0].xeroContactId).toBe("xero-contact-123");
      expect(updatedClient[0].xeroSyncStatus).toBe("synced");

      // Assert: Invoice synced with Xero ID
      const updatedInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId))
        .limit(1);

      expect(updatedInvoice[0].xeroInvoiceId).toBe("xero-invoice-123");
      expect(updatedInvoice[0].xeroSyncStatus).toBe("synced");
      expect(updatedInvoice[0].xeroLastSyncedAt).toBeTruthy();
    });
  });

  describe("markClientAsPendingSync", () => {
    it("should mark client as pending sync", async () => {
      // Setup: Create test client
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
        xeroSyncStatus: "synced",
      });

      // Execute: Mark as pending
      await markClientAsPendingSync(testClientId);

      // Assert: Status updated to pending
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId))
        .limit(1);

      expect(updatedClient[0].xeroSyncStatus).toBe("pending");
      expect(updatedClient[0].xeroSyncError).toBeNull();
    });
  });

  describe("markInvoiceAsPendingSync", () => {
    it("should mark invoice as pending sync", async () => {
      // Setup: Create test client and invoice
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
      });

      await db.insert(invoices).values({
        id: testInvoiceId,
        tenantId: testTenantId,
        clientId: testClientId,
        invoiceNumber: "INV-001",
        issueDate: new Date("2025-01-01"),
        dueDate: new Date("2025-01-31"),
        subtotal: "1000.00",
        total: "1000.00",
        status: "draft",
        xeroSyncStatus: "synced",
      });

      // Execute: Mark as pending
      await markInvoiceAsPendingSync(testInvoiceId);

      // Assert: Status updated to pending
      const updatedInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, testInvoiceId))
        .limit(1);

      expect(updatedInvoice[0].xeroSyncStatus).toBe("pending");
      expect(updatedInvoice[0].xeroSyncError).toBeNull();
    });
  });

  describe("processPendingSyncs", () => {
    it("should process all pending syncs for a tenant", async () => {
      // Setup: Create test clients with pending sync status
      await db.insert(clients).values([
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          tenantId: testTenantId,
          clientCode: "TEST001",
          name: "Client 1",
          type: "limited_company",
          status: "active",
          email: "client1@example.com",
          xeroSyncStatus: "pending",
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440012",
          tenantId: testTenantId,
          clientCode: "TEST002",
          name: "Client 2",
          type: "limited_company",
          status: "active",
          email: "client2@example.com",
          xeroSyncStatus: null, // Also counts as pending
        },
      ]);

      // Setup: Create Xero integration settings
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

      // Mock: XeroApiClient methods
      mockGetCredentials.mockResolvedValue(credentials);

      let contactIdCounter = 0;
      mockCreateOrUpdateContact.mockImplementation(async () => {
        contactIdCounter++;
        return { ContactID: `xero-contact-${contactIdCounter}` };
      });

      // Execute: Process pending syncs
      const result = await processPendingSyncs(testTenantId);

      // Assert: Both clients synced
      expect(result.clientsSynced).toBe(2);
      expect(result.invoicesSynced).toBe(0);
    });
  });

  describe("retryFailedSyncs", () => {
    it("should retry all failed syncs for a tenant", async () => {
      // Setup: Create test client with error status
      await db.insert(clients).values({
        id: testClientId,
        tenantId: testTenantId,
        clientCode: "TEST001",
        name: "Test Company Ltd",
        type: "limited_company",
        status: "active",
        email: "test@example.com",
        xeroSyncStatus: "error",
        xeroSyncError: "Previous error",
      });

      // Setup: Create Xero integration settings
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

      // Mock: XeroApiClient methods (now succeeds)
      mockGetCredentials.mockResolvedValue(credentials);
      mockCreateOrUpdateContact.mockResolvedValue({
        ContactID: "xero-contact-123",
      });

      // Execute: Retry failed syncs
      const result = await retryFailedSyncs(testTenantId);

      // Assert: Client retried successfully
      expect(result.clientsRetried).toBe(1);

      // Assert: Client status updated to synced
      const updatedClient = await db
        .select()
        .from(clients)
        .where(eq(clients.id, testClientId))
        .limit(1);

      expect(updatedClient[0].xeroSyncStatus).toBe("synced");
      expect(updatedClient[0].xeroSyncError).toBeNull();
    });
  });
});
