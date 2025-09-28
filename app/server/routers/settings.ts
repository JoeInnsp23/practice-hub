import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@/lib/db";
import { tenants, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const tenantSettingsSchema = z.object({
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  settings: z.object({
    invoicePrefix: z.string().optional(),
    defaultPaymentTerms: z.number().optional(),
    defaultTaxRate: z.number().optional(),
    timeTrackingEnabled: z.boolean().optional(),
    complianceEnabled: z.boolean().optional(),
    workflowsEnabled: z.boolean().optional(),
    portalEnabled: z.boolean().optional(),
    billingEmail: z.string().email().optional(),
    supportEmail: z.string().email().optional(),
    address: z.object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }).optional(),
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
        message: "Tenant not found"
      });
    }

    return tenant[0];
  }),

  updateTenant: adminProcedure
    .input(tenantSettingsSchema.partial())
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
          message: "Tenant not found"
        });
      }

      // Update tenant
      const [updatedTenant] = await db
        .update(tenants)
        .set({
          ...input,
          settings: input.settings ? {
            ...existingTenant[0].settings,
            ...input.settings,
          } : existingTenant[0].settings,
          updatedAt: new Date(),
        })
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

  getNotificationSettings: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId, userId } = ctx.authContext;

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
    .input(z.object({
      emailNotifications: z.object({
        taskAssigned: z.boolean().optional(),
        taskCompleted: z.boolean().optional(),
        taskOverdue: z.boolean().optional(),
        invoiceCreated: z.boolean().optional(),
        invoicePaid: z.boolean().optional(),
        clientAdded: z.boolean().optional(),
        reportGenerated: z.boolean().optional(),
      }).optional(),
      inAppNotifications: z.object({
        taskAssigned: z.boolean().optional(),
        taskCompleted: z.boolean().optional(),
        taskOverdue: z.boolean().optional(),
        invoiceCreated: z.boolean().optional(),
        invoicePaid: z.boolean().optional(),
        clientAdded: z.boolean().optional(),
        reportGenerated: z.boolean().optional(),
      }).optional(),
      digestEmail: z.object({
        enabled: z.boolean().optional(),
        frequency: z.enum(["daily", "weekly", "monthly"]).optional(),
      }).optional(),
    }))
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
});