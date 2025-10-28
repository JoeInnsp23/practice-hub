/**
 * Email Templates Router Tests
 *
 * Tests the email templates tRPC router (FR32: AC11)
 * - Template CRUD operations
 * - Template preview with sample data
 * - Send test email
 * - Multi-tenant isolation
 * - Input validation
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emailTemplatesRouter } from "@/app/server/routers/email-templates";
import { db } from "@/lib/db";
import { emailQueue, emailTemplates, tenants, users } from "@/lib/db/schema";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

describe("Email Templates Router", () => {
  let testTenantId: string;
  let testUserId: string;
  let ctx: TestContextWithAuth;
  let caller: ReturnType<typeof createCaller<typeof emailTemplatesRouter>>;

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

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: `user-${Date.now()}`,
        tenantId: testTenantId,
        email: `admin-${Date.now()}@test.com`,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      })
      .returning();
    testUserId = user.id;

    // Create caller with auth context
    ctx = createMockContext({
      authContext: {
        tenantId: testTenantId,
        userId: testUserId,
        organizationName: "Test Tenant",
        role: "admin",
        email: `admin-${Date.now()}@test.com`,
        firstName: "Admin",
        lastName: "User",
      },
    });

    caller = createCaller(emailTemplatesRouter, ctx);
  });

  afterEach(async () => {
    // Cleanup
    if (testTenantId) {
      await db.delete(emailQueue).where(eq(emailQueue.tenantId, testTenantId));
      await db
        .delete(emailTemplates)
        .where(eq(emailTemplates.tenantId, testTenantId));
      await db.delete(users).where(eq(users.tenantId, testTenantId));
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
  });

  describe("Test 1-9: Email Templates CRUD", () => {
    it("Test 1: should create email template with all fields and return ID", async () => {
      const result = await caller.create({
        templateName: "New Task Assigned",
        templateType: "task_assigned",
        subject: "Task assigned: {task_name}",
        bodyHtml: "<p>Hi {staff_name}, task {task_name} assigned.</p>",
        bodyText: "Hi {staff_name}, task {task_name} assigned.",
        variables: ["staff_name", "task_name"],
        isActive: true,
      });

      expect(result).toBeTruthy();
      expect(result.template).toBeTruthy();
      expect(result.template.id).toBeTruthy();
      expect(result.template.templateName).toBe("New Task Assigned");
      expect(result.template.templateType).toBe("task_assigned");
      expect(result.template.tenantId).toBe(testTenantId);
    });

    it("Test 2: should list all templates for tenant and filter by type", async () => {
      // Create 3 templates
      await caller.create({
        templateName: "Task Assigned",
        templateType: "task_assigned",
        subject: "Task {task_name}",
        bodyHtml: "<p>Task assigned</p>",
        bodyText: "Task assigned",
        variables: ["task_name"],
        isActive: true,
      });

      await caller.create({
        templateName: "Task Overdue",
        templateType: "task_overdue",
        subject: "Overdue: {task_name}",
        bodyHtml: "<p>Task overdue</p>",
        bodyText: "Task overdue",
        variables: ["task_name"],
        isActive: true,
      });

      await caller.create({
        templateName: "Task Due Soon",
        templateType: "task_due_soon",
        subject: "Due soon: {task_name}",
        bodyHtml: "<p>Task due soon</p>",
        bodyText: "Task due soon",
        variables: ["task_name"],
        isActive: true,
      });

      // List all templates
      const allTemplatesResult = await caller.list({});
      expect(allTemplatesResult.templates).toHaveLength(3);

      // Filter by type
      const taskAssignedTemplatesResult = await caller.list({
        templateType: "task_assigned",
      });
      expect(taskAssignedTemplatesResult.templates).toHaveLength(1);
      expect(taskAssignedTemplatesResult.templates[0].templateType).toBe(
        "task_assigned",
      );
    });

    it("Test 3: should get template by ID with all fields", async () => {
      const created = await caller.create({
        templateName: "Test Template",
        templateType: "workflow_stage_complete",
        subject: "Test subject",
        bodyHtml: "<p>Test body</p>",
        bodyText: "Test body",
        variables: ["client_name"],
        isActive: true,
      });

      const fetched = await caller.getById({ id: created.template.id });

      expect(fetched).toBeTruthy();
      expect(fetched.template).toBeTruthy();
      expect(fetched.template.id).toBe(created.template.id);
      expect(fetched.template.templateName).toBe("Test Template");
      expect(fetched.template.subject).toBe("Test subject");
      expect(fetched.template.bodyHtml).toBe("<p>Test body</p>");
      expect(fetched.template.variables).toEqual(["client_name"]);
    });

    it("Test 4: should update template subject, bodyHtml, and variables", async () => {
      const created = await caller.create({
        templateName: "Original Template",
        templateType: "task_assigned",
        subject: "Original subject",
        bodyHtml: "<p>Original body</p>",
        bodyText: "Original body",
        variables: ["task_name"],
        isActive: true,
      });

      const updated = await caller.update({
        id: created.template.id,
        subject: "Updated subject",
        bodyHtml: "<p>Updated body with {client_name}</p>",
        variables: ["task_name", "client_name"],
      });

      expect(updated.template.id).toBe(created.template.id);
      expect(updated.template.subject).toBe("Updated subject");
      expect(updated.template.bodyHtml).toBe(
        "<p>Updated body with {client_name}</p>",
      );
      expect(updated.template.variables).toEqual(["task_name", "client_name"]);
      expect(updated.template.templateName).toBe("Original Template"); // Unchanged
    });

    it("Test 5: should soft delete template (set isActive = false)", async () => {
      const created = await caller.create({
        templateName: "Template to Delete",
        templateType: "client_created",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        bodyText: "Body",
        variables: [],
        isActive: true,
      });

      expect(created.template.isActive).toBe(true);

      await caller.delete({ id: created.template.id });

      const deleted = await caller.getById({ id: created.template.id });
      expect(deleted.template.isActive).toBe(false);
    });

    it("Test 6: Multi-tenant isolation - Tenant A cannot see Tenant B templates", async () => {
      // Create template in Tenant A (our test tenant)
      const templateA = await caller.create({
        templateName: "Tenant A Template",
        templateType: "task_assigned",
        subject: "Subject A",
        bodyHtml: "<p>Body A</p>",
        bodyText: "Body A",
        variables: [],
        isActive: true,
      });

      // Create Tenant B
      const [tenantB] = await db
        .insert(tenants)
        .values({
          id: `tenant-b-${Date.now()}`,
          name: "Tenant B",
          slug: `tenant-b-${Date.now()}`,
        })
        .returning();

      const [userB] = await db
        .insert(users)
        .values({
          id: `user-b-${Date.now()}`,
          tenantId: tenantB.id,
          email: `user-b-${Date.now()}@test.com`,
          firstName: "User",
          lastName: "B",
          role: "admin",
        })
        .returning();

      // Create caller for Tenant B
      const ctxB = createMockContext({
        authContext: {
          tenantId: tenantB.id,
          userId: userB.id,
          organizationName: "Tenant B",
          role: "admin",
          email: userB.email,
          firstName: userB.firstName,
          lastName: userB.lastName,
        },
      });

      const callerB = createCaller(emailTemplatesRouter, ctxB);

      // Tenant B should not see Tenant A's template
      const templatesBForTenantB = await callerB.list({});
      expect(templatesBForTenantB.templates).toHaveLength(0);

      // Tenant B cannot access Tenant A's template by ID
      await expect(
        callerB.getById({ id: templateA.template.id }),
      ).rejects.toThrow();

      // Cleanup Tenant B
      await db.delete(users).where(eq(users.tenantId, tenantB.id));
      await db.delete(tenants).where(eq(tenants.id, tenantB.id));
    });

    it("Test 7: should reject empty subject and bodyHtml", async () => {
      await expect(
        caller.create({
          templateName: "Invalid Template",
          templateType: "task_assigned",
          subject: "", // Empty subject
          bodyHtml: "<p>Body</p>",
          bodyText: "Body",
          variables: [],
          isActive: true,
        }),
      ).rejects.toThrow();

      await expect(
        caller.create({
          templateName: "Invalid Template",
          templateType: "task_assigned",
          subject: "Subject",
          bodyHtml: "", // Empty body
          bodyText: "Body",
          variables: [],
          isActive: true,
        }),
      ).rejects.toThrow();
    });

    it("Test 8: should preview template with sample data and render HTML", async () => {
      const created = await caller.create({
        templateName: "Preview Template",
        templateType: "workflow_stage_complete",
        subject: "Stage {stage_name} complete for {client_name}",
        bodyHtml:
          "<p>Hi {staff_name}, stage {stage_name} complete. Client: {client_name}. Task: {task_name}.</p>",
        bodyText: "Stage complete",
        variables: ["stage_name", "client_name", "staff_name", "task_name"],
        isActive: true,
      });

      const preview = await caller.preview({
        id: created.template.id,
        subject: created.template.subject,
        bodyHtml: created.template.bodyHtml,
        sampleData: {
          stage_name: "Review Stage",
          client_name: "Acme Corp",
          staff_name: "John Doe",
          task_name: "VAT Return Q3",
        },
      });

      expect(preview.subject).toContain("Review Stage");
      expect(preview.subject).toContain("Acme Corp");
      expect(preview.bodyHtml).toContain("John Doe");
      expect(preview.bodyHtml).toContain("VAT Return Q3");
      expect(preview.bodyHtml).not.toContain("{stage_name}"); // Variables replaced
    });

    it("Test 9: should send test email and queue it for delivery", async () => {
      const created = await caller.create({
        templateName: "Test Email Template",
        templateType: "task_assigned",
        subject: "Test: {task_name}",
        bodyHtml: "<p>Test email for {staff_name}</p>",
        bodyText: "Test email",
        variables: ["task_name", "staff_name"],
        isActive: true,
      });

      await caller.sendTest({
        id: created.template.id,
        recipientEmail: "test@example.com",
        sampleData: {
          task_name: "Sample Task",
          staff_name: "Test User",
        },
      });

      // Verify email was queued
      const queuedEmails = await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.tenantId, testTenantId));

      expect(queuedEmails).toHaveLength(1);
      expect(queuedEmails[0].recipientEmail).toBe("test@example.com");
      expect(queuedEmails[0].subject).toContain("Sample Task");
      expect(queuedEmails[0].bodyHtml).toContain("Test User");
      expect(queuedEmails[0].status).toBe("pending");
    });
  });
});
