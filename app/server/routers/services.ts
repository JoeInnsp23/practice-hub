import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, services } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertServiceSchema = createInsertSchema(services);

// Schema for create/update operations (omit auto-generated fields)
const serviceSchema = insertServiceSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const servicesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;
      const { search, category, isActive } = input;

      // Build conditions
      const conditions = [eq(services.tenantId, tenantId)];

      if (search) {
        const searchCondition = or(
          ilike(services.name, `%${search}%`),
          ilike(services.code, `%${search}%`),
          ilike(services.description, `%${search}%`),
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      if (category && category !== "all") {
        conditions.push(eq(services.category, category));
      }

      if (isActive !== undefined) {
        conditions.push(eq(services.isActive, isActive));
      }

      const servicesList = await db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(desc(services.createdAt));

      return { services: servicesList };
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const service = await db
        .select()
        .from(services)
        .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!service[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      return service[0];
    }),

  create: protectedProcedure
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Create the service
      const [newService] = await db
        .insert(services)
        .values({
          tenantId,
          code: input.code,
          name: input.name,
          category: input.category,
          description: input.description,
          priceType: input.priceType,
          price: input.price,
          defaultRate: input.defaultRate,
          duration: input.duration,
          tags: input.tags,
          isActive: input.isActive ?? true,
          metadata: input.metadata,
        })
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service",
        entityId: newService.id,
        action: "created",
        description: `Created service "${input.name}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: {
          name: input.name,
          category: input.category,
          priceType: input.priceType,
        },
      });

      return { success: true, service: newService };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: serviceSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check service exists and belongs to tenant
      const existingService = await db
        .select()
        .from(services)
        .where(and(eq(services.id, input.id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!existingService[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Update service
      const [updatedService] = await db
        .update(services)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service",
        entityId: input.id,
        action: "updated",
        description: `Updated service "${updatedService.name}"`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingService[0],
        newValues: input.data,
      });

      return { success: true, service: updatedService };
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check service exists and belongs to tenant
      const existingService = await db
        .select()
        .from(services)
        .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!existingService[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service not found",
        });
      }

      // Soft delete by marking as inactive
      const [_updatedService] = await db
        .update(services)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(services.id, id))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service",
        entityId: id,
        action: "deactivated",
        description: `Deactivated service "${existingService[0].name}"`,
        userId,
        userName: `${firstName} ${lastName}`,
      });

      return { success: true };
    }),
});
