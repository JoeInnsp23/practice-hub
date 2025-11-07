import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { departments, users } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

export const departmentsRouter = router({
  // List all departments for the tenant
  list: protectedProcedure
    .input(
      z
        .object({
          includeInactive: z.boolean().optional().default(false),
          sortBy: z
            .enum(["name", "manager", "staffCount", "status"])
            .optional(),
          sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const where = input?.includeInactive
        ? eq(departments.tenantId, tenantId)
        : and(
            eq(departments.tenantId, tenantId),
            eq(departments.isActive, true),
          );

      // Build orderBy based on sortBy and sortOrder
      const orderByArray = [];
      const sortDirection = input?.sortOrder === "desc" ? desc : asc;

      if (input?.sortBy) {
        switch (input.sortBy) {
          case "name":
            orderByArray.push(sortDirection(departments.name));
            break;
          case "manager":
            // Sort by manager name (firstName + lastName)
            orderByArray.push(
              sortDirection(
                sql`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`
              )
            );
            break;
          case "status":
            orderByArray.push(sortDirection(departments.isActive));
            break;
          // Note: staffCount will be handled after the query since it's calculated separately
        }
      } else {
        // Default sorting by name
        orderByArray.push(asc(departments.name));
      }

      const departmentList = await db
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          managerId: departments.managerId,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
          managerName: sql<string | null>`
            CASE
              WHEN ${departments.managerId} IS NOT NULL
              THEN COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})
              ELSE NULL
            END
          `,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .where(where)
        .orderBy(...orderByArray);

      // Get staff counts for each department
      const departmentIds = departmentList.map((dept) => dept.id);

      const staffCounts = await db
        .select({
          departmentId: users.departmentId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.isActive, true),
            sql`${users.departmentId} IN (${sql.join(
              departmentIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        )
        .groupBy(users.departmentId);

      const staffCountMap = new Map(
        staffCounts.map((sc) => [sc.departmentId, sc.count]),
      );

      let result = departmentList.map((dept) => ({
        ...dept,
        staffCount: staffCountMap.get(dept.id) || 0,
      }));

      // If sorting by staffCount, do it after we've calculated the counts
      if (input?.sortBy === "staffCount") {
        result.sort((a, b) => {
          if (input.sortOrder === "desc") {
            return b.staffCount - a.staffCount;
          } else {
            return a.staffCount - b.staffCount;
          }
        });
      }

      return {
        departments: result,
      };
    }),

  // Get a single department by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [department] = await db
        .select({
          id: departments.id,
          name: departments.name,
          description: departments.description,
          managerId: departments.managerId,
          isActive: departments.isActive,
          createdAt: departments.createdAt,
          updatedAt: departments.updatedAt,
          managerName: sql<string | null>`
            CASE
              WHEN ${departments.managerId} IS NOT NULL
              THEN COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})
              ELSE NULL
            END
          `,
        })
        .from(departments)
        .leftJoin(users, eq(departments.managerId, users.id))
        .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      return { department };
    }),

  // Get all staff members for a specific department
  getStaffByDepartment: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: departmentId }) => {
      const { tenantId } = ctx.authContext;

      // Verify department exists and belongs to tenant
      const [department] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(
          and(
            eq(departments.id, departmentId),
            eq(departments.tenantId, tenantId),
          ),
        );

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      const staff = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          name: users.name,
          role: users.role,
          status: users.status,
          hourlyRate: users.hourlyRate,
        })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.departmentId, departmentId),
            eq(users.isActive, true),
          ),
        )
        .orderBy(users.firstName, users.lastName);

      return { staff };
    }),

  // Create a new department (admin only)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        managerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Verify manager exists and belongs to tenant if provided
      if (input.managerId) {
        const [manager] = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(
            and(eq(users.id, input.managerId), eq(users.tenantId, tenantId)),
          );

        if (!manager) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Manager not found",
          });
        }

        // Verify manager has appropriate role
        if (!["admin", "accountant"].includes(manager.role)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Manager must have admin or accountant role",
          });
        }
      }

      const [newDepartment] = await db
        .insert(departments)
        .values({
          id: crypto.randomUUID(),
          tenantId,
          name: input.name,
          description: input.description,
          managerId: input.managerId,
          isActive: true,
        })
        .returning();

      return { department: newDepartment };
    }),

  // Update a department (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        description: z.string().optional(),
        managerId: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { id, ...updates } = input;

      // Verify department exists and belongs to tenant
      const [existingDepartment] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));

      if (!existingDepartment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      // Verify manager exists and belongs to tenant if provided
      if (updates.managerId !== undefined && updates.managerId !== null) {
        const [manager] = await db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(
            and(eq(users.id, updates.managerId), eq(users.tenantId, tenantId)),
          );

        if (!manager) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Manager not found",
          });
        }

        // Verify manager has appropriate role
        if (!["admin", "accountant"].includes(manager.role)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Manager must have admin or accountant role",
          });
        }
      }

      const [updatedDepartment] = await db
        .update(departments)
        .set(updates)
        .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)))
        .returning();

      return { department: updatedDepartment };
    }),

  // Soft delete a department (admin only)
  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      // Verify department exists and belongs to tenant
      const [existingDepartment] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));

      if (!existingDepartment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Department not found",
        });
      }

      // Check if department has active staff members
      const [staffCount] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.departmentId, id),
            eq(users.isActive, true),
          ),
        );

      if (staffCount && staffCount.count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete department with ${staffCount.count} active staff member(s). Please reassign staff first.`,
        });
      }

      // Soft delete
      await db
        .update(departments)
        .set({ isActive: false })
        .where(and(eq(departments.id, id), eq(departments.tenantId, tenantId)));

      return { success: true };
    }),
});
