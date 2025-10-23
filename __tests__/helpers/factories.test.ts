/**
 * Test Data Factory Tests
 *
 * Validates that factory functions create correct test data
 * and cleanup works properly.
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  clients,
  documents,
  invoices,
  tasks,
  tenants,
  users,
} from "@/lib/db/schema";
import {
  cleanupTestData,
  createCompleteTestSetup,
  createTestClient,
  createTestClients,
  createTestDocument,
  createTestInvoice,
  createTestTask,
  createTestTasks,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "./factories";

describe("Test Data Factories", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    tasks: [],
    invoices: [],
    documents: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker
    tracker.tenants = [];
    tracker.users = [];
    tracker.clients = [];
    tracker.tasks = [];
    tracker.invoices = [];
    tracker.documents = [];
  });

  describe("createTestTenant", () => {
    it("should create a tenant with unique slug", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));

      expect(tenant).toBeDefined();
      expect(tenant.id).toBe(tenantId);
      expect(tenant.slug).toContain("test-tenant-");
      expect(tenant.name).toContain("Test Tenant");
    });

    it("should accept overrides", async () => {
      const tenantId = await createTestTenant({
        name: "Custom Tenant Name",
        slug: `custom-slug-${Date.now()}`,
      });
      tracker.tenants?.push(tenantId);

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));

      expect(tenant.name).toBe("Custom Tenant Name");
      expect(tenant.slug).toContain("custom-slug-");
    });
  });

  describe("createTestUser", () => {
    it("should create a user with unique email", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
      expect(user.tenantId).toBe(tenantId);
      expect(user.email).toContain("test-user-");
      expect(user.email).toContain("@example.com");
      expect(user.role).toBe("user");
    });

    it("should accept overrides", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, {
        email: `custom-${Date.now()}@example.com`,
        role: "admin",
        firstName: "Custom",
        lastName: "Name",
      });
      tracker.users?.push(userId);

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      expect(user.email).toContain("custom-");
      expect(user.role).toBe("admin");
      expect(user.firstName).toBe("Custom");
      expect(user.lastName).toBe("Name");
    });
  });

  describe("createTestClient", () => {
    it("should create a client with unique client code", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId);
      tracker.clients?.push(client.id);

      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));

      expect(dbClient).toBeDefined();
      expect(dbClient.tenantId).toBe(tenantId);
      expect(dbClient.createdBy).toBe(userId);
      expect(dbClient.clientCode).toContain("TEST-CLIENT-");
      expect(dbClient.name).toContain("Test Client");
      expect(dbClient.type).toBe("limited_company");
      expect(dbClient.status).toBe("active");
    });

    it("should accept overrides", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);

      const client = await createTestClient(tenantId, userId, {
        clientCode: `CUSTOM-${Date.now()}`,
        name: "Custom Client Name",
        type: "individual",
        status: "onboarding",
        email: "client@example.com",
      });
      tracker.clients?.push(client.id);

      expect(client.clientCode).toContain("CUSTOM-");
      expect(client.name).toBe("Custom Client Name");
      expect(client.type).toBe("individual");
      expect(client.status).toBe("onboarding");
      expect(client.email).toBe("client@example.com");
    });
  });

  describe("createTestTask", () => {
    it("should create a task with unique title", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      const client = await createTestClient(tenantId, userId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);
      tracker.clients?.push(client.id);

      const task = await createTestTask(tenantId, client.id, userId);
      tracker.tasks?.push(task.id);

      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));

      expect(dbTask).toBeDefined();
      expect(dbTask.tenantId).toBe(tenantId);
      expect(dbTask.clientId).toBe(client.id);
      expect(dbTask.createdById).toBe(userId);
      expect(dbTask.title).toContain("Test Task");
      expect(dbTask.status).toBe("pending");
      expect(dbTask.priority).toBe("medium");
    });
  });

  describe("createTestInvoice", () => {
    it("should create an invoice with unique invoice number", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      const client = await createTestClient(tenantId, userId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);
      tracker.clients?.push(client.id);

      const invoice = await createTestInvoice(tenantId, client.id, userId);
      tracker.invoices?.push(invoice.id);

      const [dbInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoice.id));

      expect(dbInvoice).toBeDefined();
      expect(dbInvoice.tenantId).toBe(tenantId);
      expect(dbInvoice.clientId).toBe(client.id);
      expect(dbInvoice.createdById).toBe(userId);
      expect(dbInvoice.invoiceNumber).toContain("INV-TEST-");
      expect(dbInvoice.status).toBe("draft");
      expect(dbInvoice.currency).toBe("GBP");
    });
  });

  describe("createTestDocument", () => {
    it("should create a document with unique file name", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      const client = await createTestClient(tenantId, userId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);
      tracker.clients?.push(client.id);

      const document = await createTestDocument(tenantId, client.id, userId);
      tracker.documents?.push(document.id);

      const [dbDocument] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, document.id));

      expect(dbDocument).toBeDefined();
      expect(dbDocument.tenantId).toBe(tenantId);
      expect(dbDocument.clientId).toBe(client.id);
      expect(dbDocument.uploadedById).toBe(userId);
      expect(dbDocument.name).toContain("test-document-");
      expect(dbDocument.name).toContain(".pdf");
      expect(dbDocument.mimeType).toBe("application/pdf");
    });
  });

  describe("Batch creation functions", () => {
    it("should create multiple clients", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);

      const clientsArray = await createTestClients(tenantId, userId, 3);
      tracker.clients?.push(...clientsArray.map((c) => c.id));

      expect(clientsArray).toHaveLength(3);
      expect(clientsArray[0].name).toContain("Test Client 1");
      expect(clientsArray[1].name).toContain("Test Client 2");
      expect(clientsArray[2].name).toContain("Test Client 3");

      // Verify all persisted to database
      const dbClients = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, tenantId));

      expect(dbClients).toHaveLength(3);
    });

    it("should create multiple tasks", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      const client = await createTestClient(tenantId, userId);
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);
      tracker.clients?.push(client.id);

      const tasksArray = await createTestTasks(tenantId, client.id, userId, 5);
      tracker.tasks?.push(...tasksArray.map((t) => t.id));

      expect(tasksArray).toHaveLength(5);

      // Verify all persisted to database
      const dbTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.clientId, client.id));

      expect(dbTasks).toHaveLength(5);
    });
  });

  describe("createCompleteTestSetup", () => {
    it("should create tenant, user, and client", async () => {
      const setup = await createCompleteTestSetup();

      // Add to tracker
      tracker.tenants?.push(setup.tenantId);
      tracker.users?.push(setup.userId);
      tracker.clients?.push(setup.clientId);

      // Verify tenant exists
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, setup.tenantId));
      expect(tenant).toBeDefined();

      // Verify user exists
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, setup.userId));
      expect(user).toBeDefined();
      expect(user.tenantId).toBe(setup.tenantId);

      // Verify client exists
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, setup.clientId));
      expect(client).toBeDefined();
      expect(client.tenantId).toBe(setup.tenantId);
      expect(client.createdBy).toBe(setup.userId);

      // Verify tracker is populated
      expect(setup.tracker.tenants).toEqual([setup.tenantId]);
      expect(setup.tracker.users).toEqual([setup.userId]);
      expect(setup.tracker.clients).toEqual([setup.clientId]);
    });
  });

  describe("cleanupTestData", () => {
    it("should delete all tracked data", async () => {
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId);
      const client = await createTestClient(tenantId, userId);
      const task = await createTestTask(tenantId, client.id, userId);

      // Add to tracker
      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);
      tracker.clients?.push(client.id);
      tracker.tasks?.push(task.id);

      // Cleanup
      await cleanupTestData(tracker);

      // Verify all deleted
      const [dbTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, task.id));
      expect(dbTask).toBeUndefined();

      const [dbClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, client.id));
      expect(dbClient).toBeUndefined();

      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      expect(dbUser).toBeUndefined();

      const [dbTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));
      expect(dbTenant).toBeUndefined();
    });

    it("should handle cleanup failures gracefully", async () => {
      // Test with empty tracker - should not throw
      await expect(cleanupTestData({})).resolves.not.toThrow();

      // Test with non-existent IDs - should not throw
      await expect(
        cleanupTestData({
          clients: ["non-existent-id"],
        }),
      ).resolves.not.toThrow();
    });
  });
});
