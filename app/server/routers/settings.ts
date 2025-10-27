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
const _tenantSettingsSchema = insertTenantSchema.omit({
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
        // Global toggles
        emailNotifications: z.boolean().optional(),
        inAppNotifications: z.boolean().optional(),
        digestEmail: z.string().optional(),

        // Granular notification preferences (FR31)
        notifTaskAssigned: z.boolean().optional(),
        notifTaskMention: z.boolean().optional(),
        notifTaskReassigned: z.boolean().optional(),
        notifDeadlineApproaching: z.boolean().optional(),
        notifApprovalNeeded: z.boolean().optional(),
        notifClientMessage: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check if user settings exist
      const existingSettings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      const updateData: {
        emailNotifications?: boolean;
        inAppNotifications?: boolean;
        digestEmail?: string;
        notifTaskAssigned?: boolean;
        notifTaskMention?: boolean;
        notifTaskReassigned?: boolean;
        notifDeadlineApproaching?: boolean;
        notifApprovalNeeded?: boolean;
        notifClientMessage?: boolean;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      // Add provided fields to update
      if (input.emailNotifications !== undefined)
        updateData.emailNotifications = input.emailNotifications;
      if (input.inAppNotifications !== undefined)
        updateData.inAppNotifications = input.inAppNotifications;
      if (input.digestEmail !== undefined)
        updateData.digestEmail = input.digestEmail;
      if (input.notifTaskAssigned !== undefined)
        updateData.notifTaskAssigned = input.notifTaskAssigned;
      if (input.notifTaskMention !== undefined)
        updateData.notifTaskMention = input.notifTaskMention;
      if (input.notifTaskReassigned !== undefined)
        updateData.notifTaskReassigned = input.notifTaskReassigned;
      if (input.notifDeadlineApproaching !== undefined)
        updateData.notifDeadlineApproaching = input.notifDeadlineApproaching;
      if (input.notifApprovalNeeded !== undefined)
        updateData.notifApprovalNeeded = input.notifApprovalNeeded;
      if (input.notifClientMessage !== undefined)
        updateData.notifClientMessage = input.notifClientMessage;

      // Update or insert user settings
      if (existingSettings.length === 0) {
        // Create new settings with defaults
        await db.insert(userSettings).values({
          id: crypto.randomUUID(),
          userId,
          emailNotifications: input.emailNotifications ?? true,
          inAppNotifications: input.inAppNotifications ?? true,
          digestEmail: input.digestEmail ?? "daily",
          notifTaskAssigned: input.notifTaskAssigned ?? true,
          notifTaskMention: input.notifTaskMention ?? true,
          notifTaskReassigned: input.notifTaskReassigned ?? true,
          notifDeadlineApproaching: input.notifDeadlineApproaching ?? true,
          notifApprovalNeeded: input.notifApprovalNeeded ?? true,
          notifClientMessage: input.notifClientMessage ?? true,
          theme: "system",
          language: "en",
          timezone: "Europe/London",
        });
      } else {
        // Update existing settings
        await db
          .update(userSettings)
          .set(updateData)
          .where(eq(userSettings.userId, userId));
      }

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
        notifTaskAssigned: true,
        notifTaskMention: true,
        notifTaskReassigned: true,
        notifDeadlineApproaching: true,
        notifApprovalNeeded: true,
        notifClientMessage: true,
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
      notifTaskAssigned: userSetting[0].notifTaskAssigned ?? true,
      notifTaskMention: userSetting[0].notifTaskMention ?? true,
      notifTaskReassigned: userSetting[0].notifTaskReassigned ?? true,
      notifDeadlineApproaching: userSetting[0].notifDeadlineApproaching ?? true,
      notifApprovalNeeded: userSetting[0].notifApprovalNeeded ?? true,
      notifClientMessage: userSetting[0].notifClientMessage ?? true,
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
