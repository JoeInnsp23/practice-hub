import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { departments, tenants, users } from "@/lib/db/schema";
import { appRouter } from "../../app/server";
import { cleanupTestData, type TestDataTracker } from "../helpers/factories";
import { createMockContext } from "../helpers/trpc";

// Helper to create test context with auth parameters
function createTestContext(params: {
  userId: string;
  tenantId: string;
  role: string;
}) {
  return createMockContext({
    authContext: {
      userId: params.userId,
      tenantId: params.tenantId,
      role: params.role,
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    },
  });
}

describe("departments router", () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let admin1Id: string;
  let accountant1Id: string;
  let member1Id: string;
  let admin2Id: string;
  let taxDeptId: string;
  let auditDeptId: string;
  let tenant2DeptId: string;
  let admin1: typeof users.$inferSelect;
  let accountant1: typeof users.$inferSelect;
  let member1: typeof users.$inferSelect;
  let admin2: typeof users.$inferSelect;

  const tracker: Required<
    Pick<TestDataTracker, "tenants" | "users" | "clients">
  > &
    TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
  };

  afterEach(async () => {
    await cleanupTestData(tracker);
  });

  beforeEach(async () => {
    // Create two tenants for multi-tenant isolation tests
    const timestamp = Date.now();
    const [tenant1, tenant2] = await db
      .insert(tenants)
      .values([
        {
          id: crypto.randomUUID(),
          name: "Test Firm 1",
          slug: `test-firm-1-${timestamp}`,
        },
        {
          id: crypto.randomUUID(),
          name: "Test Firm 2",
          slug: `test-firm-2-${timestamp}`,
        },
      ])
      .returning();

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;
    tracker.tenants.push(tenant1Id, tenant2Id);

    // Create departments for tenant 1
    const [taxDept, auditDept] = await db
      .insert(departments)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          name: "Tax",
          description: "Tax department",
          managerId: null,
          isActive: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          name: "Audit",
          description: "Audit department",
          managerId: null,
          isActive: true,
        },
      ])
      .returning();

    taxDeptId = taxDept.id;
    auditDeptId = auditDept.id;

    // Create a department for tenant 2
    const [tenant2Dept] = await db
      .insert(departments)
      .values({
        id: crypto.randomUUID(),
        tenantId: tenant2Id,
        name: "Advisory",
        description: "Advisory department",
        managerId: null,
        isActive: true,
      })
      .returning();

    tenant2DeptId = tenant2Dept.id;

    // Create users for tenant 1
    [admin1, accountant1, member1] = await db
      .insert(users)
      .values([
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `admin1-${timestamp}@test.com`,
          name: "Admin One",
          firstName: "Admin",
          lastName: "One",
          role: "admin",
          departmentId: taxDeptId,
          emailVerified: true,
          isActive: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `accountant1-${timestamp}@test.com`,
          name: "Accountant One",
          firstName: "Accountant",
          lastName: "One",
          role: "accountant",
          departmentId: auditDeptId,
          emailVerified: true,
          isActive: true,
        },
        {
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          email: `member1-${timestamp}@test.com`,
          name: "Member One",
          firstName: "Member",
          lastName: "One",
          role: "member",
          departmentId: taxDeptId,
          emailVerified: true,
          isActive: true,
        },
      ])
      .returning();

    admin1Id = admin1.id;
    accountant1Id = accountant1.id;
    member1Id = member1.id;
    tracker.users.push(admin1Id, accountant1Id, member1Id);

    // Update departments with managers
    await db
      .update(departments)
      .set({ managerId: admin1Id })
      .where(eq(departments.id, taxDeptId));

    await db
      .update(departments)
      .set({ managerId: accountant1Id })
      .where(eq(departments.id, auditDeptId));

    // Create user for tenant 2
    [admin2] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        tenantId: tenant2Id,
        email: `admin2-${timestamp}@test.com`,
        name: "Admin Two",
        firstName: "Admin",
        lastName: "Two",
        role: "admin",
        departmentId: tenant2DeptId,
        emailVerified: true,
        isActive: true,
      })
      .returning();

    admin2Id = admin2.id;
    tracker.users.push(admin2Id);
  });

  describe("list", () => {
    it("should list departments for the current tenant", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      expect(result.departments).toHaveLength(2);
      expect(result.departments[0]?.name).toBe("Audit");
      expect(result.departments[1]?.name).toBe("Tax");
    });

    it("should include staff counts for each department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      const taxDept = result.departments.find((d) => d.name === "Tax");
      const auditDept = result.departments.find((d) => d.name === "Audit");

      expect(taxDept?.staffCount).toBe(2); // admin1 and member1
      expect(auditDept?.staffCount).toBe(1); // accountant1
    });

    it("should only show active departments by default", async () => {
      // Create an inactive department
      await db.insert(departments).values({
        id: crypto.randomUUID(),
        tenantId: tenant1Id,
        name: "Inactive Dept",
        description: "Inactive",
        managerId: null,
        isActive: false,
      });

      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      expect(result.departments).toHaveLength(2);
      expect(result.departments.every((d) => d.isActive)).toBe(true);
    });

    it("should include inactive departments when requested", async () => {
      // Create an inactive department
      await db.insert(departments).values({
        id: crypto.randomUUID(),
        tenantId: tenant1Id,
        name: "Inactive Dept",
        description: "Inactive",
        managerId: null,
        isActive: false,
      });

      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list({ includeInactive: true });

      expect(result.departments).toHaveLength(3);
    });

    it("should NOT return departments from other tenants", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.list();

      expect(result.departments).toHaveLength(2);
      expect(result.departments.every((d) => d.name !== "Advisory")).toBe(true);
    });
  });

  describe("getById", () => {
    it("should get a department by ID", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.getById(taxDeptId);

      expect(result.department.name).toBe("Tax");
      expect(result.department.description).toBe("Tax department");
      expect(result.department.managerId).toBe(admin1Id);
      expect(result.department.managerName).toBe("Admin One");
    });

    it("should throw NOT_FOUND for non-existent department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.getById(crypto.randomUUID()),
      ).rejects.toThrow("Department not found");
    });

    it("should throw NOT_FOUND when accessing another tenant's department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.getById(tenant2DeptId)).rejects.toThrow(
        "Department not found",
      );
    });
  });

  describe("getStaffByDepartment", () => {
    it("should get all staff in a department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.getStaffByDepartment(taxDeptId);

      expect(result.staff).toHaveLength(2);
      const emails = result.staff.map((s) => s.email);
      expect(emails).toContain(admin1.email);
      expect(emails).toContain(member1.email);
    });

    it("should throw NOT_FOUND for non-existent department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.getStaffByDepartment(crypto.randomUUID()),
      ).rejects.toThrow("Department not found");
    });

    it("should throw NOT_FOUND when accessing another tenant's department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.getStaffByDepartment(tenant2DeptId),
      ).rejects.toThrow("Department not found");
    });
  });

  describe("create", () => {
    it("should allow admin to create a department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.create({
        name: "Advisory",
        description: "Advisory services",
        managerId: accountant1Id,
      });

      expect(result.department.name).toBe("Advisory");
      expect(result.department.description).toBe("Advisory services");
      expect(result.department.managerId).toBe(accountant1Id);
      expect(result.department.tenantId).toBe(tenant1Id);
      expect(result.department.isActive).toBe(true);
    });

    it("should allow creating department without manager", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.create({
        name: "Advisory",
        description: "Advisory services",
      });

      expect(result.department.name).toBe("Advisory");
      expect(result.department.managerId).toBeNull();
    });

    it("should reject non-admin users", async () => {
      const ctx = createTestContext({
        userId: member1Id,
        tenantId: tenant1Id,
        role: "member",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({
          name: "Advisory",
          description: "Advisory services",
        }),
      ).rejects.toThrow("Admin access required");
    });

    it("should reject invalid manager from different tenant", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({
          name: "Advisory",
          description: "Advisory services",
          managerId: admin2Id, // From tenant2
        }),
      ).rejects.toThrow("Manager not found");
    });

    it("should reject manager with member role", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.create({
          name: "Advisory",
          description: "Advisory services",
          managerId: member1Id,
        }),
      ).rejects.toThrow("Manager must have admin or accountant role");
    });
  });

  describe("update", () => {
    it("should allow admin to update a department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.update({
        id: taxDeptId,
        name: "Tax & Planning",
        description: "Updated description",
      });

      expect(result.department.name).toBe("Tax & Planning");
      expect(result.department.description).toBe("Updated description");
    });

    it("should allow updating manager", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.update({
        id: taxDeptId,
        managerId: accountant1Id,
      });

      expect(result.department.managerId).toBe(accountant1Id);
    });

    it("should allow removing manager by setting to null", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.update({
        id: taxDeptId,
        managerId: null,
      });

      expect(result.department.managerId).toBeNull();
    });

    it("should reject non-admin users", async () => {
      const ctx = createTestContext({
        userId: member1Id,
        tenantId: tenant1Id,
        role: "member",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.update({
          id: taxDeptId,
          name: "Updated",
        }),
      ).rejects.toThrow("Admin access required");
    });

    it("should throw NOT_FOUND when updating another tenant's department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.departments.update({
          id: tenant2DeptId,
          name: "Updated",
        }),
      ).rejects.toThrow("Department not found");
    });
  });

  describe("delete", () => {
    it("should allow admin to soft delete a department with no staff", async () => {
      // Create department with no staff
      const [emptyDept] = await db
        .insert(departments)
        .values({
          id: crypto.randomUUID(),
          tenantId: tenant1Id,
          name: "Empty Dept",
          description: "No staff",
          managerId: null,
          isActive: true,
        })
        .returning();

      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.departments.delete(emptyDept.id);

      expect(result.success).toBe(true);

      // Verify it's soft deleted
      const [deleted] = await db
        .select()
        .from(departments)
        .where(eq(departments.id, emptyDept.id));

      expect(deleted?.isActive).toBe(false);
    });

    it("should reject deletion if department has active staff", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.delete(taxDeptId)).rejects.toThrow(
        "Cannot delete department with 2 active staff member(s)",
      );
    });

    it("should reject non-admin users", async () => {
      const ctx = createTestContext({
        userId: member1Id,
        tenantId: tenant1Id,
        role: "member",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.delete(taxDeptId)).rejects.toThrow(
        "Admin access required",
      );
    });

    it("should throw NOT_FOUND when deleting another tenant's department", async () => {
      const ctx = createTestContext({
        userId: admin1Id,
        tenantId: tenant1Id,
        role: "admin",
      });
      const caller = appRouter.createCaller(ctx);

      await expect(caller.departments.delete(tenant2DeptId)).rejects.toThrow(
        "Department not found",
      );
    });
  });
});
