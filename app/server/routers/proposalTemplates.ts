import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, proposalTemplates } from "@/lib/db/schema";
import { adminProcedure, protectedProcedure, router } from "../trpc";

// Validation schema
const defaultServiceSchema = z.object({
  componentCode: z.string(),
  config: z.record(z.string(), z.any()).optional(),
});

const insertTemplateSchema = createInsertSchema(proposalTemplates).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
  createdByName: true,
});

const templateSchema = insertTemplateSchema.extend({
  defaultServices: z.array(defaultServiceSchema),
});

export const proposalTemplatesRouter = router({
  // List all templates (staff only)
  list: protectedProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          isActive: z.boolean().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const conditions = [eq(proposalTemplates.tenantId, tenantId)];

      if (input?.category) {
        conditions.push(eq(proposalTemplates.category, input.category));
      }

      if (input?.isActive !== undefined) {
        conditions.push(eq(proposalTemplates.isActive, input.isActive));
      }

      const templates = await db
        .select()
        .from(proposalTemplates)
        .where(and(...conditions))
        .orderBy(
          desc(proposalTemplates.isDefault),
          desc(proposalTemplates.createdAt),
        );

      // Filter by search if provided
      let filteredTemplates = templates;
      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        filteredTemplates = templates.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower),
        );
      }

      return { templates: filteredTemplates };
    }),

  // Get template by ID
  getById: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [template] = await db
        .select()
        .from(proposalTemplates)
        .where(
          and(
            eq(proposalTemplates.id, id),
            eq(proposalTemplates.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return { template };
    }),

  // Create template (admin only)
  create: adminProcedure
    .input(templateSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      try {
        const result = await db.transaction(async (tx) => {
          // If setting as default, unset other defaults
          if (input.isDefault) {
            await tx
              .update(proposalTemplates)
              .set({ isDefault: false })
              .where(
                and(
                  eq(proposalTemplates.tenantId, tenantId),
                  eq(proposalTemplates.isDefault, true),
                ),
              );
          }

          // Create template
          const [template] = await tx
            .insert(proposalTemplates)
            .values({
              tenantId,
              name: input.name,
              description: input.description,
              category: input.category,
              defaultServices: input.defaultServices,
              termsAndConditions: input.termsAndConditions,
              notes: input.notes,
              isDefault: input.isDefault ?? false,
              isActive: input.isActive ?? true,
              createdById: userId,
              createdByName: `${firstName} ${lastName}`.trim(),
            })
            .returning();

          // Log activity
          await tx.insert(activityLogs).values({
            tenantId,
            module: "proposal-hub",
            entityType: "proposal_template",
            entityId: template.id,
            action: "created",
            description: `Created proposal template "${input.name}"`,
            userId,
            userName: `${firstName} ${lastName}`.trim(),
            newValues: { name: input.name, category: input.category },
          });

          return template;
        });

        return { success: true, template: result };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "create_proposal_template" },
          extra: { templateName: input.name },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  // Update template (admin only)
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: templateSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      try {
        const result = await db.transaction(async (tx) => {
          // Check template exists
          const [existing] = await tx
            .select()
            .from(proposalTemplates)
            .where(
              and(
                eq(proposalTemplates.id, input.id),
                eq(proposalTemplates.tenantId, tenantId),
              ),
            )
            .limit(1);

          if (!existing) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Template not found",
            });
          }

          // If setting as default, unset other defaults
          if (input.data.isDefault) {
            await tx
              .update(proposalTemplates)
              .set({ isDefault: false })
              .where(
                and(
                  eq(proposalTemplates.tenantId, tenantId),
                  eq(proposalTemplates.isDefault, true),
                ),
              );
          }

          // Update template
          const [updated] = await tx
            .update(proposalTemplates)
            .set({
              ...input.data,
              updatedAt: new Date(),
            })
            .where(eq(proposalTemplates.id, input.id))
            .returning();

          // Log activity
          await tx.insert(activityLogs).values({
            tenantId,
            module: "proposal-hub",
            entityType: "proposal_template",
            entityId: input.id,
            action: "updated",
            description: `Updated proposal template "${updated.name}"`,
            userId,
            userName: `${firstName} ${lastName}`.trim(),
            oldValues: existing,
            newValues: input.data,
          });

          return updated;
        });

        return { success: true, template: result };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "update_proposal_template" },
          extra: { templateId: input.id },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update template",
        });
      }
    }),

  // Delete template (admin only)
  delete: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      try {
        // Check template exists
        const [existing] = await db
          .select()
          .from(proposalTemplates)
          .where(
            and(
              eq(proposalTemplates.id, id),
              eq(proposalTemplates.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Delete template
        await db.delete(proposalTemplates).where(eq(proposalTemplates.id, id));

        // Log activity
        await db.insert(activityLogs).values({
          tenantId,
          module: "proposal-hub",
          entityType: "proposal_template",
          entityId: id,
          action: "deleted",
          description: `Deleted proposal template "${existing.name}"`,
          userId,
          userName: `${firstName} ${lastName}`.trim(),
        });

        return { success: true };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "delete_proposal_template" },
          extra: { templateId: id },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete template",
        });
      }
    }),

  // Set default template (admin only)
  setDefault: adminProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      try {
        await db.transaction(async (tx) => {
          // Unset all defaults
          await tx
            .update(proposalTemplates)
            .set({ isDefault: false })
            .where(
              and(
                eq(proposalTemplates.tenantId, tenantId),
                eq(proposalTemplates.isDefault, true),
              ),
            );

          // Set new default
          const [updated] = await tx
            .update(proposalTemplates)
            .set({ isDefault: true })
            .where(
              and(
                eq(proposalTemplates.id, id),
                eq(proposalTemplates.tenantId, tenantId),
              ),
            )
            .returning();

          if (!updated) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Template not found",
            });
          }

          // Log activity
          await tx.insert(activityLogs).values({
            tenantId,
            module: "proposal-hub",
            entityType: "proposal_template",
            entityId: id,
            action: "set_default",
            description: `Set "${updated.name}" as default template`,
            userId,
            userName: `${firstName} ${lastName}`.trim(),
          });
        });

        return { success: true };
      } catch (error) {
        Sentry.captureException(error, {
          tags: { operation: "set_default_template" },
          extra: { templateId: id },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to set default template",
        });
      }
    }),
});
