import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, tenants, userSettings } from "@/lib/db/schema";
import {
  companySettingsSchema,
  userSettingsSchema,
} from "@/lib/schemas/settings-schemas";
import { adminProcedure, protectedProcedure, router } from "../trpc";

// Generate schema from Drizzle table definition
const insertTenantSchema = createInsertSchema(tenants);

// Schema for tenant settings (omit auto-generated fields)
const tenantSettingsSchema = insertTenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const settingsRouter = router({
  getTenant: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tenant not found",
      });
    }

    return tenant[0];
  }),

  updateTenant: adminProcedure
    .input(
      z
        .object({
          name: z.string().optional(),
          slug: z.string().optional(),
          metadata: companySettingsSchema.optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing tenant
      const existingTenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      if (!existingTenant[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found",
        });
      }

      // Build update object
      const updateData: {
        name?: string;
        slug?: string;
        metadata?: unknown;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (input?.name) updateData.name = input.name;
      if (input?.slug) updateData.slug = input.slug;
      if (input?.metadata) {
        // Merge with existing metadata
        const existingMetadata =
          (existingTenant[0].metadata as Record<string, unknown>) || {};
        updateData.metadata = { ...existingMetadata, ...input.metadata };
      }

      // Update tenant
      const [updatedTenant] = await db
        .update(tenants)
        .set(updateData)
        .where(eq(tenants.id, tenantId))
        .returning();

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "tenant",
        entityId: tenantId,
        action: "updated",
        description: `Updated organization settings`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existingTenant[0],
        newValues: input,
      });

      return { success: true, tenant: updatedTenant };
    }),

  getNotificationSettings: protectedProcedure.query(async () => {
    // For now, return default settings
    // In production, these would be stored in a user_settings table
    return {
      emailNotifications: {
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        invoiceCreated: true,
        invoicePaid: true,
        clientAdded: true,
        reportGenerated: true,
      },
      inAppNotifications: {
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        invoiceCreated: true,
        invoicePaid: true,
        clientAdded: true,
        reportGenerated: true,
      },
      digestEmail: {
        enabled: true,
        frequency: "weekly", // daily, weekly, monthly
      },
    };
  }),

  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        emailNotifications: z
          .object({
            taskAssigned: z.boolean().optional(),
            taskCompleted: z.boolean().optional(),
            taskOverdue: z.boolean().optional(),
            invoiceCreated: z.boolean().optional(),
            invoicePaid: z.boolean().optional(),
            clientAdded: z.boolean().optional(),
            reportGenerated: z.boolean().optional(),
          })
          .optional(),
        inAppNotifications: z
          .object({
            taskAssigned: z.boolean().optional(),
            taskCompleted: z.boolean().optional(),
            taskOverdue: z.boolean().optional(),
            invoiceCreated: z.boolean().optional(),
            invoicePaid: z.boolean().optional(),
            clientAdded: z.boolean().optional(),
            reportGenerated: z.boolean().optional(),
          })
          .optional(),
        digestEmail: z
          .object({
            enabled: z.boolean().optional(),
            frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // In production, update user_settings table
      // For now, just log and return success

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "settings",
        entityId: userId,
        action: "updated",
        description: `Updated notification settings`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: input,
      });

      return { success: true };
    }),

  // Get user settings
  getUserSettings: protectedProcedure.query(async ({ ctx }) => {
    const userSetting = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, ctx.authContext.userId))
      .limit(1);

    // Return defaults if no settings exist
    if (userSetting.length === 0) {
      return {
        emailNotifications: true,
        inAppNotifications: true,
        digestEmail: "daily" as const,
        theme: "system" as const,
        language: "en" as const,
        timezone: "Europe/London",
      };
    }

    return {
      emailNotifications: userSetting[0].emailNotifications ?? true,
      inAppNotifications: userSetting[0].inAppNotifications ?? true,
      digestEmail: (userSetting[0].digestEmail ?? "daily") as
        | "daily"
        | "weekly"
        | "never",
      theme: (userSetting[0].theme ?? "system") as "light" | "dark" | "system",
      language: (userSetting[0].language ?? "en") as "en" | "es" | "fr" | "de",
      timezone: userSetting[0].timezone ?? "Europe/London",
    };
  }),

  // Update user settings
  updateUserSettings: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Upsert user settings
      await db
        .insert(userSettings)
        .values({
          id: crypto.randomUUID(),
          userId,
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            ...input,
            updatedAt: new Date(),
          },
        });

      // Log the activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "settings",
        entityId: userId,
        action: "updated",
        description: `Updated user settings`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: input,
      });

      return { success: true };
    }),
});
