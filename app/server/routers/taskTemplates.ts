import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { taskTemplates, services } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";
import crypto from "node:crypto";

export const taskTemplatesRouter = router({
  // List all templates
  list: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().optional(),
        taskType: z.string().optional(),
        includeInactive: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(taskTemplates.tenantId, ctx.authContext.tenantId)];

      if (!input.includeInactive) {
        conditions.push(eq(taskTemplates.isActive, true));
      }

      if (input.serviceId) {
        conditions.push(eq(taskTemplates.serviceId, input.serviceId));
      }

      if (input.taskType) {
        conditions.push(eq(taskTemplates.taskType, input.taskType));
      }

      const templates = await db
        .select({
          id: taskTemplates.id,
          tenantId: taskTemplates.tenantId,
          serviceId: taskTemplates.serviceId,
          serviceName: services.name,
          serviceCode: services.code,
          namePattern: taskTemplates.namePattern,
          descriptionPattern: taskTemplates.descriptionPattern,
          estimatedHours: taskTemplates.estimatedHours,
          priority: taskTemplates.priority,
          taskType: taskTemplates.taskType,
          dueDateOffsetDays: taskTemplates.dueDateOffsetDays,
          dueDateOffsetMonths: taskTemplates.dueDateOffsetMonths,
          isRecurring: taskTemplates.isRecurring,
          isActive: taskTemplates.isActive,
          createdAt: taskTemplates.createdAt,
          updatedAt: taskTemplates.updatedAt,
        })
        .from(taskTemplates)
        .leftJoin(services, eq(taskTemplates.serviceId, services.id))
        .where(and(...conditions))
        .orderBy(desc(taskTemplates.createdAt));

      return templates;
    }),

  // Get single template by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const [template] = await db
        .select({
          id: taskTemplates.id,
          tenantId: taskTemplates.tenantId,
          serviceId: taskTemplates.serviceId,
          serviceName: services.name,
          serviceCode: services.code,
          namePattern: taskTemplates.namePattern,
          descriptionPattern: taskTemplates.descriptionPattern,
          estimatedHours: taskTemplates.estimatedHours,
          priority: taskTemplates.priority,
          taskType: taskTemplates.taskType,
          dueDateOffsetDays: taskTemplates.dueDateOffsetDays,
          dueDateOffsetMonths: taskTemplates.dueDateOffsetMonths,
          isRecurring: taskTemplates.isRecurring,
          isActive: taskTemplates.isActive,
          createdAt: taskTemplates.createdAt,
          updatedAt: taskTemplates.updatedAt,
        })
        .from(taskTemplates)
        .leftJoin(services, eq(taskTemplates.serviceId, services.id))
        .where(
          and(
            eq(taskTemplates.id, id),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  // Create template
  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().uuid(),
        namePattern: z.string().min(1),
        descriptionPattern: z.string().optional(),
        estimatedHours: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent", "critical"]),
        taskType: z.string().optional(),
        dueDateOffsetDays: z.number().default(0),
        dueDateOffsetMonths: z.number().default(0),
        isRecurring: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const templateId = crypto.randomUUID();

      await db.insert(taskTemplates).values({
        id: templateId,
        tenantId: ctx.authContext.tenantId,
        serviceId: input.serviceId,
        namePattern: input.namePattern,
        descriptionPattern: input.descriptionPattern,
        estimatedHours: input.estimatedHours,
        priority: input.priority,
        taskType: input.taskType,
        dueDateOffsetDays: input.dueDateOffsetDays,
        dueDateOffsetMonths: input.dueDateOffsetMonths,
        isRecurring: input.isRecurring,
        isActive: true,
      });

      return { success: true, templateId };
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        serviceId: z.string().uuid(),
        namePattern: z.string().min(1),
        descriptionPattern: z.string().optional(),
        estimatedHours: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent", "critical"]),
        taskType: z.string().optional(),
        dueDateOffsetDays: z.number().default(0),
        dueDateOffsetMonths: z.number().default(0),
        isRecurring: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db
        .update(taskTemplates)
        .set({
          serviceId: input.serviceId,
          namePattern: input.namePattern,
          descriptionPattern: input.descriptionPattern,
          estimatedHours: input.estimatedHours,
          priority: input.priority,
          taskType: input.taskType,
          dueDateOffsetDays: input.dueDateOffsetDays,
          dueDateOffsetMonths: input.dueDateOffsetMonths,
          isRecurring: input.isRecurring,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId),
          ),
        );

      return { success: true };
    }),

  // Delete (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(taskTemplates)
        .set({ isActive: false })
        .where(
          and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId),
          ),
        );

      return { success: true };
    }),

  // Clone template
  clone: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, input.templateId),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId),
          ),
        )
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newTemplateId = crypto.randomUUID();

      await db.insert(taskTemplates).values({
        id: newTemplateId,
        tenantId: template.tenantId,
        serviceId: template.serviceId,
        namePattern: `${template.namePattern} (Copy)`,
        descriptionPattern: template.descriptionPattern,
        estimatedHours: template.estimatedHours,
        priority: template.priority,
        taskType: template.taskType,
        dueDateOffsetDays: template.dueDateOffsetDays,
        dueDateOffsetMonths: template.dueDateOffsetMonths,
        isRecurring: template.isRecurring,
        isActive: true,
      });

      return { success: true, newTemplateId };
    }),
});
