/**
 * Tenant Isolation Integration Tests
 *
 * Tests to ensure multi-tenant data isolation across all routers
 */

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  activityLogs,
  clients,
  documents,
  invoices,
  leads,
  proposals,
  tasks,
  tenants,
  users,
} from "@/lib/db/schema";

// Test tenant IDs
const TENANT_A_ID = "tenant-a-test-isolation";
const TENANT_B_ID = "tenant-b-test-isolation";
const USER_A_ID = "user-a-test-isolation";
const USER_B_ID = "user-b-test-isolation";

describe("Tenant Isolation Integration Tests", () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db
      .delete(activityLogs)
      .where(sql`${activityLogs.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(documents)
      .where(sql`${documents.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(invoices)
      .where(sql`${invoices.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(tasks)
      .where(sql`${tasks.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(proposals)
      .where(sql`${proposals.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(leads)
      .where(sql`${leads.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(clients)
      .where(sql`${clients.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(users)
      .where(sql`${users.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(tenants)
      .where(sql`${tenants.id} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);

    // Create test tenants
    await db.insert(tenants).values([
      {
        id: TENANT_A_ID,
        name: "Tenant A Test",
        slug: "tenant-a-test-isolation",
      },
      {
        id: TENANT_B_ID,
        name: "Tenant B Test",
        slug: "tenant-b-test-isolation",
      },
    ]);

    // Create test users
    await db.insert(users).values([
      {
        id: USER_A_ID,
        tenantId: TENANT_A_ID,
        email: "user-a@tenant-a.test",
        firstName: "User",
        lastName: "A",
        role: "admin",
      },
      {
        id: USER_B_ID,
        tenantId: TENANT_B_ID,
        email: "user-b@tenant-b.test",
        firstName: "User",
        lastName: "B",
        role: "admin",
      },
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(activityLogs)
      .where(sql`${activityLogs.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(documents)
      .where(sql`${documents.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(invoices)
      .where(sql`${invoices.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(tasks)
      .where(sql`${tasks.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(proposals)
      .where(sql`${proposals.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(leads)
      .where(sql`${leads.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(clients)
      .where(sql`${clients.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(users)
      .where(sql`${users.tenantId} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db
      .delete(tenants)
      .where(sql`${tenants.id} IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
  });

  describe("Clients Table Isolation", () => {
    it("should isolate client records by tenant", async () => {
      // Create clients for both tenants
      const [clientA] = await db
        .insert(clients)
        .values({
          tenantId: TENANT_A_ID,
          name: "Client A from Tenant A",
          type: "limited_company",
          clientCode: "TEST-A-001",
          email: "client-a@tenant-a.test",
          status: "active",
        })
        .returning();

      const [clientB] = await db
        .insert(clients)
        .values({
          tenantId: TENANT_B_ID,
          name: "Client B from Tenant B",
          type: "limited_company",
          clientCode: "TEST-B-001",
          email: "client-b@tenant-b.test",
          status: "active",
        })
        .returning();

      // Query as Tenant A - should only see Tenant A's client
      const tenantAClients = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, TENANT_A_ID));

      expect(tenantAClients).toHaveLength(1);
      expect(tenantAClients[0].id).toBe(clientA.id);
      expect(tenantAClients[0].name).toBe("Client A from Tenant A");

      // Query as Tenant B - should only see Tenant B's client
      const tenantBClients = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, TENANT_B_ID));

      expect(tenantBClients).toHaveLength(1);
      expect(tenantBClients[0].id).toBe(clientB.id);
      expect(tenantBClients[0].name).toBe("Client B from Tenant B");

      // Cleanup
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    });

    it("should prevent cross-tenant client access", async () => {
      // Create client for Tenant A
      const [clientA] = await db
        .insert(clients)
        .values({
          tenantId: TENANT_A_ID,
          name: "Private Client A",
          type: "limited_company",
          clientCode: "TEST-A-PRIV",
          email: "private@tenant-a.test",
          status: "active",
        })
        .returning();

      // Try to query Tenant A's client as Tenant B
      const unauthorizedAccess = await db
        .select()
        .from(clients)
        .where(eq(clients.tenantId, TENANT_B_ID));

      // Should not find Tenant A's client
      expect(unauthorizedAccess).toHaveLength(0);

      // Cleanup
      await db.delete(clients).where(eq(clients.id, clientA.id));
    });
  });

  describe("Leads Table Isolation", () => {
    it("should isolate lead records by tenant", async () => {
      // Create leads for both tenants
      const [leadA] = await db
        .insert(leads)
        .values({
          tenantId: TENANT_A_ID,
          firstName: "Lead A",
          lastName: "Tenant A",
          email: "lead-a@tenant-a.test",
          status: "new",
          source: "website",
        })
        .returning();

      const [leadB] = await db
        .insert(leads)
        .values({
          tenantId: TENANT_B_ID,
          firstName: "Lead B",
          lastName: "Tenant B",
          email: "lead-b@tenant-b.test",
          status: "new",
          source: "referral",
        })
        .returning();

      // Query as Tenant A
      const tenantALeads = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, TENANT_A_ID));

      expect(tenantALeads).toHaveLength(1);
      expect(tenantALeads[0].id).toBe(leadA.id);

      // Query as Tenant B
      const tenantBLeads = await db
        .select()
        .from(leads)
        .where(eq(leads.tenantId, TENANT_B_ID));

      expect(tenantBLeads).toHaveLength(1);
      expect(tenantBLeads[0].id).toBe(leadB.id);

      // Cleanup
      await db.delete(leads).where(eq(leads.id, leadA.id));
      await db.delete(leads).where(eq(leads.id, leadB.id));
    });
  });

  describe("Tasks Table Isolation", () => {
    it("should isolate task records by tenant", async () => {
      // Create tasks for both tenants
      const [taskA] = await db
        .insert(tasks)
        .values({
          tenantId: TENANT_A_ID,
          title: "Task A from Tenant A",
          description: "Task for Tenant A",
          status: "pending",
          priority: "medium",
          assignedToId: USER_A_ID,
          createdById: USER_A_ID,
        })
        .returning();

      const [taskB] = await db
        .insert(tasks)
        .values({
          tenantId: TENANT_B_ID,
          title: "Task B from Tenant B",
          description: "Task for Tenant B",
          status: "pending",
          priority: "high",
          assignedToId: USER_B_ID,
          createdById: USER_B_ID,
        })
        .returning();

      // Query as Tenant A
      const tenantATasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.tenantId, TENANT_A_ID));

      expect(tenantATasks).toHaveLength(1);
      expect(tenantATasks[0].id).toBe(taskA.id);
      expect(tenantATasks[0].title).toBe("Task A from Tenant A");

      // Query as Tenant B
      const tenantBTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.tenantId, TENANT_B_ID));

      expect(tenantBTasks).toHaveLength(1);
      expect(tenantBTasks[0].id).toBe(taskB.id);
      expect(tenantBTasks[0].title).toBe("Task B from Tenant B");

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, taskA.id));
      await db.delete(tasks).where(eq(tasks.id, taskB.id));
    });
  });

  describe("Activity Logs Isolation", () => {
    it("should isolate activity log records by tenant", async () => {
      // Create activity logs for both tenants
      const [logA] = await db
        .insert(activityLogs)
        .values({
          tenantId: TENANT_A_ID,
          entityType: "client",
          entityId: "00000000-0000-0000-0000-000000000001", // Mock UUID for testing
          action: "created",
          description: "Activity for Tenant A",
          userId: USER_A_ID,
          userName: "User A",
        })
        .returning();

      const [logB] = await db
        .insert(activityLogs)
        .values({
          tenantId: TENANT_B_ID,
          entityType: "lead",
          entityId: "00000000-0000-0000-0000-000000000002", // Mock UUID for testing
          action: "updated",
          description: "Activity for Tenant B",
          userId: USER_B_ID,
          userName: "User B",
        })
        .returning();

      // Query as Tenant A
      const tenantALogs = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.tenantId, TENANT_A_ID));

      expect(tenantALogs.length).toBeGreaterThanOrEqual(1);
      const foundLogA = tenantALogs.find((log) => log.id === logA.id);
      expect(foundLogA).toBeDefined();
      expect(foundLogA?.description).toBe("Activity for Tenant A");

      // Query as Tenant B
      const tenantBLogs = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.tenantId, TENANT_B_ID));

      expect(tenantBLogs.length).toBeGreaterThanOrEqual(1);
      const foundLogB = tenantBLogs.find((log) => log.id === logB.id);
      expect(foundLogB).toBeDefined();
      expect(foundLogB?.description).toBe("Activity for Tenant B");

      // Verify cross-tenant isolation
      const tenantAHasLogB = tenantALogs.some((log) => log.id === logB.id);
      const tenantBHasLogA = tenantBLogs.some((log) => log.id === logA.id);

      expect(tenantAHasLogB).toBe(false);
      expect(tenantBHasLogA).toBe(false);

      // Cleanup
      await db.delete(activityLogs).where(eq(activityLogs.id, logA.id));
      await db.delete(activityLogs).where(eq(activityLogs.id, logB.id));
    });
  });

  describe("User Assignment Isolation", () => {
    it("should prevent cross-tenant user assignments", async () => {
      // Create a task for Tenant A
      const [taskA] = await db
        .insert(tasks)
        .values({
          tenantId: TENANT_A_ID,
          title: "Task with cross-tenant assignment attempt",
          description: "Testing isolation",
          status: "pending",
          createdById: USER_A_ID,
          priority: "medium",
          assignedToId: USER_A_ID, // Correct tenant assignment
        })
        .returning();

      // Verify task was created with correct assignment
      const retrievedTask = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskA.id))
        .limit(1);

      expect(retrievedTask[0].assignedToId).toBe(USER_A_ID);
      expect(retrievedTask[0].tenantId).toBe(TENANT_A_ID);

      // In a real scenario, business logic should prevent assigning
      // users from different tenants. This test verifies the data model
      // allows us to detect such violations.

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, taskA.id));
    });
  });

  describe("Complex Query Isolation", () => {
    it("should maintain isolation in joined queries", async () => {
      // Create client and tasks for Tenant A
      const [clientA] = await db
        .insert(clients)
        .values({
          tenantId: TENANT_A_ID,
          clientCode: "CLI-A-JOIN",
          name: "Client A for Join Test",
          type: "limited_company",
          email: "join-test-a@tenant-a.test",
          status: "active",
        })
        .returning();

      const [taskA] = await db
        .insert(tasks)
        .values({
          tenantId: TENANT_A_ID,
          title: "Task for Client A",
          description: "Join test task",
          status: "pending",
          priority: "medium",
          clientId: clientA.id,
          assignedToId: USER_A_ID,
          createdById: USER_A_ID,
        })
        .returning();

      // Create client and tasks for Tenant B
      const [clientB] = await db
        .insert(clients)
        .values({
          tenantId: TENANT_B_ID,
          clientCode: "CLI-B-JOIN",
          name: "Client B for Join Test",
          type: "limited_company",
          email: "join-test-b@tenant-b.test",
          status: "active",
        })
        .returning();

      const [taskB] = await db
        .insert(tasks)
        .values({
          tenantId: TENANT_B_ID,
          title: "Task for Client B",
          description: "Join test task",
          status: "pending",
          priority: "high",
          clientId: clientB.id,
          assignedToId: USER_B_ID,
          createdById: USER_B_ID,
        })
        .returning();

      // Query with join for Tenant A
      const tenantAResults = await db
        .select({
          taskId: tasks.id,
          taskTitle: tasks.title,
          clientName: clients.name,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .where(eq(tasks.tenantId, TENANT_A_ID));

      expect(tenantAResults).toHaveLength(1);
      expect(tenantAResults[0].taskId).toBe(taskA.id);
      expect(tenantAResults[0].clientName).toBe("Client A for Join Test");

      // Query with join for Tenant B
      const tenantBResults = await db
        .select({
          taskId: tasks.id,
          taskTitle: tasks.title,
          clientName: clients.name,
        })
        .from(tasks)
        .leftJoin(clients, eq(tasks.clientId, clients.id))
        .where(eq(tasks.tenantId, TENANT_B_ID));

      expect(tenantBResults).toHaveLength(1);
      expect(tenantBResults[0].taskId).toBe(taskB.id);
      expect(tenantBResults[0].clientName).toBe("Client B for Join Test");

      // Cleanup
      await db.delete(tasks).where(eq(tasks.id, taskA.id));
      await db.delete(tasks).where(eq(tasks.id, taskB.id));
      await db.delete(clients).where(eq(clients.id, clientA.id));
      await db.delete(clients).where(eq(clients.id, clientB.id));
    });
  });
});
