import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  departments,
  staffCapacity,
  timeEntries,
  users,
} from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

/**
 * Staff Statistics Router
 *
 * Provides individual and department-level utilization analytics
 */
export const staffStatisticsRouter = router({
  /**
   * Get individual staff utilization for a date range
   * Calculates: (logged_hours / capacity_hours) * 100
   */
  getStaffUtilization: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(), // If not provided, returns all staff
        departmentId: z.string().optional(),
        startDate: z.string(), // ISO date
        endDate: z.string(), // ISO date
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build user filter conditions
      const userConditions = [eq(users.tenantId, tenantId)];
      if (input.userId) {
        userConditions.push(eq(users.id, input.userId));
      }
      if (input.departmentId) {
        userConditions.push(eq(users.departmentId, input.departmentId));
      }

      // Calculate weeks in the date range
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const weeksInRange = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      // Get staff with utilization data
      const staffData = await db
        .select({
          userId: users.id,
          userEmail: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          departmentId: users.departmentId,
          departmentName: departments.name,
          weeklyHours: staffCapacity.weeklyHours,
          totalLoggedHours: sql<number>`COALESCE(SUM(CAST(${timeEntries.hours} AS DECIMAL)), 0)`,
          billableHours: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.billable} THEN CAST(${timeEntries.hours} AS DECIMAL) ELSE 0 END), 0)`,
          nonBillableHours: sql<number>`COALESCE(SUM(CASE WHEN NOT ${timeEntries.billable} THEN CAST(${timeEntries.hours} AS DECIMAL) ELSE 0 END), 0)`,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(
          staffCapacity,
          and(
            eq(staffCapacity.userId, users.id),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .leftJoin(
          timeEntries,
          and(
            eq(timeEntries.userId, users.id),
            eq(timeEntries.tenantId, tenantId),
            gte(timeEntries.date, input.startDate),
            lte(timeEntries.date, input.endDate),
          ),
        )
        .where(and(...userConditions))
        .groupBy(
          users.id,
          users.email,
          users.firstName,
          users.lastName,
          users.role,
          users.departmentId,
          departments.name,
          staffCapacity.weeklyHours,
        );

      // Calculate utilization percentages
      const staffUtilization = staffData.map((staff) => {
        const capacityHours = (staff.weeklyHours || 37.5) * weeksInRange;
        const utilization =
          capacityHours > 0
            ? Math.round((staff.totalLoggedHours / capacityHours) * 100)
            : 0;
        const billablePercentage =
          staff.totalLoggedHours > 0
            ? Math.round((staff.billableHours / staff.totalLoggedHours) * 100)
            : 0;

        return {
          userId: staff.userId,
          email: staff.userEmail,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
          departmentId: staff.departmentId,
          departmentName: staff.departmentName,
          weeklyHours: staff.weeklyHours || 37.5,
          totalLoggedHours: Number(staff.totalLoggedHours),
          billableHours: Number(staff.billableHours),
          nonBillableHours: Number(staff.nonBillableHours),
          capacityHours,
          utilization,
          billablePercentage,
          status:
            utilization > 100
              ? ("overallocated" as const)
              : utilization < 60
                ? ("underutilized" as const)
                : ("optimal" as const),
        };
      });

      return {
        staff: staffUtilization,
        summary: {
          totalStaff: staffUtilization.length,
          averageUtilization:
            staffUtilization.length > 0
              ? Math.round(
                  staffUtilization.reduce((sum, s) => sum + s.utilization, 0) /
                    staffUtilization.length,
                )
              : 0,
          overallocated: staffUtilization.filter(
            (s) => s.status === "overallocated",
          ).length,
          underutilized: staffUtilization.filter(
            (s) => s.status === "underutilized",
          ).length,
        },
      };
    }),

  /**
   * Get department-level utilization aggregations
   */
  getDepartmentUtilization: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Calculate weeks in the date range
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const weeksInRange = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      const departmentStats = await db
        .select({
          departmentId: departments.id,
          departmentName: departments.name,
          staffCount: sql<number>`COUNT(DISTINCT ${users.id})`,
          totalCapacityHours: sql<number>`SUM(${staffCapacity.weeklyHours}) * ${weeksInRange}`,
          totalLoggedHours: sql<number>`COALESCE(SUM(CAST(${timeEntries.hours} AS DECIMAL)), 0)`,
        })
        .from(departments)
        .innerJoin(users, eq(users.departmentId, departments.id))
        .leftJoin(
          staffCapacity,
          and(
            eq(staffCapacity.userId, users.id),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .leftJoin(
          timeEntries,
          and(
            eq(timeEntries.userId, users.id),
            eq(timeEntries.tenantId, tenantId),
            gte(timeEntries.date, input.startDate),
            lte(timeEntries.date, input.endDate),
          ),
        )
        .where(eq(departments.tenantId, tenantId))
        .groupBy(departments.id, departments.name);

      const departmentUtilization = departmentStats.map((dept) => {
        const capacityHours = Number(dept.totalCapacityHours) || 0;
        const loggedHours = Number(dept.totalLoggedHours);
        const utilization =
          capacityHours > 0
            ? Math.round((loggedHours / capacityHours) * 100)
            : 0;

        return {
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          staffCount: Number(dept.staffCount),
          capacityHours,
          loggedHours,
          utilization,
        };
      });

      return { departments: departmentUtilization };
    }),

  /**
   * Get 12-week utilization trend for a specific staff member
   */
  getStaffUtilizationTrend: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        weeks: z.number().min(1).max(52).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Get staff capacity
      const [capacity] = await db
        .select()
        .from(staffCapacity)
        .where(
          and(
            eq(staffCapacity.userId, input.userId),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!capacity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Staff capacity not found",
        });
      }

      const weeklyHours = capacity.weeklyHours;

      // Generate weekly data for the past N weeks
      const weeks: Array<{
        weekStartDate: string;
        weekEndDate: string;
        loggedHours: number;
        utilization: number;
      }> = [];

      const today = new Date();
      for (let i = input.weeks - 1; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Get hours for this week
        const result = await db
          .select({
            totalHours: sql<number>`COALESCE(SUM(CAST(${timeEntries.hours} AS DECIMAL)), 0)`,
          })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.userId, input.userId),
              eq(timeEntries.tenantId, tenantId),
              gte(timeEntries.date, weekStart.toISOString().split("T")[0]),
              lte(timeEntries.date, weekEnd.toISOString().split("T")[0]),
            ),
          );

        const loggedHours = Number(result[0]?.totalHours || 0);
        const utilization =
          weeklyHours > 0 ? Math.round((loggedHours / weeklyHours) * 100) : 0;

        weeks.push({
          weekStartDate: weekStart.toISOString().split("T")[0],
          weekEndDate: weekEnd.toISOString().split("T")[0],
          loggedHours,
          utilization,
        });
      }

      return {
        userId: input.userId,
        weeklyCapacity: weeklyHours,
        weeks,
      };
    }),

  /**
   * Get staff comparison table data (sortable)
   */
  getStaffComparison: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        departmentId: z.string().optional(),
        status: z
          .enum(["all", "overallocated", "underutilized", "optimal"])
          .optional(),
        sortBy: z
          .enum(["name", "role", "department", "hours", "utilization"])
          .optional()
          .default("name"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Build user filter conditions
      const userConditions = [eq(users.tenantId, tenantId)];
      if (input.departmentId) {
        userConditions.push(eq(users.departmentId, input.departmentId));
      }

      // Calculate weeks in the date range
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      const weeksInRange = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
      );

      // Get staff with utilization data
      const staffData = await db
        .select({
          userId: users.id,
          userEmail: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          departmentId: users.departmentId,
          departmentName: departments.name,
          weeklyHours: staffCapacity.weeklyHours,
          totalLoggedHours: sql<number>`COALESCE(SUM(CAST(${timeEntries.hours} AS DECIMAL)), 0)`,
          billableHours: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.billable} THEN CAST(${timeEntries.hours} AS DECIMAL) ELSE 0 END), 0)`,
          nonBillableHours: sql<number>`COALESCE(SUM(CASE WHEN NOT ${timeEntries.billable} THEN CAST(${timeEntries.hours} AS DECIMAL) ELSE 0 END), 0)`,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(
          staffCapacity,
          and(
            eq(staffCapacity.userId, users.id),
            eq(staffCapacity.tenantId, tenantId),
          ),
        )
        .leftJoin(
          timeEntries,
          and(
            eq(timeEntries.userId, users.id),
            eq(timeEntries.tenantId, tenantId),
            gte(timeEntries.date, input.startDate),
            lte(timeEntries.date, input.endDate),
          ),
        )
        .where(and(...userConditions))
        .groupBy(
          users.id,
          users.email,
          users.firstName,
          users.lastName,
          users.role,
          users.departmentId,
          departments.name,
          staffCapacity.weeklyHours,
        );

      // Calculate utilization and prepare for filtering/sorting
      const staffUtilization = staffData.map((staff) => {
        const capacityHours = (staff.weeklyHours || 37.5) * weeksInRange;
        const utilization =
          capacityHours > 0
            ? Math.round((staff.totalLoggedHours / capacityHours) * 100)
            : 0;
        const billablePercentage =
          staff.totalLoggedHours > 0
            ? Math.round((staff.billableHours / staff.totalLoggedHours) * 100)
            : 0;

        return {
          userId: staff.userId,
          email: staff.userEmail,
          firstName: staff.firstName,
          lastName: staff.lastName,
          role: staff.role,
          departmentId: staff.departmentId,
          departmentName: staff.departmentName,
          weeklyHours: staff.weeklyHours || 37.5,
          totalLoggedHours: Number(staff.totalLoggedHours),
          billableHours: Number(staff.billableHours),
          nonBillableHours: Number(staff.nonBillableHours),
          capacityHours,
          utilization,
          billablePercentage,
          status:
            utilization > 100
              ? ("overallocated" as const)
              : utilization < 60
                ? ("underutilized" as const)
                : ("optimal" as const),
        };
      });

      // Filter by status
      let filteredStaff = staffUtilization;
      if (input.status && input.status !== "all") {
        filteredStaff = filteredStaff.filter((s) => s.status === input.status);
      }

      // Sort
      const sorted = [...filteredStaff].sort((a, b) => {
        let compareValue = 0;

        switch (input.sortBy) {
          case "name":
            compareValue = `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`,
            );
            break;
          case "role":
            compareValue = (a.role || "").localeCompare(b.role || "");
            break;
          case "department":
            compareValue = (a.departmentName || "").localeCompare(
              b.departmentName || "",
            );
            break;
          case "hours":
            compareValue = a.totalLoggedHours - b.totalLoggedHours;
            break;
          case "utilization":
            compareValue = a.utilization - b.utilization;
            break;
        }

        return input.sortOrder === "desc" ? -compareValue : compareValue;
      });

      return {
        staff: sorted,
        total: sorted.length,
      };
    }),
});
