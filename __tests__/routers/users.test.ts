/**
 * Users Router Tests
 *
 * Tests for the users tRPC router
 */

import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usersRouter } from "@/app/server/routers/users";
import { db } from "@/lib/db";
import { activityLogs, departments, users } from "@/lib/db/schema";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import {
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Mock Better Auth (external dependency - keep mock)
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      createUser: vi.fn().mockResolvedValue({
        user: { id: "test-user-id" },
      }),
      forgetPassword: vi.fn().mockResolvedValue({
        success: true,
      }),
    },
  },
}));

// Mock password reset (external dependency - keep mock)
vi.mock("@/lib/email/password-reset", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/users.ts", () => {
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    departments: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
    // Reset tracker arrays
    tracker.tenants = [];
    tracker.users = [];
    tracker.departments = [];
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(caller.list({})).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(
        caller.list({
          search: "john doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept role filter", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(
        caller.list({
          role: "admin",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept multiple filters", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(
        caller.list({
          search: "test",
          role: "member", // Valid: member, admin, accountant, or "all"
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      // Create another user to query
      const queryUserId = await createTestUser(tenantId);
      tracker.users?.push(queryUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(caller.getById(queryUserId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId);
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "user",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(caller.getById(123 as unknown)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {
        // Missing required fields
        firstName: "John",
      };

      await expect(caller.create(invalidInput as unknown)).rejects.toThrow();
    });

    it("should accept valid user data", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        email: `john-${Date.now()}@example.com`,
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
      };

      await expect(caller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      // Note: email is auto-generated from schema without .email() validation
      const validInput = {
        email: `invalid-email-${Date.now()}`, // Any string is valid
        firstName: "John",
        lastName: "Doe",
        role: "member" as const,
      };

      await expect(caller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept optional phone field", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        email: `john-phone-${Date.now()}@example.com`,
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
        phone: "+1234567890",
      };

      await expect(caller.create(validInput)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {
        // Missing id
        firstName: "Jane",
      };

      await expect(caller.update(invalidInput as unknown)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user to update
      const updateUserId = await createTestUser(tenantId);
      tracker.users?.push(updateUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        id: updateUserId,
        data: {
          firstName: "Jane",
          lastName: "Smith",
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email in updates", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user to update
      const updateUserId = await createTestUser(tenantId);
      tracker.users?.push(updateUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      // Email validation not enforced in schema
      const validInput = {
        id: updateUserId,
        data: {
          email: "not-valid", // Any string is valid
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user to update
      const updateUserId = await createTestUser(tenantId);
      tracker.users?.push(updateUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        id: updateUserId,
        data: {
          phone: "+9876543210",
        },
      };

      await expect(caller.update(validInput)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid user ID", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user to delete
      const deleteUserId = await createTestUser(tenantId);
      tracker.users?.push(deleteUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(caller.delete(deleteUserId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      await expect(caller.delete({} as unknown)).rejects.toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {
        // Missing role
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        caller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid role update", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user to update role
      const updateUserId = await createTestUser(tenantId);
      tracker.users?.push(updateUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        id: updateUserId,
        role: "admin" as const,
      };

      await expect(caller.updateRole(validInput)).resolves.not.toThrow();
    });

    it("should validate id is a string", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {
        id: 123,
        role: "admin",
      };

      await expect(
        caller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });
  });

  describe("sendPasswordReset", () => {
    it("should validate required userId field", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {};

      await expect(
        caller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid userId", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      // Create user for password reset with valid email
      const resetUserId = await createTestUser(tenantId, {
        email: `reset-${Date.now()}@example.com`,
      });
      tracker.users?.push(resetUserId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const validInput = {
        userId: resetUserId,
      };

      await expect(caller.sendPasswordReset(validInput)).resolves.not.toThrow();
    });

    it("should validate userId is a string", async () => {
      const tenantId = await createTestTenant();
      tracker.tenants?.push(tenantId);

      const userId = await createTestUser(tenantId, { role: "admin" });
      tracker.users?.push(userId);

      const ctx = createMockContext({
        authContext: {
          tenantId,
          userId,
          role: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          organizationName: "Test Org",
        },
      });
      const caller = createCaller(usersRouter, ctx);

      const invalidInput = {
        userId: 123, // Should be string
      };

      await expect(
        caller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
    });
  });

  describe("Bulk Operations", () => {
    let integrationCtx: TestContextWithAuth;
    let integrationCaller: ReturnType<typeof createCaller<typeof usersRouter>>;

    beforeEach(async () => {
      // Create test tenant and admin user
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId, { role: "admin" });

      tracker.tenants?.push(tenantId);
      tracker.users?.push(userId);

      // Create mock context with test tenant and user
      integrationCtx = createMockContext({
        authContext: {
          userId,
          tenantId,
          organizationName: "Test Organization",
          role: "admin",
          email: `test-${Date.now()}@example.com`,
          firstName: "Test",
          lastName: "Admin",
        },
      });

      integrationCaller = createCaller(usersRouter, integrationCtx);
    });

    describe("bulkUpdateStatus", () => {
      it("should update status for multiple users", async () => {
        // Create 3 test users
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            status: "pending",
          },
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            status: "pending",
          },
        );
        const user3Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            status: "pending",
          },
        );
        tracker.users?.push(user1Id, user2Id, user3Id);

        const result = await integrationCaller.bulkUpdateStatus({
          userIds: [user1Id, user2Id, user3Id],
          status: "active",
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(3);

        // Verify database state
        const updatedUsers = await db
          .select()
          .from(users)
          .where(eq(users.id, user1Id));

        expect(updatedUsers[0].status).toBe("active");
        expect(updatedUsers[0].isActive).toBe(true);
      });

      it("should enforce multi-tenant isolation", async () => {
        // Create a different tenant
        const otherTenantId = await createTestTenant();
        const otherUserId = await createTestUser(otherTenantId, {
          status: "pending",
        });
        tracker.tenants?.push(otherTenantId);
        tracker.users?.push(otherUserId);

        // Create a user in current tenant
        const currentTenantUserId = await createTestUser(
          integrationCtx.authContext.tenantId,
          { status: "pending" },
        );
        tracker.users?.push(currentTenantUserId);

        // Try to update users from both tenants
        await expect(
          integrationCaller.bulkUpdateStatus({
            userIds: [currentTenantUserId, otherUserId],
            status: "active",
          }),
        ).rejects.toThrow("One or more users not found");
      });

      it("should log activity for bulk status update (AC22)", async () => {
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            status: "pending",
          },
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            status: "pending",
          },
        );
        tracker.users?.push(user1Id, user2Id);

        await integrationCaller.bulkUpdateStatus({
          userIds: [user1Id, user2Id],
          status: "active",
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_status_update"),
              eq(activityLogs.tenantId, integrationCtx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk updated user status");
      });

      it("should prevent admin from deactivating own account (AC18 - CRITICAL)", async () => {
        // Try to deactivate the current admin user (self)
        await expect(
          integrationCaller.bulkUpdateStatus({
            userIds: [integrationCtx.authContext.userId],
            status: "inactive",
          }),
        ).rejects.toThrow(
          "Cannot deactivate your own account via bulk operation",
        );

        // Verify user status unchanged
        const adminUser = await db
          .select()
          .from(users)
          .where(eq(users.id, integrationCtx.authContext.userId))
          .limit(1);

        expect(adminUser[0].status).not.toBe("inactive");
      });
    });

    describe("bulkChangeRole", () => {
      it("should change role for multiple users", async () => {
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            role: "member",
          },
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            role: "member",
          },
        );
        tracker.users?.push(user1Id, user2Id);

        const result = await integrationCaller.bulkChangeRole({
          userIds: [user1Id, user2Id],
          role: "accountant",
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);

        // Verify database state
        const updatedUsers = await db
          .select()
          .from(users)
          .where(eq(users.id, user1Id));

        expect(updatedUsers[0].role).toBe("accountant");
      });

      it("should enforce multi-tenant isolation", async () => {
        // Create a different tenant
        const otherTenantId = await createTestTenant();
        const otherUserId = await createTestUser(otherTenantId, {
          role: "member",
        });
        tracker.tenants?.push(otherTenantId);
        tracker.users?.push(otherUserId);

        // Try to change role for user in different tenant
        await expect(
          integrationCaller.bulkChangeRole({
            userIds: [otherUserId],
            role: "admin",
          }),
        ).rejects.toThrow("One or more users not found");
      });

      it("should log activity for bulk role change (AC22)", async () => {
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            role: "member",
          },
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
          {
            role: "member",
          },
        );
        tracker.users?.push(user1Id, user2Id);

        await integrationCaller.bulkChangeRole({
          userIds: [user1Id, user2Id],
          role: "admin",
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_role_change"),
              eq(activityLogs.tenantId, integrationCtx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk changed user role");
      });

      it("should handle invalid role values", async () => {
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        tracker.users?.push(user1Id);

        await expect(
          integrationCaller.bulkChangeRole({
            userIds: [user1Id],
            // biome-ignore lint/suspicious/noExplicitAny: Testing invalid role value
            role: "invalid_role" as any,
          }),
        ).rejects.toThrow();
      });
    });

    describe("bulkAssignDepartment", () => {
      it("should assign department to multiple users", async () => {
        // Create a test department
        const [department] = await db
          .insert(departments)
          .values({
            id: crypto.randomUUID(),
            tenantId: integrationCtx.authContext.tenantId,
            name: "Test Department",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        tracker.departments?.push(department.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        tracker.users?.push(user1Id, user2Id);

        const result = await integrationCaller.bulkAssignDepartment({
          userIds: [user1Id, user2Id],
          departmentId: department.id,
        });

        expect(result.success).toBe(true);
        expect(result.count).toBe(2);

        // Verify database state
        const updatedUsers = await db
          .select()
          .from(users)
          .where(eq(users.id, user1Id));

        expect(updatedUsers[0].departmentId).toBe(department.id);
      });

      it("should enforce multi-tenant isolation", async () => {
        // Create a department in different tenant
        const otherTenantId = await createTestTenant();
        tracker.tenants?.push(otherTenantId);

        const [otherDepartment] = await db
          .insert(departments)
          .values({
            id: crypto.randomUUID(),
            tenantId: otherTenantId,
            name: "Other Department",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        tracker.departments?.push(otherDepartment.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        tracker.users?.push(user1Id);

        // Try to assign department from different tenant
        await expect(
          integrationCaller.bulkAssignDepartment({
            userIds: [user1Id],
            departmentId: otherDepartment.id,
          }),
        ).rejects.toThrow("Department not found");
      });

      it("should log activity for bulk department assignment (AC22)", async () => {
        const [department] = await db
          .insert(departments)
          .values({
            id: crypto.randomUUID(),
            tenantId: integrationCtx.authContext.tenantId,
            name: "Test Department",
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        tracker.departments?.push(department.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        tracker.users?.push(user1Id, user2Id);

        await integrationCaller.bulkAssignDepartment({
          userIds: [user1Id, user2Id],
          departmentId: department.id,
        });

        // Verify activity logs (AC22 - Audit Logging)
        const logs = await db
          .select()
          .from(activityLogs)
          .where(
            and(
              eq(activityLogs.action, "bulk_department_assign"),
              eq(activityLogs.tenantId, integrationCtx.authContext.tenantId),
            ),
          );

        expect(logs.length).toBeGreaterThanOrEqual(2);
        expect(logs[0].description).toContain("Bulk assigned user");
      });

      it("should validate department exists", async () => {
        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        tracker.users?.push(user1Id);

        const nonExistentDeptId = crypto.randomUUID();

        await expect(
          integrationCaller.bulkAssignDepartment({
            userIds: [user1Id],
            departmentId: nonExistentDeptId,
          }),
        ).rejects.toThrow("Department not found");
      });
    });

    describe("Transaction Safety (AC23)", () => {
      it("should rollback on partial failure - bulkUpdateStatus", async () => {
        // Create one valid user
        const validUserId = await createTestUser(
          integrationCtx.authContext.tenantId,
          { status: "pending" },
        );
        tracker.users?.push(validUserId);

        const nonExistentUserId = crypto.randomUUID();

        // Try to update one valid and one non-existent user
        await expect(
          integrationCaller.bulkUpdateStatus({
            userIds: [validUserId, nonExistentUserId],
            status: "active",
          }),
        ).rejects.toThrow("One or more users not found");

        // Verify valid user was NOT updated (transaction rolled back)
        const validUser = await db
          .select()
          .from(users)
          .where(eq(users.id, validUserId))
          .limit(1);

        expect(validUser[0].status).toBe("pending");
      });
    });
  });

  describe("Router Structure", () => {
    it("should export all expected procedures", () => {
      const procedures = Object.keys(usersRouter._def.procedures);

      expect(procedures).toContain("list");
      expect(procedures).toContain("getById");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("updateRole");
      expect(procedures).toContain("sendPasswordReset");
      expect(procedures).toContain("bulkUpdateStatus");
      expect(procedures).toContain("bulkChangeRole");
      expect(procedures).toContain("bulkAssignDepartment");
    });

    it("should have 10 procedures total", () => {
      const procedures = Object.keys(usersRouter._def.procedures);
      expect(procedures).toHaveLength(10);
    });
  });
});
