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

import crypto from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  calendarEvents,
  clientPortalAccess,
  clientPortalInvitations,
  clientPortalUsers,
  clients,
  clientTransactionData,
  departments,
  documents,
  invitations,
  invoices,
  kycVerifications,
  leads,
  legalPages,
  messages,
  messageThreadParticipants,
  messageThreads,
  notifications,
  pricingRules,
  proposals,
  proposalTemplates,
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
  pricingRules?: string[];
  taskTemplates?: string[];
  departments?: string[];
  proposals?: string[];
  proposalTemplates?: string[];
  leads?: string[];
  calendarEvents?: string[];
  messages?: string[];
  messageThreads?: string[];
  messageThreadParticipants?: string[];
  legalPages?: string[];
  kycVerifications?: string[];
  transactionData?: string[];
  invitations?: string[];
  notifications?: string[];
  clientPortalUsers?: string[];
  clientPortalInvitations?: string[];
  clientPortalAccess?: string[];
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
 * Create a test invitation (staff team member invitation)
 *
 * @example
 * const invitation = await createTestInvitation(tenantId, invitedBy, {
 *   email: "test@example.com",
 *   role: "accountant"
 * });
 * tracker.invitations?.push(invitation.id);
 */
export async function createTestInvitation(
  tenantId: string,
  invitedBy: string,
  overrides: Partial<typeof invitations.$inferInsert> = {},
) {
  const invitationId = crypto.randomUUID();
  const timestamp = Date.now();
  const token = crypto.randomBytes(32).toString("hex");

  const [invitation] = await db
    .insert(invitations)
    .values({
      id: invitationId,
      tenantId,
      email: overrides.email || `invite-${timestamp}@example.com`,
      role: overrides.role || "member",
      token: overrides.token || token,
      invitedBy,
      customMessage: overrides.customMessage || null,
      status: overrides.status || "pending",
      expiresAt:
        overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      acceptedAt: overrides.acceptedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return invitation;
}

/**
 * Create a test notification
 *
 * @example
 * const notification = await createTestNotification(tenantId, userId, {
 *   type: "task_assigned",
 *   title: "New task assigned"
 * });
 * tracker.notifications?.push(notification.id);
 */
export async function createTestNotification(
  tenantId: string,
  userId: string,
  overrides: Partial<typeof notifications.$inferInsert> = {},
) {
  const notificationId = crypto.randomUUID();

  const [notification] = await db
    .insert(notifications)
    .values({
      id: notificationId,
      tenantId,
      userId,
      type: overrides.type || "info",
      title: overrides.title || "Test Notification",
      message: overrides.message || "This is a test notification",
      actionUrl: overrides.actionUrl || null,
      entityType: overrides.entityType || null,
      entityId: overrides.entityId || null,
      isRead: overrides.isRead ?? false,
      readAt: overrides.readAt || null,
      metadata: overrides.metadata || null,
      createdAt: new Date(),
      ...overrides,
    })
    .returning();

  return notification;
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
 * Create a test proposal
 */
export async function createTestProposal(
  tenantId: string,
  clientId: string,
  overrides: Partial<typeof proposals.$inferInsert> = {},
) {
  const proposalId = crypto.randomUUID();
  const timestamp = Date.now();

  const [proposal] = await db
    .insert(proposals)
    .values({
      id: proposalId,
      tenantId,
      clientId,
      proposalNumber: overrides.proposalNumber || `PROP-TEST-${timestamp}`,
      title: overrides.title || `Test Proposal ${timestamp}`,
      status: overrides.status || "draft",
      salesStage: overrides.salesStage || "enquiry",
      monthlyTotal: overrides.monthlyTotal || "100.00",
      annualTotal: overrides.annualTotal || "1200.00",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return proposal;
}

/**
 * Create a test lead
 */
export async function createTestLead(
  tenantId: string,
  overrides: Partial<typeof leads.$inferInsert> = {},
) {
  const leadId = crypto.randomUUID();
  const timestamp = Date.now();

  const [lead] = await db
    .insert(leads)
    .values({
      id: leadId,
      tenantId,
      firstName: overrides.firstName || "Jane",
      lastName: overrides.lastName || "Smith",
      email: overrides.email || `lead-${timestamp}@example.com`,
      phone: overrides.phone || "555-0200",
      companyName: overrides.companyName || `Test Lead ${timestamp}`,
      status: overrides.status || "new",
      source: overrides.source || "website",
      assignedToId: overrides.assignedToId || null,
      notes: overrides.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return lead;
}

/**
 * Create a test calendar event
 */
export async function createTestCalendarEvent(
  tenantId: string,
  createdBy: string,
  overrides: Partial<typeof calendarEvents.$inferInsert> = {},
) {
  const eventId = crypto.randomUUID();
  const timestamp = Date.now();
  const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endDate = new Date(Date.now() + 25 * 60 * 60 * 1000); // Tomorrow + 1 hour

  const [event] = await db
    .insert(calendarEvents)
    .values({
      id: eventId,
      tenantId,
      createdBy,
      type: overrides.type || "meeting",
      title: overrides.title || `Test Event ${timestamp}`,
      description: overrides.description || "Test event description",
      startTime: overrides.startTime || startDate,
      endTime: overrides.endTime || endDate,
      location: overrides.location || null,
      clientId: overrides.clientId || null,
      ...overrides,
    })
    .returning();

  return event;
}

/**
 * Create a test message (for messaging/threads)
 */
export async function createTestMessage(
  senderId: string,
  threadId: string,
  overrides: Partial<typeof messages.$inferInsert> = {},
) {
  const messageId = crypto.randomUUID();
  const timestamp = Date.now();
  const senderType = overrides.senderType || "staff";

  const [message] = await db
    .insert(messages)
    .values({
      id: messageId,
      senderId,
      threadId,
      senderType,
      userId: overrides.userId || (senderType === "staff" ? senderId : null), // Set userId for staff messages
      content: overrides.content || `Test message ${timestamp}`,
      type: overrides.type || "text",
      metadata: overrides.metadata || null,
      ...overrides,
    })
    .returning();

  return message;
}

/**
 * Create a test legal page
 */
export async function createTestLegalPage(
  tenantId: string,
  overrides: Partial<typeof legalPages.$inferInsert> = {},
) {
  const pageId = crypto.randomUUID();
  const timestamp = Date.now();

  const [page] = await db
    .insert(legalPages)
    .values({
      id: pageId,
      tenantId,
      pageType: overrides.pageType || "privacy",
      content:
        overrides.content || `# Test Legal Page\n\nContent for ${timestamp}`,
      version: overrides.version || 1,
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return page;
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
    if (tracker.messages && tracker.messages.length > 0) {
      await db.delete(messages).where(inArray(messages.id, tracker.messages));
    }

    if (
      tracker.messageThreadParticipants &&
      tracker.messageThreadParticipants.length > 0
    ) {
      await db
        .delete(messageThreadParticipants)
        .where(
          inArray(
            messageThreadParticipants.id,
            tracker.messageThreadParticipants,
          ),
        );
    }

    if (tracker.messageThreads && tracker.messageThreads.length > 0) {
      await db
        .delete(messageThreads)
        .where(inArray(messageThreads.id, tracker.messageThreads));
    }

    // Delete client portal records (respecting FK dependencies)
    if (tracker.clientPortalAccess && tracker.clientPortalAccess.length > 0) {
      await db
        .delete(clientPortalAccess)
        .where(inArray(clientPortalAccess.id, tracker.clientPortalAccess));
    }

    if (
      tracker.clientPortalInvitations &&
      tracker.clientPortalInvitations.length > 0
    ) {
      await db
        .delete(clientPortalInvitations)
        .where(
          inArray(clientPortalInvitations.id, tracker.clientPortalInvitations),
        );
    }

    if (tracker.clientPortalUsers && tracker.clientPortalUsers.length > 0) {
      await db
        .delete(clientPortalUsers)
        .where(inArray(clientPortalUsers.id, tracker.clientPortalUsers));
    }

    if (tracker.calendarEvents && tracker.calendarEvents.length > 0) {
      await db
        .delete(calendarEvents)
        .where(inArray(calendarEvents.id, tracker.calendarEvents));
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

    if (tracker.proposals && tracker.proposals.length > 0) {
      await db
        .delete(proposals)
        .where(inArray(proposals.id, tracker.proposals));
    }

    if (tracker.invoices && tracker.invoices.length > 0) {
      await db.delete(invoices).where(inArray(invoices.id, tracker.invoices));
    }

    // Delete tasks first - CASCADE will delete taskWorkflowInstances
    if (tracker.tasks && tracker.tasks.length > 0) {
      await db.delete(tasks).where(inArray(tasks.id, tracker.tasks));
    }

    // Now safe to delete workflow-related data
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

    if (tracker.taskTemplates && tracker.taskTemplates.length > 0) {
      await db
        .delete(taskTemplates)
        .where(inArray(taskTemplates.id, tracker.taskTemplates));
    }

    // Delete pricing rules before services (foreign key dependency)
    if (tracker.pricingRules && tracker.pricingRules.length > 0) {
      await db
        .delete(pricingRules)
        .where(inArray(pricingRules.id, tracker.pricingRules));
    }

    if (tracker.services && tracker.services.length > 0) {
      await db.delete(services).where(inArray(services.id, tracker.services));
    }

    if (tracker.leads && tracker.leads.length > 0) {
      await db.delete(leads).where(inArray(leads.id, tracker.leads));
    }

    // Delete KYC verifications before clients (clientId FK dependency)
    if (tracker.kycVerifications && tracker.kycVerifications.length > 0) {
      await db
        .delete(kycVerifications)
        .where(inArray(kycVerifications.id, tracker.kycVerifications));
    }

    // Delete transaction data before clients (clientId FK dependency)
    if (tracker.transactionData && tracker.transactionData.length > 0) {
      await db
        .delete(clientTransactionData)
        .where(inArray(clientTransactionData.id, tracker.transactionData));
    }

    if (tracker.clients && tracker.clients.length > 0) {
      await db.delete(clients).where(inArray(clients.id, tracker.clients));
    }

    if (tracker.legalPages && tracker.legalPages.length > 0) {
      await db
        .delete(legalPages)
        .where(inArray(legalPages.id, tracker.legalPages));
    }

    // Delete invitations before users (FK: invitations.invitedBy -> users.id)
    if (tracker.invitations && tracker.invitations.length > 0) {
      await db
        .delete(invitations)
        .where(inArray(invitations.id, tracker.invitations));
    }

    // Delete notifications before users (FK: notifications.userId -> users.id)
    if (tracker.notifications && tracker.notifications.length > 0) {
      await db
        .delete(notifications)
        .where(inArray(notifications.id, tracker.notifications));
    }

    // Delete proposalTemplates before users (FK: proposalTemplates.createdById -> users.id)
    if (tracker.proposalTemplates && tracker.proposalTemplates.length > 0) {
      await db
        .delete(proposalTemplates)
        .where(inArray(proposalTemplates.id, tracker.proposalTemplates));
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

/**
 * Create a test workflow version
 */
export async function createTestWorkflowVersion(
  workflowId: string,
  tenantId: string,
  overrides: Partial<typeof workflowVersions.$inferInsert> = {},
) {
  const versionId = crypto.randomUUID();
  const timestamp = Date.now();

  const [version] = await db
    .insert(workflowVersions)
    .values({
      id: versionId,
      workflowId,
      tenantId,
      version: overrides.version ?? 1,
      name: overrides.name || `Test Workflow Version ${timestamp}`,
      description: overrides.description || `Test workflow version description`,
      type: overrides.type || "task_template",
      trigger: overrides.trigger || "manual",
      estimatedDays: overrides.estimatedDays || null,
      serviceId: overrides.serviceId || null,
      config: overrides.config || {},
      stagesSnapshot: overrides.stagesSnapshot || [],
      changeDescription: overrides.changeDescription || null,
      changeType: overrides.changeType || "created",
      publishNotes: overrides.publishNotes || null,
      isActive: overrides.isActive ?? false,
      publishedAt: overrides.publishedAt || null,
      createdAt: new Date(),
      createdById: overrides.createdById || null,
      ...overrides,
    })
    .returning();

  return version;
}

/**
 * Create a test service (pricing component)
 */
export async function createTestService(
  tenantId: string,
  overrides: Partial<typeof services.$inferInsert> = {},
) {
  const serviceId = crypto.randomUUID();
  const timestamp = Date.now();

  const [service] = await db
    .insert(services)
    .values({
      id: serviceId,
      tenantId,
      code: overrides.code || `TEST_SVC_${timestamp}`,
      name: overrides.name || `Test Service ${timestamp}`,
      category: overrides.category || "compliance",
      pricingModel: overrides.pricingModel || "fixed",
      description: overrides.description || "Test service description",
      basePrice: overrides.basePrice || "100.00",
      isActive: overrides.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return service;
}

/**
 * Create a test pricing rule
 */
export async function createTestPricingRule(
  tenantId: string,
  componentId: string,
  overrides: Partial<typeof pricingRules.$inferInsert> = {},
) {
  const ruleId = crypto.randomUUID();

  const [rule] = await db
    .insert(pricingRules)
    .values({
      id: ruleId,
      tenantId,
      componentId,
      ruleType: overrides.ruleType || "fixed", // Valid enum: turnover_band, transaction_band, employee_band, per_unit, fixed
      price: overrides.price || "50.00",
      minValue: overrides.minValue || null,
      maxValue: overrides.maxValue || null,
      complexityLevel: overrides.complexityLevel || null,
      isActive: overrides.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return rule;
}

/**
 * Create a test message thread
 */
export async function createTestMessageThread(
  tenantId: string,
  createdBy: string,
  overrides: Partial<typeof messageThreads.$inferInsert> = {},
) {
  const threadId = crypto.randomUUID();
  const timestamp = Date.now();

  const [thread] = await db
    .insert(messageThreads)
    .values({
      id: threadId,
      tenantId,
      createdBy,
      type: overrides.type || "direct",
      name:
        overrides.name ||
        (overrides.type === "team_channel"
          ? `Test Channel ${timestamp}`
          : null),
      description: overrides.description || null,
      isPrivate: overrides.isPrivate ?? false,
      clientId: overrides.clientId || null,
      lastMessageAt: overrides.lastMessageAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return thread;
}

/**
 * Create a test message thread participant
 */
export async function createTestMessageThreadParticipant(
  threadId: string,
  participantId: string,
  overrides: Partial<typeof messageThreadParticipants.$inferInsert> = {},
) {
  const participantRecordId = crypto.randomUUID();
  const participantType = overrides.participantType || "staff";

  const [participant] = await db
    .insert(messageThreadParticipants)
    .values({
      id: participantRecordId,
      threadId,
      participantType,
      participantId,
      userId:
        overrides.userId ||
        (participantType === "staff" ? participantId : null),
      role: overrides.role || "member",
      joinedAt: new Date(),
      lastReadAt: overrides.lastReadAt || null,
      mutedUntil: overrides.mutedUntil || null,
      ...overrides,
    })
    .returning();

  return participant;
}

/**
 * Create a test client portal user (external authentication)
 *
 * @example
 * const portalUser = await createTestClientPortalUser(tenantId, {
 *   email: "custom@example.com",
 *   status: "suspended",
 * });
 * tracker.clientPortalUsers?.push(portalUser.id);
 */
export async function createTestClientPortalUser(
  tenantId: string,
  overrides: Partial<typeof clientPortalUsers.$inferInsert> = {},
) {
  const userId = crypto.randomUUID();
  const timestamp = Date.now();

  const [user] = await db
    .insert(clientPortalUsers)
    .values({
      id: userId,
      tenantId,
      email: overrides.email || `portal-${timestamp}@example.com`,
      firstName: overrides.firstName || "Portal",
      lastName: overrides.lastName || "User",
      phone: overrides.phone || null,
      status: overrides.status || "active",
      lastLoginAt: overrides.lastLoginAt || null,
      invitedAt: overrides.invitedAt || new Date(),
      acceptedAt: overrides.acceptedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();

  return user;
}

/**
 * Create a test client portal invitation
 *
 * @example
 * const invitation = await createTestClientPortalInvitation(
 *   tenantId,
 *   staffUserId,
 *   [clientId],
 *   { status: "pending" }
 * );
 * tracker.clientPortalInvitations?.push(invitation.id);
 */
export async function createTestClientPortalInvitation(
  tenantId: string,
  invitedBy: string,
  clientIds: string[],
  overrides: Partial<typeof clientPortalInvitations.$inferInsert> = {},
) {
  const invitationId = crypto.randomUUID();
  const timestamp = Date.now();
  const token = crypto.randomBytes(32).toString("hex");

  const [invitation] = await db
    .insert(clientPortalInvitations)
    .values({
      id: invitationId,
      tenantId,
      email: overrides.email || `invite-${timestamp}@example.com`,
      firstName: overrides.firstName || "Invited",
      lastName: overrides.lastName || "User",
      clientIds: overrides.clientIds || clientIds,
      role: overrides.role || "viewer",
      token: overrides.token || token,
      invitedBy,
      status: overrides.status || "pending",
      expiresAt:
        overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sentAt: overrides.sentAt || new Date(),
      acceptedAt: overrides.acceptedAt || null,
      revokedAt: overrides.revokedAt || null,
      revokedBy: overrides.revokedBy || null,
      metadata: overrides.metadata || null,
      ...overrides,
    })
    .returning();

  return invitation;
}

/**
 * Create a test client portal access record (links portal user to client)
 *
 * @example
 * const access = await createTestClientPortalAccess(
 *   tenantId,
 *   portalUserId,
 *   clientId,
 *   staffUserId,
 *   { role: "editor" }
 * );
 * tracker.clientPortalAccess?.push(access.id);
 */
export async function createTestClientPortalAccess(
  tenantId: string,
  portalUserId: string,
  clientId: string,
  grantedBy: string,
  overrides: Partial<typeof clientPortalAccess.$inferInsert> = {},
) {
  const accessId = crypto.randomUUID();

  const [access] = await db
    .insert(clientPortalAccess)
    .values({
      id: accessId,
      tenantId,
      portalUserId,
      clientId,
      role: overrides.role || "viewer",
      grantedBy,
      isActive: overrides.isActive ?? true,
      expiresAt: overrides.expiresAt || null,
      grantedAt: overrides.grantedAt || new Date(),
      ...overrides,
    })
    .returning();

  return access;
}
