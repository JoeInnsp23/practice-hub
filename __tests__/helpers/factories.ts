/**
 * Test Data Factory Helpers
 *
 * Factory functions for creating test data with unique IDs and proper cleanup.
 * Based on Task 0 spike findings: Use unique IDs + afterEach cleanup approach.
 *
 * Usage:
 * ```typescript
 * import { createTestClient, cleanupTestData } from "../helpers/factories";
 *
 * describe("Router Tests", () => {
 *   const createdIds = { clients: [], tasks: [], invoices: [] };
 *
 *   afterEach(async () => {
 *     await cleanupTestData(createdIds);
 *   });
 *
 *   it("should create client", async () => {
 *     const client = await createTestClient(ctx.authContext.tenantId, ctx.authContext.userId);
 *     createdIds.clients.push(client.id);
 *     // ... test logic
 *   });
 * });
 * ```
 */

import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  departments,
  documents,
  invoices,
  services,
  tasks,
  taskTemplates,
  taskWorkflowInstances,
  tenants,
  timeEntries,
  users,
  workflowStages,
  workflows,
  workflowVersions,
} from "@/lib/db/schema";

// Infer types from Drizzle schema
type Client = typeof clients.$inferSelect;
type Document = typeof documents.$inferSelect;
type Invoice = typeof invoices.$inferSelect;
type Task = typeof tasks.$inferSelect;

/**
 * Tracking object for test data cleanup
 */
export interface TestDataTracker {
  clients?: string[];
  tasks?: string[];
  invoices?: string[];
  documents?: string[];
  users?: string[];
  tenants?: string[];
  workflows?: string[];
  workflowVersions?: string[];
  workflowStages?: string[];
  taskWorkflowInstances?: string[];
  timeEntries?: string[];
  services?: string[];
  taskTemplates?: string[];
  departments?: string[];
}

/**
 * Create a test tenant with unique slug
 */
export async function createTestTenant(
  overrides: Partial<typeof tenants.$inferInsert> = {},
) {
  const tenantId = crypto.randomUUID();
  const uniqueId = crypto.randomUUID();

  await db.insert(tenants).values({
    id: tenantId,
    name: overrides.name || `Test Tenant ${uniqueId}`,
    slug: overrides.slug || `test-tenant-${uniqueId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  return tenantId;
}

/**
 * Create a test user with unique email
 */
export async function createTestUser(
  tenantId: string,
  overrides: Partial<typeof users.$inferInsert> = {},
) {
  const userId = crypto.randomUUID();
  const uniqueId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    tenantId,
    email: overrides.email || `test-user-${uniqueId}@example.com`,
    role: overrides.role || "user",
    firstName: overrides.firstName || "Test",
    lastName: overrides.lastName || "User",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  return userId;
}

/**
 * Create a test client with unique client code
 */
export async function createTestClient(
  tenantId: string,
  createdBy: string,
  overrides: Partial<typeof clients.$inferInsert> = {},
): Promise<Client> {
  const clientId = crypto.randomUUID();
  const timestamp = Date.now();

  const [client] = await db
    .insert(clients)
    .values({
      id: clientId,
      tenantId,
      createdBy,
      clientCode: overrides.clientCode || `TEST-CLIENT-${timestamp}`,
      name: overrides.name || `Test Client ${timestamp}`,
      type: overrides.type || "limited_company",
      status: overrides.status || "active",
      email: overrides.email,
      phone: overrides.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return client;
}

/**
 * Create a test task with unique task data
 */
export async function createTestTask(
  tenantId: string,
  clientId: string,
  createdById: string,
  overrides: Partial<typeof tasks.$inferInsert> = {},
): Promise<Task> {
  const taskId = crypto.randomUUID();
  const timestamp = Date.now();

  const [task] = await db
    .insert(tasks)
    .values({
      id: taskId,
      tenantId,
      clientId,
      createdById,
      title: overrides.title || `Test Task ${timestamp}`,
      description:
        overrides.description || `Test task description ${timestamp}`,
      status: overrides.status || "pending",
      priority: overrides.priority || "medium",
      dueDate: overrides.dueDate,
      assignedToId: overrides.assignedToId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return task;
}

/**
 * Create a test invoice with unique invoice number
 */
export async function createTestInvoice(
  tenantId: string,
  clientId: string,
  createdById: string,
  overrides: Partial<typeof invoices.$inferInsert> = {},
): Promise<Invoice> {
  const invoiceId = crypto.randomUUID();
  const timestamp = Date.now();

  const [invoice] = await db
    .insert(invoices)
    .values({
      id: invoiceId,
      tenantId,
      clientId,
      createdById,
      invoiceNumber: overrides.invoiceNumber || `INV-TEST-${timestamp}`,
      issueDate: overrides.issueDate || new Date().toISOString().split("T")[0], // Date string YYYY-MM-DD
      dueDate:
        overrides.dueDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days
      status: overrides.status || "draft",
      subtotal: overrides.subtotal || "1000.00",
      taxAmount: overrides.taxAmount || "200.00",
      total: overrides.total || "1200.00",
      currency: overrides.currency || "GBP",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return invoice;
}

/**
 * Create a test document with unique file name
 */
export async function createTestDocument(
  tenantId: string,
  clientId: string,
  uploadedById: string,
  overrides: Partial<typeof documents.$inferInsert> = {},
): Promise<Document> {
  const documentId = crypto.randomUUID();
  const timestamp = Date.now();

  const [document] = await db
    .insert(documents)
    .values({
      id: documentId,
      tenantId,
      clientId,
      uploadedById,
      name: overrides.name || `test-document-${timestamp}.pdf`,
      type: overrides.type || "file",
      mimeType: overrides.mimeType || "application/pdf",
      size: overrides.size || 1024,
      url: overrides.url || `https://example.com/test/${documentId}.pdf`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return document;
}

/**
 * Create a test time entry
 */
export async function createTestTimeEntry(
  tenantId: string,
  userId: string,
  clientId: string,
  overrides: Partial<typeof timeEntries.$inferInsert> = {},
) {
  const timeEntryId = crypto.randomUUID();
  const today = new Date().toISOString().split("T")[0];

  const [entry] = await db
    .insert(timeEntries)
    .values({
      id: timeEntryId,
      tenantId,
      userId,
      clientId,
      date: overrides.date || today,
      hours: overrides.hours || "8.00",
      description: overrides.description || "Test time entry",
      billable: overrides.billable !== undefined ? overrides.billable : true,
      rate: overrides.rate || "100.00",
      status: overrides.status || "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return entry;
}

/**
 * Cleanup test data by deleting all tracked IDs
 *
 * Usage:
 * ```typescript
 * afterEach(async () => {
 *   await cleanupTestData(createdIds);
 *   // Reset tracker
 *   createdIds.clients = [];
 *   createdIds.tasks = [];
 *   // ... etc
 * });
 * ```
 */
export async function cleanupTestData(tracker: TestDataTracker): Promise<void> {
  try {
    // Delete in reverse order of foreign key dependencies
    if (
      tracker.taskWorkflowInstances &&
      tracker.taskWorkflowInstances.length > 0
    ) {
      await db
        .delete(taskWorkflowInstances)
        .where(
          inArray(taskWorkflowInstances.id, tracker.taskWorkflowInstances),
        );
    }

    if (tracker.workflowStages && tracker.workflowStages.length > 0) {
      await db
        .delete(workflowStages)
        .where(inArray(workflowStages.id, tracker.workflowStages));
    }

    if (tracker.workflowVersions && tracker.workflowVersions.length > 0) {
      await db
        .delete(workflowVersions)
        .where(inArray(workflowVersions.id, tracker.workflowVersions));
    }

    if (tracker.workflows && tracker.workflows.length > 0) {
      await db
        .delete(workflows)
        .where(inArray(workflows.id, tracker.workflows));
    }

    if (tracker.timeEntries && tracker.timeEntries.length > 0) {
      await db
        .delete(timeEntries)
        .where(inArray(timeEntries.id, tracker.timeEntries));
    }

    if (tracker.documents && tracker.documents.length > 0) {
      await db
        .delete(documents)
        .where(inArray(documents.id, tracker.documents));
    }

    if (tracker.invoices && tracker.invoices.length > 0) {
      await db.delete(invoices).where(inArray(invoices.id, tracker.invoices));
    }

    if (tracker.tasks && tracker.tasks.length > 0) {
      await db.delete(tasks).where(inArray(tasks.id, tracker.tasks));
    }

    if (tracker.taskTemplates && tracker.taskTemplates.length > 0) {
      await db
        .delete(taskTemplates)
        .where(inArray(taskTemplates.id, tracker.taskTemplates));
    }

    if (tracker.services && tracker.services.length > 0) {
      await db.delete(services).where(inArray(services.id, tracker.services));
    }

    if (tracker.clients && tracker.clients.length > 0) {
      await db.delete(clients).where(inArray(clients.id, tracker.clients));
    }

    if (tracker.users && tracker.users.length > 0) {
      await db.delete(users).where(inArray(users.id, tracker.users));
    }

    if (tracker.departments && tracker.departments.length > 0) {
      await db
        .delete(departments)
        .where(inArray(departments.id, tracker.departments));
    }

    if (tracker.tenants && tracker.tenants.length > 0) {
      await db.delete(tenants).where(inArray(tenants.id, tracker.tenants));
    }
  } catch (error) {
    // Log but don't throw - cleanup failures shouldn't fail tests
    console.error("Test cleanup error:", error);
  }
}

/**
 * Batch create multiple test clients
 */
export async function createTestClients(
  tenantId: string,
  createdBy: string,
  count: number,
  overrides: Partial<typeof clients.$inferInsert> = {},
): Promise<Client[]> {
  const clients: Client[] = [];

  for (let i = 0; i < count; i++) {
    const client = await createTestClient(tenantId, createdBy, {
      ...overrides,
      name: `${overrides.name || "Test Client"} ${i + 1}`,
      clientCode: `${overrides.clientCode || "TEST"}-${Date.now()}-${i}`,
    });
    clients.push(client);
  }

  return clients;
}

/**
 * Batch create multiple test tasks
 */
export async function createTestTasks(
  tenantId: string,
  clientId: string,
  createdById: string,
  count: number,
  overrides: Partial<typeof tasks.$inferInsert> = {},
): Promise<Task[]> {
  const tasksArray: Task[] = [];

  for (let i = 0; i < count; i++) {
    const task = await createTestTask(tenantId, clientId, createdById, {
      ...overrides,
      title: `${overrides.title || "Test Task"} ${i + 1}`,
    });
    tasksArray.push(task);
  }

  return tasksArray;
}

/**
 * Create a complete test setup with tenant, user, and client
 *
 * Returns all created IDs for easy cleanup
 */
export async function createCompleteTestSetup(): Promise<{
  tenantId: string;
  userId: string;
  clientId: string;
  tracker: TestDataTracker;
}> {
  const tenantId = await createTestTenant();
  const userId = await createTestUser(tenantId);
  const client = await createTestClient(tenantId, userId);

  return {
    tenantId,
    userId,
    clientId: client.id,
    tracker: {
      tenants: [tenantId],
      users: [userId],
      clients: [client.id],
      tasks: [],
      invoices: [],
      documents: [],
    },
  };
}

/**
 * Create a test workflow (basic workflow without stages)
 */
export async function createTestWorkflow(
  tenantId: string,
  createdById: string,
  overrides: Partial<typeof workflows.$inferInsert> = {},
) {
  const workflowId = crypto.randomUUID();
  const timestamp = Date.now();

  const [workflow] = await db
    .insert(workflows)
    .values({
      id: workflowId,
      tenantId,
      createdById,
      name: overrides.name || `Test Workflow ${timestamp}`,
      description:
        overrides.description || `Test workflow description ${timestamp}`,
      type: overrides.type || "task_template",
      trigger: overrides.trigger || "manual",
      isActive: overrides.isActive ?? true,
      version: overrides.version || 1,
      estimatedDays: overrides.estimatedDays || null,
      serviceId: overrides.serviceId || null, // workflows schema uses serviceId, not serviceComponentId
      config: overrides.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return workflow;
}

/**
 * Create a test workflow stage
 */
export async function createTestWorkflowStage(
  workflowId: string,
  overrides: Partial<typeof workflowStages.$inferInsert> = {},
) {
  const stageId = crypto.randomUUID();
  const timestamp = Date.now();

  const [stage] = await db
    .insert(workflowStages)
    .values({
      id: stageId,
      workflowId,
      name: overrides.name || `Test Stage ${timestamp}`,
      description: overrides.description || `Test stage description`,
      stageOrder: overrides.stageOrder ?? 1,
      isRequired: overrides.isRequired ?? true,
      estimatedHours: overrides.estimatedHours || "8.00",
      checklistItems: overrides.checklistItems || [],
      autoComplete: overrides.autoComplete ?? false,
      requiresApproval: overrides.requiresApproval ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return stage;
}
