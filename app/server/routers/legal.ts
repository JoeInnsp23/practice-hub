import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, legalPages } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

// Legal page type enum
const legalPageTypeSchema = z.enum(["privacy", "terms", "cookie_policy"]);

// Input schema for updating legal pages
const updateLegalPageSchema = z.object({
  pageType: legalPageTypeSchema,
  content: z.string().min(1, "Content is required"),
});

export const legalRouter = router({
  /**
   * Get legal page by type for current tenant
   * Available to all authenticated users
   */
  getByType: protectedProcedure
    .input(z.object({ pageType: legalPageTypeSchema }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Find legal page for tenant and type
      const [legalPage] = await db
        .select()
        .from(legalPages)
        .where(
          and(
            eq(legalPages.tenantId, tenantId),
            eq(legalPages.pageType, input.pageType),
          ),
        )
        .limit(1);

      if (!legalPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Legal page not found for type: ${input.pageType}`,
        });
      }

      return legalPage;
    }),

  /**
   * Update legal page content (admin only)
   * Creates new version and logs activity
   */
  update: adminProcedure
    .input(updateLegalPageSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing legal page
      const [existingPage] = await db
        .select()
        .from(legalPages)
        .where(
          and(
            eq(legalPages.tenantId, tenantId),
            eq(legalPages.pageType, input.pageType),
          ),
        )
        .limit(1);

      if (!existingPage) {
        // Create new legal page if it doesn't exist
        const [newPage] = await db
          .insert(legalPages)
          .values({
            id: crypto.randomUUID(),
            tenantId,
            pageType: input.pageType,
            content: input.content,
            version: 1,
            updatedBy: userId,
          })
          .returning();

        // Log creation activity
        await db.insert(activityLogs).values({
          tenantId,
          entityType: "legal_page",
          entityId: newPage.id,
          action: "created",
          description: `Created ${input.pageType} legal page`,
          userId,
          userName: `${firstName || ""} ${lastName || ""}`.trim(),
          newValues: { pageType: input.pageType, version: 1 },
        });

        return newPage;
      }

      // Update existing legal page (increment version)
      const [updatedPage] = await db
        .update(legalPages)
        .set({
          content: input.content,
          version: existingPage.version + 1,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(
          and(
            eq(legalPages.tenantId, tenantId),
            eq(legalPages.pageType, input.pageType),
          ),
        )
        .returning();

      // Log update activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "legal_page",
        entityId: updatedPage.id,
        action: "updated",
        description: `Updated ${input.pageType} legal page to version ${updatedPage.version}`,
        userId,
        userName: `${firstName || ""} ${lastName || ""}`.trim(),
        oldValues: {
          content: existingPage.content,
          version: existingPage.version,
        },
        newValues: {
          content: input.content,
          version: updatedPage.version,
        },
      });

      return updatedPage;
    }),

  /**
   * Get version history for a legal page (admin only)
   * Returns all versions ordered by updatedAt descending
   * Note: This is a simplified version - for production, consider a separate version history table
   */
  getVersionHistory: adminProcedure
    .input(z.object({ pageType: legalPageTypeSchema }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      // Get activity logs for this legal page type
      const history = await db
        .select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.tenantId, tenantId),
            eq(activityLogs.entityType, "legal_page"),
          ),
        )
        .orderBy(desc(activityLogs.createdAt));

      // Filter by page type and format for display
      const filteredHistory = history.filter((log) =>
        log.description?.includes(input.pageType),
      );

      return filteredHistory.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        version:
          typeof log.newValues === "object" && log.newValues !== null
            ? (log.newValues as { version?: number }).version
            : undefined,
        updatedAt: log.createdAt,
        updatedBy: log.userName,
        userId: log.userId,
      }));
    }),

  /**
   * Get all legal pages for current tenant
   * Returns all three legal page types
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const pages = await db
      .select()
      .from(legalPages)
      .where(eq(legalPages.tenantId, tenantId));

    return pages;
  }),
});
