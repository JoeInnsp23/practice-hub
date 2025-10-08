import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { activityLogs, tenants } from "@/lib/db/schema";
import { adminProcedure, router } from "../trpc";

// Default multipliers and configuration
const DEFAULT_CONFIG = {
  complexityMultipliers: {
    modelA: {
      clean: 0.95,
      average: 1.0,
      complex: 1.15,
      disaster: 1.4,
    },
    modelB: {
      clean: 0.95,
      average: 1.0,
      complex: 1.1,
      disaster: 1.25,
    },
  },
  industryMultipliers: {
    simple: 0.95,
    standard: 1.0,
    complex: 1.15,
    regulated: 1.3,
  },
  discountRules: {
    volumeTier1: {
      threshold: 500,
      percentage: 5,
      description: "5% volume discount (over £500/month)",
    },
    volumeTier2: {
      threshold: 1000,
      percentage: 3,
      description: "Additional 3% discount (over £1000/month)",
    },
    rushFee: {
      percentage: 25,
      description: "25% rush fee (within 1 month of deadline)",
    },
    newClient: {
      percentage: 10,
      duration: 12,
      description: "10% first-year discount (new client)",
    },
    customDiscount: {
      maxPercentage: 25,
      requiresApproval: true,
      description: "Custom discount (requires approval)",
    },
  },
  globalSettings: {
    defaultTurnoverBand: "90k-149k",
    defaultIndustry: "standard",
    roundingRule: "nearest_1",
    currencySymbol: "£",
    taxRate: 0,
  },
};

// Validation schemas
const complexityMultiplierSchema = z.object({
  clean: z.number().min(0.5).max(2.0),
  average: z.number().min(0.5).max(2.0),
  complex: z.number().min(0.5).max(2.0),
  disaster: z.number().min(0.5).max(2.0),
});

const industryMultiplierSchema = z.object({
  simple: z.number().min(0.5).max(2.0),
  standard: z.number().min(0.5).max(2.0),
  complex: z.number().min(0.5).max(2.0),
  regulated: z.number().min(0.5).max(2.0),
});

const discountTierSchema = z.object({
  threshold: z.number().min(0),
  percentage: z.number().min(0).max(100),
  description: z.string(),
});

const discountRulesSchema = z.object({
  volumeTier1: discountTierSchema,
  volumeTier2: discountTierSchema,
  rushFee: z.object({
    percentage: z.number().min(0).max(100),
    description: z.string(),
  }),
  newClient: z.object({
    percentage: z.number().min(0).max(100),
    duration: z.number().min(1).max(36),
    description: z.string(),
  }),
  customDiscount: z.object({
    maxPercentage: z.number().min(0).max(100),
    requiresApproval: z.boolean(),
    description: z.string(),
  }),
});

const globalSettingsSchema = z.object({
  defaultTurnoverBand: z.string(),
  defaultIndustry: z.enum(["simple", "standard", "complex", "regulated"]),
  roundingRule: z.enum(["nearest_1", "nearest_5", "nearest_10", "none"]),
  currencySymbol: z.string(),
  taxRate: z.number().min(0).max(100),
});

export const pricingConfigRouter = router({
  // Get all pricing configuration
  getConfig: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const config = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;

    return {
      success: true,
      config,
      isDefault: !(tenant?.metadata as any)?.pricingConfig,
    };
  }),

  // Update complexity multipliers
  updateComplexityMultipliers: adminProcedure
    .input(
      z.object({
        model: z.enum(["modelA", "modelB"]),
        multipliers: complexityMultiplierSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const currentConfig = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;
      const oldMultipliers = currentConfig.complexityMultipliers[input.model];

      const updatedConfig = {
        ...currentConfig,
        complexityMultipliers: {
          ...currentConfig.complexityMultipliers,
          [input.model]: input.multipliers,
        },
      };

      await db
        .update(tenants)
        .set({
          metadata: {
            ...(tenant?.metadata || {}),
            pricingConfig: updatedConfig,
          },
        })
        .where(eq(tenants.id, tenantId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_config",
        entityId: tenantId,
        action: "updated",
        description: `Updated ${input.model} complexity multipliers`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: { [input.model]: oldMultipliers },
        newValues: { [input.model]: input.multipliers },
      });

      return { success: true, config: updatedConfig };
    }),

  // Update industry multipliers
  updateIndustryMultipliers: adminProcedure
    .input(industryMultiplierSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const currentConfig = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;
      const oldMultipliers = currentConfig.industryMultipliers;

      const updatedConfig = {
        ...currentConfig,
        industryMultipliers: input,
      };

      await db
        .update(tenants)
        .set({
          metadata: {
            ...(tenant?.metadata || {}),
            pricingConfig: updatedConfig,
          },
        })
        .where(eq(tenants.id, tenantId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_config",
        entityId: tenantId,
        action: "updated",
        description: "Updated industry multipliers",
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: oldMultipliers,
        newValues: input,
      });

      return { success: true, config: updatedConfig };
    }),

  // Update discount rules
  updateDiscountRules: adminProcedure
    .input(discountRulesSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const currentConfig = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;
      const oldRules = currentConfig.discountRules;

      const updatedConfig = {
        ...currentConfig,
        discountRules: input,
      };

      await db
        .update(tenants)
        .set({
          metadata: {
            ...(tenant?.metadata || {}),
            pricingConfig: updatedConfig,
          },
        })
        .where(eq(tenants.id, tenantId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_config",
        entityId: tenantId,
        action: "updated",
        description: "Updated discount rules",
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: oldRules,
        newValues: input,
      });

      return { success: true, config: updatedConfig };
    }),

  // Update global settings
  updateGlobalSettings: adminProcedure
    .input(globalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const currentConfig = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;
      const oldSettings = currentConfig.globalSettings;

      const updatedConfig = {
        ...currentConfig,
        globalSettings: input,
      };

      await db
        .update(tenants)
        .set({
          metadata: {
            ...(tenant?.metadata || {}),
            pricingConfig: updatedConfig,
          },
        })
        .where(eq(tenants.id, tenantId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_config",
        entityId: tenantId,
        action: "updated",
        description: "Updated global pricing settings",
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: oldSettings,
        newValues: input,
      });

      return { success: true, config: updatedConfig };
    }),

  // Reset to defaults
  resetToDefaults: adminProcedure.mutation(async ({ ctx }) => {
    const { tenantId, userId, firstName, lastName } = ctx.authContext;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const oldConfig = (tenant?.metadata as any)?.pricingConfig;

    await db
      .update(tenants)
      .set({
        metadata: {
          ...(tenant?.metadata || {}),
          pricingConfig: DEFAULT_CONFIG,
        },
      })
      .where(eq(tenants.id, tenantId));

    // Log activity
    await db.insert(activityLogs).values({
      tenantId,
      entityType: "pricing_config",
      entityId: tenantId,
      action: "updated",
      description: "Reset pricing configuration to defaults",
      userId,
      userName: `${firstName} ${lastName}`,
      oldValues: oldConfig,
      newValues: DEFAULT_CONFIG,
    });

    return { success: true, config: DEFAULT_CONFIG };
  }),

  // Export configuration
  exportConfig: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const config = (tenant?.metadata as any)?.pricingConfig || DEFAULT_CONFIG;

    return {
      success: true,
      config,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
  }),

  // Import configuration
  importConfig: adminProcedure
    .input(
      z.object({
        config: z.object({
          complexityMultipliers: z.object({
            modelA: complexityMultiplierSchema,
            modelB: complexityMultiplierSchema,
          }),
          industryMultipliers: industryMultiplierSchema,
          discountRules: discountRulesSchema,
          globalSettings: globalSettingsSchema,
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const oldConfig = (tenant?.metadata as any)?.pricingConfig;

      await db
        .update(tenants)
        .set({
          metadata: {
            ...(tenant?.metadata || {}),
            pricingConfig: input.config,
          },
        })
        .where(eq(tenants.id, tenantId));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_config",
        entityId: tenantId,
        action: "updated",
        description: "Imported pricing configuration",
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: oldConfig,
        newValues: input.config,
      });

      return { success: true, config: input.config };
    }),
});
