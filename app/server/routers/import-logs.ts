/**
 * Import Logs tRPC Router
 *
 * Endpoints for managing and viewing CSV import history
 */

import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { importLogs } from "@/lib/db/schema";

export const importLogsRouter = router({
  /**
   * List all import logs for the current tenant
   * Supports filtering by entity type and status
   */
  list: protectedProcedure
    .input(
      z
        .object({
          entityType: z.enum(["clients", "tasks", "services"]).optional(),
          status: z.enum(["pending", "processing", "completed", "failed", "partial"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(importLogs.tenantId, ctx.authContext.tenantId)];

      if (input?.entityType) {
        conditions.push(eq(importLogs.entityType, input.entityType));
      }

      if (input?.status) {
        conditions.push(eq(importLogs.status, input.status));
      }

      const logs = await db
        .select()
        .from(importLogs)
        .where(and(...conditions))
        .orderBy(desc(importLogs.startedAt));

      return logs;
    }),

  /**
   * Get a single import log by ID
   */
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const [log] = await db
      .select()
      .from(importLogs)
      .where(and(eq(importLogs.id, input.id), eq(importLogs.tenantId, ctx.authContext.tenantId)))
      .limit(1);

    if (!log) {
      throw new Error("Import log not found");
    }

    return log;
  }),

  /**
   * Get summary statistics for all imports
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const logs = await db
      .select()
      .from(importLogs)
      .where(eq(importLogs.tenantId, ctx.authContext.tenantId));

    const summary = {
      totalImports: logs.length,
      successfulImports: logs.filter((log) => log.status === "completed").length,
      failedImports: logs.filter((log) => log.status === "failed").length,
      partialImports: logs.filter((log) => log.status === "partial").length,
      totalRowsProcessed: logs.reduce((sum, log) => sum + (log.processedRows || 0), 0),
      totalRowsFailed: logs.reduce((sum, log) => sum + (log.failedRows || 0), 0),
      byEntityType: {
        clients: logs.filter((log) => log.entityType === "clients").length,
        tasks: logs.filter((log) => log.entityType === "tasks").length,
        services: logs.filter((log) => log.entityType === "services").length,
      },
    };

    return summary;
  }),
});
