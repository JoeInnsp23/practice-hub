/**
 * Invoices Router Integration Tests
 *
 * Integration-level tests for the invoices tRPC router.
 * Tests verify database operations, tenant isolation, invoice calculations, and business logic.
 *
 * Cleanup Strategy: Unique test IDs + afterEach cleanup (per Task 0 spike findings)
 */

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { invoicesRouter } from "@/app/server/routers/invoices";
import { db } from "@/lib/db";
import { activityLogs, invoiceItems, invoices } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestClient,
  createTestInvoice,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("app/server/routers/invoices.ts (Integration)", () => {
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof invoicesRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    invoices: [],
  };
  let testClientId: string;

  beforeEach(async () => {
    // Create test tenant and user for each test
    const tenantId = await createTestTenant();
    const userId = await createTestUser(tenantId, { role: "admin" });

    tracker.tenants?.push(tenantId);
    tracker.users?.push(userId);

    // Create a test client for invoice tests
    const testClient = await createTestClient(tenantId, userId, {
      name: "Invoice Test Client",
    });
    testClientId = testClient.id;
    tracker.clients?.push(testClientId);

    // Create mock context with test tenant and user
    ctx = createMockContext({
      authContext: {
        userId,
        tenantId,
        organizationName: "Test Organization",
        role: "admin",
        email: `test-${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      },
    }) as TestContextWithAuth;

    caller = createCaller(invoicesRouter, ctx);
  });

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.invoices = [];
  });

  describe("create (Integration)", () => {
    it("should create invoice and persist to database", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-TEST-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxRate: "20.00",
        taxAmount: "200.00",
        discount: "0.00",
        total: "1200.00",
        amountPaid: "0.00",
        currency: "GBP",
        notes: "Test invoice notes",
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      expect(result.success).toBe(true);
      expect(result.invoice.id).toBeDefined();
      expect(result.invoice.invoiceNumber).toBe(input.invoiceNumber);
      expect(result.invoice.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.invoice.clientId).toBe(testClientId);
      expect(result.invoice.total).toBe("1200.00");

      // Verify database persistence
      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, result.invoice.id));

      expect(dbInvoice).toBeDefined();
      expect(dbInvoice.invoiceNumber).toBe(input.invoiceNumber);
      expect(dbInvoice.tenantId).toBe(ctx.authContext.tenantId);
      expect(dbInvoice.createdById).toBe(ctx.authContext.userId);
      expect(dbInvoice.subtotal).toBe("1000.00");
      expect(dbInvoice.taxAmount).toBe("200.00");
      expect(dbInvoice.total).toBe("1200.00");
    });

    it("should create invoice with items", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-ITEMS-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxRate: "20.00",
        taxAmount: "200.00",
        discount: "0.00",
        total: "1200.00",
        amountPaid: "0.00",
        currency: "GBP",
        items: [
          {
            description: "Consulting Services",
            quantity: "10.00",
            rate: "50.00",
            amount: "500.00",
          },
          {
            description: "Development Services",
            quantity: "5.00",
            rate: "100.00",
            amount: "500.00",
          },
        ],
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      expect(result.success).toBe(true);

      // Verify invoice items were created
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, result.invoice.id));

      expect(items.length).toBe(2);
      expect(items[0].description).toBe("Consulting Services");
      expect(items[0].quantity).toBe("10.00");
      expect(items[0].rate).toBe("50.00");
      expect(items[0].amount).toBe("500.00");
      expect(items[1].description).toBe("Development Services");
      expect(items[1].quantity).toBe("5.00");
      expect(items[1].rate).toBe("100.00");
    });

    it("should create activity log for invoice creation", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-LOG-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "500.00",
        taxRate: "20.00",
        taxAmount: "100.00",
        discount: "0.00",
        total: "600.00",
        amountPaid: "0.00",
        currency: "GBP",
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, result.invoice.id),
            eq(activityLogs.entityType, "invoice"),
            eq(activityLogs.action, "created"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain(input.invoiceNumber);
      expect(log.tenantId).toBe(ctx.authContext.tenantId);
    });

    it("should validate invoice calculations (subtotal + tax = total)", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-CALC-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxRate: "20.00",
        taxAmount: "200.00",
        discount: "50.00",
        total: "1150.00", // 1000 + 200 - 50 = 1150
        amountPaid: "0.00",
        currency: "GBP",
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      expect(result.success).toBe(true);
      expect(result.invoice.subtotal).toBe("1000.00");
      expect(result.invoice.taxAmount).toBe("200.00");
      expect(result.invoice.discount).toBe("50.00");
      expect(result.invoice.total).toBe("1150.00");
    });

    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        invoiceNumber: "INV-INVALID",
        clientId: testClientId,
      };

      await expect(
        caller.create(invalidInput as Record<string, unknown>),
      ).rejects.toThrow();
    });
  });

  describe("list (Integration)", () => {
    it("should list invoices with tenant isolation", async () => {
      // Create test invoices
      const invoice1 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: `INV-LIST-1-${Date.now()}`,
          status: "draft",
        },
      );
      const invoice2 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: `INV-LIST-2-${Date.now()}`,
          status: "sent",
        },
      );
      tracker.invoices?.push(invoice1.id, invoice2.id);

      const result = await caller.list({});

      expect(result.invoices).toBeDefined();
      expect(result.invoices.length).toBeGreaterThanOrEqual(2);

      // Verify tenant isolation
      for (const invoice of result.invoices) {
        expect(invoice.tenantId).toBe(ctx.authContext.tenantId);
      }

      // Verify our test invoices are in the list
      const invoiceIds = result.invoices.map(
        (i: (typeof result.invoices)[0]) => i.id,
      );
      expect(invoiceIds).toContain(invoice1.id);
      expect(invoiceIds).toContain(invoice2.id);
    });

    it("should filter invoices by search term (invoice number)", async () => {
      const uniqueNumber = `SEARCHABLE-${Date.now()}`;
      const invoice1 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: uniqueNumber,
        },
      );
      const invoice2 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: `OTHER-${Date.now()}`,
        },
      );
      tracker.invoices?.push(invoice1.id, invoice2.id);

      const result = await caller.list({ search: "SEARCHABLE" });

      expect(result.invoices.length).toBeGreaterThanOrEqual(1);
      const hasSearchableInvoice = result.invoices.some(
        (i: (typeof result.invoices)[0]) =>
          i.invoiceNumber.includes("SEARCHABLE"),
      );
      expect(hasSearchableInvoice).toBe(true);
    });

    it("should filter invoices by status", async () => {
      const invoice1 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          status: "paid",
        },
      );
      const invoice2 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          status: "draft",
        },
      );
      tracker.invoices?.push(invoice1.id, invoice2.id);

      const result = await caller.list({ status: "paid" });

      expect(result.invoices.length).toBeGreaterThanOrEqual(1);
      // All returned invoices should be paid
      for (const invoice of result.invoices) {
        expect(invoice.status).toBe("paid");
      }
    });

    it("should filter invoices by clientId", async () => {
      // Create another client
      const otherClient = await createTestClient(
        ctx.authContext.tenantId,
        ctx.authContext.userId,
        {
          name: "Other Client for Filter",
        },
      );
      tracker.clients?.push(otherClient.id);

      const invoice1 = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
      );
      const invoice2 = await createTestInvoice(
        ctx.authContext.tenantId,
        otherClient.id,
        ctx.authContext.userId,
      );
      tracker.invoices?.push(invoice1.id, invoice2.id);

      const result = await caller.list({ clientId: testClientId });

      expect(result.invoices.length).toBeGreaterThanOrEqual(1);
      // All returned invoices should belong to testClientId
      for (const invoice of result.invoices) {
        expect(invoice.clientId).toBe(testClientId);
      }
    });

    it("should filter overdue invoices", async () => {
      // Create an overdue invoice (sent status with past due date)
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // 10 days ago
      const overdueInvoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          status: "sent",
          dueDate: pastDate,
        },
      );
      tracker.invoices?.push(overdueInvoice.id);

      const result = await caller.list({ overdue: true });

      expect(result.invoices.length).toBeGreaterThanOrEqual(1);
      // All returned invoices should be overdue (sent status with past due date)
      for (const invoice of result.invoices) {
        expect(invoice.status).toBe("sent");
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        expect(dueDate < today).toBe(true);
      }
    });
  });

  describe("getById (Integration)", () => {
    it("should retrieve invoice by ID with items", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: `INV-GETBYID-${Date.now()}`,
        },
      );
      tracker.invoices?.push(invoice.id);

      // Add invoice items
      await db.insert(invoiceItems).values([
        {
          invoiceId: invoice.id,
          description: "Item 1",
          quantity: "1.00",
          rate: "100.00",
          amount: "100.00",
        },
        {
          invoiceId: invoice.id,
          description: "Item 2",
          quantity: "2.00",
          rate: "50.00",
          amount: "100.00",
        },
      ]);

      const result = await caller.getById(invoice.id);

      expect(result.id).toBe(invoice.id);
      expect(result.invoiceNumber).toBe(invoice.invoiceNumber);
      expect(result.tenantId).toBe(ctx.authContext.tenantId);
      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(2);
      expect(result.items[0].description).toBe("Item 1");
      expect(result.items[1].description).toBe("Item 2");
    });

    it("should throw NOT_FOUND for non-existent ID", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.getById(nonExistentId)).rejects.toThrow(
        "Invoice not found",
      );
    });

    it("should prevent cross-tenant access (CRITICAL)", async () => {
      // Create invoice for tenant A
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId, {
        name: "Tenant A Client",
      });
      tracker.clients?.push(clientA.id);

      const invoiceA = await createTestInvoice(tenantAId, clientA.id, userAId, {
        invoiceNumber: `INV-TENANT-A-${Date.now()}`,
      });
      tracker.invoices?.push(invoiceA.id);

      // Attempt to access tenant A's invoice from tenant B
      await expect(caller.getById(invoiceA.id)).rejects.toThrow(
        "Invoice not found",
      );

      // The error should be NOT_FOUND, not FORBIDDEN (data should be invisible)
      try {
        await caller.getById(invoiceA.id);
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update (Integration)", () => {
    it("should update invoice and persist changes", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: `INV-UPDATE-${Date.now()}`,
          status: "draft",
          notes: "Original notes",
        },
      );
      tracker.invoices?.push(invoice.id);

      const result = await caller.update({
        id: invoice.id,
        data: {
          status: "sent",
          notes: "Updated notes",
          dueDate: "2025-12-31",
        },
      });

      expect(result.invoice.status).toBe("sent");
      expect(result.invoice.notes).toBe("Updated notes");
      expect(result.invoice.dueDate).toBe("2025-12-31");

      // Verify database persistence
      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(dbInvoice.status).toBe("sent");
      expect(dbInvoice.notes).toBe("Updated notes");
      expect(dbInvoice.dueDate).toBe("2025-12-31");
    });

    it("should create activity log for update", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
      );
      tracker.invoices?.push(invoice.id);

      await caller.update({
        id: invoice.id,
        data: { status: "sent" },
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, invoice.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.entityType).toBe("invoice");
    });

    it("should throw NOT_FOUND for non-existent invoice", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.update({
          id: nonExistentId,
          data: { status: "sent" },
        }),
      ).rejects.toThrow("Invoice not found");
    });

    it("should prevent cross-tenant update", async () => {
      // Create invoice for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      const invoiceA = await createTestInvoice(tenantAId, clientA.id, userAId);
      tracker.invoices?.push(invoiceA.id);

      // Attempt to update from different tenant
      await expect(
        caller.update({
          id: invoiceA.id,
          data: { status: "paid" },
        }),
      ).rejects.toThrow("Invoice not found");
    });

    it("should allow partial updates", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: "INV-PARTIAL",
          status: "draft",
          notes: "Original notes",
          total: "1000.00",
        },
      );
      tracker.invoices?.push(invoice.id);

      // Update only notes
      await caller.update({
        id: invoice.id,
        data: { notes: "Updated notes only" },
      });

      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      // Notes should be updated
      expect(dbInvoice.notes).toBe("Updated notes only");
      // Other fields should remain unchanged
      expect(dbInvoice.status).toBe("draft");
      expect(dbInvoice.total).toBe("1000.00");
    });
  });

  describe("updateStatus (Integration)", () => {
    it("should update invoice status and persist changes", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          status: "draft",
        },
      );
      tracker.invoices?.push(invoice.id);

      const result = await caller.updateStatus({
        id: invoice.id,
        status: "sent",
      });

      expect(result.invoice.status).toBe("sent");

      // Verify database persistence
      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(dbInvoice.status).toBe("sent");
    });

    it("should create activity log for status update", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          status: "draft",
        },
      );
      tracker.invoices?.push(invoice.id);

      await caller.updateStatus({
        id: invoice.id,
        status: "paid",
      });

      // Verify activity log
      const logs = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, invoice.id),
            eq(activityLogs.action, "updated"),
          ),
        );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      const log = logs[logs.length - 1]; // Get most recent
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("status");
    });

    it("should throw NOT_FOUND for non-existent invoice", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(
        caller.updateStatus({
          id: nonExistentId,
          status: "paid",
        }),
      ).rejects.toThrow("Invoice not found");
    });

    it("should prevent cross-tenant status update", async () => {
      // Create invoice for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      const invoiceA = await createTestInvoice(tenantAId, clientA.id, userAId);
      tracker.invoices?.push(invoiceA.id);

      // Attempt to update status from different tenant
      await expect(
        caller.updateStatus({
          id: invoiceA.id,
          status: "paid",
        }),
      ).rejects.toThrow("Invoice not found");
    });
  });

  describe("delete (Integration)", () => {
    it("should delete invoice and invoice items", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
      );
      tracker.invoices?.push(invoice.id);

      // Add invoice items
      await db.insert(invoiceItems).values([
        {
          invoiceId: invoice.id,
          description: "Item to delete",
          quantity: "1.00",
          rate: "100.00",
          amount: "100.00",
        },
      ]);

      const result = await caller.delete(invoice.id);

      expect(result.success).toBe(true);

      // Verify invoice is deleted
      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(dbInvoice).toBeUndefined();

      // Verify invoice items are also deleted (cascade)
      const items = await db
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoice.id));

      expect(items.length).toBe(0);
    });

    it("should create activity log for deletion", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          invoiceNumber: "INV-DELETE-LOG",
        },
      );
      tracker.invoices?.push(invoice.id);

      await caller.delete(invoice.id);

      // Verify activity log
      const [log] = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityId, invoice.id),
            eq(activityLogs.action, "deleted"),
          ),
        );

      expect(log).toBeDefined();
      expect(log.userId).toBe(ctx.authContext.userId);
      expect(log.description).toContain("INV-DELETE-LOG");
      expect(log.entityType).toBe("invoice");
    });

    it("should throw NOT_FOUND for non-existent invoice", async () => {
      const nonExistentId = crypto.randomUUID();

      await expect(caller.delete(nonExistentId)).rejects.toThrow(
        "Invoice not found",
      );
    });

    it("should prevent cross-tenant deletion", async () => {
      // Create invoice for different tenant
      const tenantAId = await createTestTenant();
      const userAId = await createTestUser(tenantAId);
      tracker.tenants?.push(tenantAId);
      tracker.users?.push(userAId);

      const clientA = await createTestClient(tenantAId, userAId);
      tracker.clients?.push(clientA.id);

      const invoiceA = await createTestInvoice(tenantAId, clientA.id, userAId);
      tracker.invoices?.push(invoiceA.id);

      // Attempt to delete from different tenant
      await expect(caller.delete(invoiceA.id)).rejects.toThrow(
        "Invoice not found",
      );

      // Verify invoice still exists
      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceA.id));

      expect(dbInvoice).toBeDefined();
    });
  });

  describe("Invoice Calculations", () => {
    it("should handle invoice with discount correctly", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-DISCOUNT-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxRate: "20.00",
        taxAmount: "200.00",
        discount: "100.00",
        total: "1100.00", // 1000 + 200 - 100
        amountPaid: "0.00",
        currency: "GBP",
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      expect(result.invoice.subtotal).toBe("1000.00");
      expect(result.invoice.taxAmount).toBe("200.00");
      expect(result.invoice.discount).toBe("100.00");
      expect(result.invoice.total).toBe("1100.00");
    });

    it("should handle partial payments correctly", async () => {
      const invoice = await createTestInvoice(
        ctx.authContext.tenantId,
        testClientId,
        ctx.authContext.userId,
        {
          total: "1000.00",
          amountPaid: "0.00",
          status: "sent",
        },
      );
      tracker.invoices?.push(invoice.id);

      // Update with partial payment
      await caller.update({
        id: invoice.id,
        data: {
          amountPaid: "500.00",
        },
      });

      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(dbInvoice.total).toBe("1000.00");
      expect(dbInvoice.amountPaid).toBe("500.00");
      // Remaining balance: 500.00
    });

    it("should handle zero tax invoices", async () => {
      const timestamp = Date.now();
      const input = {
        invoiceNumber: `INV-NOTAX-${timestamp}`,
        clientId: testClientId,
        issueDate: "2025-01-01",
        dueDate: "2025-01-31",
        status: "draft" as const,
        subtotal: "1000.00",
        taxRate: "0.00",
        taxAmount: "0.00",
        discount: "0.00",
        total: "1000.00",
        amountPaid: "0.00",
        currency: "GBP",
      };

      const result = await caller.create(input);
      tracker.invoices?.push(result.invoice.id);

      expect(result.invoice.subtotal).toBe("1000.00");
      expect(result.invoice.taxAmount).toBe("0.00");
      expect(result.invoice.total).toBe("1000.00");
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(invoicesRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("updateStatus");
      expect(procedures).toContain("delete");
    });

    it("should have 6 procedures total", () => {
      const procedures = Object.keys(invoicesRouter._def.procedures);
      expect(procedures).toHaveLength(6);
    });
  });
});
