/**
 * Workflow Email Triggers Integration Tests
 *
 * Tests the workflow email automation system (FR32: AC3)
 * - Stage completion detection
 * - Email rule triggering
 * - Recipient resolution
 * - Template variable population
 * - Multi-tenant isolation
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clients,
  emailQueue,
  emailTemplates,
  tasks,
  tenants,
  users,
  workflowEmailRules,
  workflows,
  workflowStages,
} from "@/lib/db/schema";
import {
  detectStageCompletion,
  triggerWorkflowEmails,
} from "@/lib/email/workflow-triggers";

describe("Workflow Email Triggers", () => {
  let testTenantId: string;
  let testWorkflowId: string;
  let testStage1Id: string;
  let testStage2Id: string;
  let testTaskId: string;
  let testClientId: string;
  let testStaffId: string;
  let testTemplateId: string;

  beforeEach(async () => {
    // Create test tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        id: `test-tenant-${Date.now()}`,
        name: "Test Tenant",
        slug: `test-tenant-${Date.now()}`,
      })
      .returning();
    testTenantId = tenant.id;

    // Create test staff user
    const [staff] = await db
      .insert(users)
      .values({
        id: `staff-${Date.now()}`,
        tenantId: testTenantId,
        email: `staff-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "Staff",
        role: "staff",
      })
      .returning();
    testStaffId = staff.id;

    // Create test client
    const [client] = await db
      .insert(clients)
      .values({
        tenantId: testTenantId,
        clientCode: `CLIENT-${Date.now()}`,
        name: "Test Client Ltd",
        type: "limited_company",
        status: "active",
        email: `client-${Date.now()}@test.com`,
        accountManagerId: testStaffId,
      })
      .returning();
    testClientId = client.id;

    // Create test workflow
    const [workflow] = await db
      .insert(workflows)
      .values({
        tenantId: testTenantId,
        name: "Test Workflow",
        description: "Test workflow for email triggers",
        type: "approval",
        trigger: "manual",
        version: 1,
        config: {}, // Required field
        createdById: testStaffId,
      })
      .returning();
    testWorkflowId = workflow.id;

    // Create test workflow stages with checklist items
    const [stage1] = await db
      .insert(workflowStages)
      .values({
        workflowId: testWorkflowId,
        name: "Stage 1 - Review",
        description: "Initial review stage",
        stageOrder: 1,
        isRequired: true,
        checklistItems: [
          { id: "item1", text: "Review documents", isRequired: true },
          { id: "item2", text: "Verify data", isRequired: true },
        ],
      })
      .returning();
    testStage1Id = stage1.id;

    const [stage2] = await db
      .insert(workflowStages)
      .values({
        workflowId: testWorkflowId,
        name: "Stage 2 - Approval",
        description: "Final approval stage",
        stageOrder: 2,
        isRequired: true,
        checklistItems: [
          { id: "item1", text: "Approve submission", isRequired: true },
        ],
      })
      .returning();
    testStage2Id = stage2.id;

    // Create test task
    const [task] = await db
      .insert(tasks)
      .values({
        tenantId: testTenantId,
        title: "Test Task",
        description: "Test task for workflow triggers",
        status: "in_progress",
        priority: "high",
        clientId: testClientId,
        assignedToId: testStaffId,
        createdById: testStaffId,
        dueDate: new Date("2025-12-31"),
        workflowId: testWorkflowId,
      })
      .returning();
    testTaskId = task.id;

    // Create test email template
    const [template] = await db
      .insert(emailTemplates)
      .values({
        tenantId: testTenantId,
        templateName: "Test Workflow Email",
        templateType: "workflow_stage_complete",
        subject: "Stage {stage_name} completed",
        bodyHtml:
          "<p>Hi {staff_name}, Stage {stage_name} for {client_name} is complete. Task: {task_name}. Due: {due_date}. Workflow: {workflow_name}. Company: {company_name}.</p>",
        bodyText: "Stage complete",
        variables: [
          "staff_name",
          "stage_name",
          "client_name",
          "task_name",
          "due_date",
          "workflow_name",
          "company_name",
        ],
        isActive: true,
      })
      .returning();
    testTemplateId = template.id;
  });

  afterEach(async () => {
    // Cleanup in correct order (child tables first, then parents)
    if (testTenantId) {
      await db.delete(emailQueue).where(eq(emailQueue.tenantId, testTenantId));
      await db
        .delete(workflowEmailRules)
        .where(eq(workflowEmailRules.tenantId, testTenantId));
      await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.tenantId, testTenantId));
      await db.delete(tasks).where(eq(tasks.tenantId, testTenantId));
      await db
        .delete(workflowStages)
        .where(eq(workflowStages.workflowId, testWorkflowId));
      await db.delete(workflows).where(eq(workflows.tenantId, testTenantId));
      await db.delete(clients).where(eq(clients.tenantId, testTenantId));
      await db.delete(users).where(eq(users.tenantId, testTenantId));
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
  });

  describe("detectStageCompletion", () => {
    it("should detect stage completion when all checklist items completed", () => {
      const stageProgress = {
        [testStage1Id]: {
          checklistItems: {
            item1: {
              completed: true,
              completedBy: "Test Staff",
              completedAt: new Date().toISOString(),
            },
            item2: {
              completed: true,
              completedBy: "Test Staff",
              completedAt: new Date().toISOString(),
            },
          },
        },
      };

      const checklistItems = [
        { id: "item1", text: "Review documents", isRequired: true },
        { id: "item2", text: "Verify data", isRequired: true },
      ];

      const result = detectStageCompletion(
        stageProgress,
        testStage1Id,
        checklistItems,
      );

      expect(result).toBe(true);
    });

    it("should not detect completion when checklist items incomplete", () => {
      const stageProgress = {
        [testStage1Id]: {
          checklistItems: {
            item1: {
              completed: true,
              completedBy: "Test Staff",
              completedAt: new Date().toISOString(),
            },
            item2: {
              completed: false,
              completedBy: null,
              completedAt: null,
            },
          },
        },
      };

      const checklistItems = [
        { id: "item1", text: "Review documents", isRequired: true },
        { id: "item2", text: "Verify data", isRequired: true },
      ];

      const result = detectStageCompletion(
        stageProgress,
        testStage1Id,
        checklistItems,
      );

      expect(result).toBe(false);
    });

    it("should detect completion for stage with no checklist items", () => {
      const stageProgress = {};
      const checklistItems: Array<{
        id: string;
        text: string;
        isRequired?: boolean;
      }> = [];

      const result = detectStageCompletion(
        stageProgress,
        testStage1Id,
        checklistItems,
      );

      expect(result).toBe(true);
    });
  });

  describe("triggerWorkflowEmails", () => {
    it("Test 30: should trigger workflow email rule and queue email when stage completes", async () => {
      // Create workflow email rule for stage 1
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id,
        emailTemplateId: testTemplateId,
        recipientType: "assigned_staff",
        customRecipientEmail: null,
        sendDelayHours: 0,
        isActive: true,
      });

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Verify email was queued
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(1);
      expect(queuedEmails[0].recipientEmail).toContain("staff-");
      expect(queuedEmails[0].recipientEmail).toContain("@test.com");
      expect(queuedEmails[0].subject).toContain("Stage 1 - Review");
      expect(queuedEmails[0].bodyHtml).toContain("Test Staff");
      expect(queuedEmails[0].bodyHtml).toContain("Test Client Ltd");
      expect(queuedEmails[0].status).toBe("pending");
    });

    it("Test 31: should trigger multiple rules per stage (3 rules = 3 emails queued)", async () => {
      // Create 3 different email rules for the same stage
      await db.insert(workflowEmailRules).values([
        {
          tenantId: testTenantId,
          workflowId: testWorkflowId,
          stageId: testStage1Id,
          emailTemplateId: testTemplateId,
          recipientType: "assigned_staff",
          customRecipientEmail: null,
          sendDelayHours: 0,
          isActive: true,
        },
        {
          tenantId: testTenantId,
          workflowId: testWorkflowId,
          stageId: testStage1Id,
          emailTemplateId: testTemplateId,
          recipientType: "client",
          customRecipientEmail: null,
          sendDelayHours: 0,
          isActive: true,
        },
        {
          tenantId: testTenantId,
          workflowId: testWorkflowId,
          stageId: testStage1Id,
          emailTemplateId: testTemplateId,
          recipientType: "custom_email",
          customRecipientEmail: "custom@example.com",
          sendDelayHours: 0,
          isActive: true,
        },
      ]);

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Verify 3 emails were queued
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(3);

      // Verify different recipients
      const recipients = queuedEmails.map((e) => e.recipientEmail);
      expect(recipients).toContain("custom@example.com");
      expect(recipients.some((r) => r.includes("staff-"))).toBe(true);
      expect(recipients.some((r) => r.includes("client-"))).toBe(true);
    });

    it("Test 32: should match both stage-specific rules AND any-stage rules (stageId IS NULL)", async () => {
      // Create stage-specific rule
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id, // Specific stage
        emailTemplateId: testTemplateId,
        recipientType: "assigned_staff",
        customRecipientEmail: null,
        sendDelayHours: 0,
        isActive: true,
      });

      // Create any-stage rule (stageId = null)
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: null, // Any stage
        emailTemplateId: testTemplateId,
        recipientType: "custom_email",
        customRecipientEmail: "anystage@example.com",
        sendDelayHours: 0,
        isActive: true,
      });

      // Trigger workflow emails for stage 1
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Verify BOTH rules triggered (2 emails queued)
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(2);

      const recipients = queuedEmails.map((e) => e.recipientEmail);
      expect(recipients).toContain("anystage@example.com"); // Any-stage rule
      expect(recipients.some((r) => r.includes("staff-"))).toBe(true); // Stage-specific rule
    });

    it("Test 33: should populate all 7 template variables from workflow/client/staff data", async () => {
      // Create workflow email rule
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id,
        emailTemplateId: testTemplateId,
        recipientType: "custom_email",
        customRecipientEmail: "test@example.com",
        sendDelayHours: 0,
        isActive: true,
      });

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Get queued email
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(1);

      const email = queuedEmails[0];

      // Verify all 7 variables were substituted correctly
      expect(email.subject).toContain("Stage 1 - Review"); // {stage_name}
      expect(email.bodyHtml).toContain("Test Staff"); // {staff_name}
      expect(email.bodyHtml).toContain("Test Client Ltd"); // {client_name}
      expect(email.bodyHtml).toContain("Test Task"); // {task_name}
      expect(email.bodyHtml).toContain("31 Dec 2025"); // {due_date} - formatted
      expect(email.bodyHtml).toContain("Test Workflow"); // {workflow_name}
      expect(email.bodyHtml).toContain("Test Tenant"); // {company_name}

      // Verify variables object was stored
      expect(email.variables).toBeTruthy();
      const vars = email.variables as Record<string, unknown>;
      expect(vars.client_name).toBe("Test Client Ltd");
      expect(vars.staff_name).toBe("Test Staff");
      expect(vars.workflow_name).toBe("Test Workflow");
      expect(vars.stage_name).toBe("Stage 1 - Review");
      expect(vars.task_name).toBe("Test Task");
      expect(vars.company_name).toBe("Test Tenant");
      expect(vars.due_date).toBeTruthy();
    });

    it("Test 34: should not queue emails when no rules match the stage (no errors)", async () => {
      // Create rule for stage 2 only
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage2Id, // Different stage
        emailTemplateId: testTemplateId,
        recipientType: "assigned_staff",
        customRecipientEmail: null,
        sendDelayHours: 0,
        isActive: true,
      });

      // Trigger for stage 1 (no matching rules)
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Verify no emails were queued
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(0);
    });

    it("should respect sendDelayHours and schedule email for future", async () => {
      // Create rule with 2 hour delay
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id,
        emailTemplateId: testTemplateId,
        recipientType: "assigned_staff",
        customRecipientEmail: null,
        sendDelayHours: 2, // 2 hour delay
        isActive: true,
      });

      const beforeTrigger = new Date();

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      const afterTrigger = new Date();

      // Get queued email
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(1);

      // Verify sendAt is ~2 hours in the future
      const sendAt = new Date(queuedEmails[0].sendAt);
      const expectedSendAt = new Date(beforeTrigger.getTime() + 2 * 60 * 60 * 1000);

      // Allow 5 second tolerance for test execution time
      expect(sendAt.getTime()).toBeGreaterThanOrEqual(expectedSendAt.getTime() - 5000);
      expect(sendAt.getTime()).toBeLessThanOrEqual(
        new Date(afterTrigger.getTime() + 2 * 60 * 60 * 1000 + 5000).getTime(),
      );
    });

    it("should handle client_manager recipient type correctly", async () => {
      // Create rule with client_manager recipient type
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id,
        emailTemplateId: testTemplateId,
        recipientType: "client_manager",
        customRecipientEmail: null,
        sendDelayHours: 0,
        isActive: true,
      });

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Get queued email
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(1);

      // Verify recipient is the account manager (testStaffId)
      expect(queuedEmails[0].recipientEmail).toContain("staff-");
      expect(queuedEmails[0].recipientName).toBe("Test Staff");
    });

    it("should not trigger emails for inactive rules", async () => {
      // Create inactive rule
      await db.insert(workflowEmailRules).values({
        tenantId: testTenantId,
        workflowId: testWorkflowId,
        stageId: testStage1Id,
        emailTemplateId: testTemplateId,
        recipientType: "assigned_staff",
        customRecipientEmail: null,
        sendDelayHours: 0,
        isActive: false, // Inactive
      });

      // Trigger workflow emails
      await triggerWorkflowEmails(
        testWorkflowId,
        testStage1Id,
        testTenantId,
        testTaskId,
      );

      // Verify no emails were queued
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(0);
    });
  });
});
