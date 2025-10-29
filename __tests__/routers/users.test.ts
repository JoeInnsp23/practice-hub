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
  createAdminCaller,
  createCaller,
  createMockContext,
  type TestContextWithAuth,
} from "../helpers/trpc";

// Use vi.hoisted with dynamic import to create db mock before vi.mock processes
const mockedDb = await vi.hoisted(async () => {
  const { createDbMock } = await import("../helpers/db-mock");
  return createDbMock();
});

// Mock the database with proper thenable pattern
vi.mock("@/lib/db", () => ({
  db: mockedDb,
}));

// Mock Better Auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      createUser: vi.fn().mockResolvedValue({
        user: { id: "test-user-id" },
      }),
    },
  },
}));

// Mock password reset
vi.mock("@/lib/email/password-reset", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("app/server/routers/users.ts", () => {
  let ctx: TestContextWithAuth;
  let _caller: ReturnType<typeof createCaller<typeof usersRouter>>;
  let _adminCaller: ReturnType<typeof createAdminCaller<typeof usersRouter>>;

  beforeEach(() => {
    ctx = createMockContext();
    _caller = createCaller(usersRouter, ctx);
    _adminCaller = createAdminCaller(usersRouter);
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should accept empty input", async () => {
      await expect(_caller.list({})).resolves.not.toThrow();
    });

    it("should accept search parameter", async () => {
      await expect(
        _caller.list({
          search: "john doe",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept role filter", async () => {
      await expect(
        _caller.list({
          role: "admin",
        }),
      ).resolves.not.toThrow();
    });

    it("should accept multiple filters", async () => {
      await expect(
        _caller.list({
          search: "test",
          role: "member", // Valid: member, admin, accountant, or "all"
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("getById", () => {
    it("should accept valid UUID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(_caller.getById(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_caller.getById(123 as unknown)).rejects.toThrow();
    });
  });

  describe("create", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing required fields
        firstName: "John",
      };

      await expect(
        _adminCaller.create(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid user data", async () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email", async () => {
      // Note: email is auto-generated from schema without .email() validation
      const validInput = {
        email: "invalid-email", // Any string is valid
        firstName: "John",
        lastName: "Doe",
        role: "member" as const,
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });

    it("should accept optional phone field", async () => {
      const validInput = {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user" as const,
        password: "SecurePass123!",
        phone: "+1234567890",
      };

      await expect(_adminCaller.create(validInput)).resolves.not.toThrow();
    });
  });

  describe("update", () => {
    it("should validate required id field", async () => {
      const invalidInput = {
        // Missing id
        firstName: "Jane",
      };

      await expect(_caller.update(invalidInput as unknown)).rejects.toThrow();
    });

    it("should accept valid update data", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          firstName: "Jane",
          lastName: "Smith",
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept any string as email in updates", async () => {
      // Email validation not enforced in schema
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          email: "not-valid", // Any string is valid
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });

    it("should accept partial updates", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        data: {
          phone: "+9876543210",
        },
      };

      await expect(_caller.update(validInput)).resolves.not.toThrow();
    });
  });

  describe("delete", () => {
    it("should accept valid user ID", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";

      await expect(_adminCaller.delete(validId)).resolves.not.toThrow();
    });

    it("should validate input is a string", async () => {
      await expect(_adminCaller.delete({} as unknown)).rejects.toThrow();
    });
  });

  describe("updateRole", () => {
    it("should validate required fields", async () => {
      const invalidInput = {
        // Missing role
        id: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _adminCaller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid role update", async () => {
      const validInput = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        role: "admin" as const,
      };

      await expect(_adminCaller.updateRole(validInput)).resolves.not.toThrow();
    });

    it("should validate id is a string", async () => {
      const invalidInput = {
        id: 123,
        role: "admin",
      };

      await expect(
        _adminCaller.updateRole(invalidInput as unknown),
      ).rejects.toThrow();
    });
  });

  describe("sendPasswordReset", () => {
    it("should validate required userId field", async () => {
      const invalidInput = {};

      await expect(
        _adminCaller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
    });

    it("should accept valid userId", async () => {
      const validInput = {
        userId: "550e8400-e29b-41d4-a716-446655440000",
      };

      await expect(
        _adminCaller.sendPasswordReset(validInput),
      ).resolves.not.toThrow();
    });

    it("should validate userId is a string", async () => {
      const invalidInput = {
        userId: 123, // Should be string
      };

      await expect(
        _adminCaller.sendPasswordReset(invalidInput as unknown),
      ).rejects.toThrow();
    });
  });

  describe("Bulk Operations (Integration)", () => {
    // Integration test context (uses real database, not mocks)
    let integrationCtx: TestContextWithAuth;
    let integrationCaller: ReturnType<typeof createCaller<typeof usersRouter>>;
    const integrationTracker: TestDataTracker = {
      tenants: [],
      users: [],
      departments: [],
    };

    beforeEach(async () => {
      // Unmock the database for integration tests
      vi.unmock("@/lib/db");

      // Create test tenant and admin user
      const tenantId = await createTestTenant();
      const userId = await createTestUser(tenantId, { role: "admin" });

      integrationTracker.tenants?.push(tenantId);
      integrationTracker.users?.push(userId);

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

    afterEach(async () => {
      await cleanupTestData(integrationTracker);
      // Reset tracker
      integrationTracker.tenants = [];
      integrationTracker.users = [];
      integrationTracker.departments = [];

      // Re-mock the database for other tests
      vi.doMock("@/lib/db");
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
        integrationTracker.users?.push(user1Id, user2Id, user3Id);

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
        integrationTracker.tenants?.push(otherTenantId);
        integrationTracker.users?.push(otherUserId);

        // Create a user in current tenant
        const currentTenantUserId = await createTestUser(
          integrationCtx.authContext.tenantId,
          { status: "pending" },
        );
        integrationTracker.users?.push(currentTenantUserId);

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
        integrationTracker.users?.push(user1Id, user2Id);

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
        integrationTracker.users?.push(user1Id, user2Id);

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
        integrationTracker.tenants?.push(otherTenantId);
        integrationTracker.users?.push(otherUserId);

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
        integrationTracker.users?.push(user1Id, user2Id);

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
        integrationTracker.users?.push(user1Id);

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
        integrationTracker.departments?.push(department.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        integrationTracker.users?.push(user1Id, user2Id);

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
        integrationTracker.tenants?.push(otherTenantId);

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
        integrationTracker.departments?.push(otherDepartment.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        integrationTracker.users?.push(user1Id);

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
        integrationTracker.departments?.push(department.id);

        const user1Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        const user2Id = await createTestUser(
          integrationCtx.authContext.tenantId,
        );
        integrationTracker.users?.push(user1Id, user2Id);

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
        integrationTracker.users?.push(user1Id);

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
        integrationTracker.users?.push(validUserId);

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
