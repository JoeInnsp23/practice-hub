import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  activityLogs,
  pricingRules,
  proposalServices,
  services,
} from "@/lib/db/schema";
import { adminProcedure, router } from "../trpc";

// Zod schemas
const serviceSchema = createInsertSchema(services).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

const pricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const pricingAdminRouter = router({
  // ============================================
  // SERVICE COMPONENTS MANAGEMENT
  // ============================================

  // Get all service components (including inactive)
  getAllComponents: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const components = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, tenantId))
      .orderBy(services.category, services.name);

    return { components };
  }),

  // Get single component by ID
  getComponent: adminProcedure
    .input(z.string())
    .query(async ({ ctx, input: id }) => {
      const { tenantId } = ctx.authContext;

      const [component] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!component) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service component not found",
        });
      }

      return { component };
    }),

  // Create new service component
  createComponent: adminProcedure
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Check for duplicate code
      const [existing] = await db
        .select()
        .from(services)
        .where(
          and(eq(services.code, input.code), eq(services.tenantId, tenantId)),
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Service component with code '${input.code}' already exists`,
        });
      }

      // Create component
      const [component] = await db
        .insert(services)
        .values({
          ...input,
          tenantId,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service_component",
        entityId: component.id,
        action: "created",
        description: `Created service component: ${component.name}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: input,
      });

      return { success: true, component };
    }),

  // Update service component
  updateComponent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: serviceSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing component
      const [existing] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, input.id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service component not found",
        });
      }

      // Check for duplicate code if code is being changed
      if (input.data.code && input.data.code !== existing.code) {
        const [duplicate] = await db
          .select()
          .from(services)
          .where(
            and(
              eq(services.code, input.data.code),
              eq(services.tenantId, tenantId),
            ),
          )
          .limit(1);

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Service component with code '${input.data.code}' already exists`,
          });
        }
      }

      // Update component
      const [component] = await db
        .update(services)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(services.id, input.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service_component",
        entityId: component.id,
        action: "updated",
        description: `Updated service component: ${component.name}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existing,
        newValues: input.data,
      });

      return { success: true, component };
    }),

  // Delete service component
  deleteComponent: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing component
      const [existing] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service component not found",
        });
      }

      // Check if component has active pricing rules
      const activeRules = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pricingRules)
        .where(
          and(
            eq(pricingRules.componentId, id),
            eq(pricingRules.isActive, true),
          ),
        );

      if (activeRules[0]?.count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete component with ${activeRules[0].count} active pricing rules. Deactivate rules first.`,
        });
      }

      // Check if component is used in recent proposals (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentProposals = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(proposalServices)
        .where(eq(proposalServices.componentCode, existing.code));

      if (recentProposals[0]?.count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot delete component used in ${recentProposals[0].count} proposals. Consider deactivating instead.`,
        });
      }

      // Delete component (CASCADE will delete pricing rules)
      await db.delete(services).where(eq(services.id, id));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service_component",
        entityId: id,
        action: "deleted",
        description: `Deleted service component: ${existing.name}`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existing,
      });

      return { success: true };
    }),

  // Clone service component
  cloneComponent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        newCode: z.string(),
        newName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing component
      const [existing] = await db
        .select()
        .from(services)
        .where(and(eq(services.id, input.id), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service component not found",
        });
      }

      // Check for duplicate code
      const [duplicate] = await db
        .select()
        .from(services)
        .where(
          and(
            eq(services.code, input.newCode),
            eq(services.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Service component with code '${input.newCode}' already exists`,
        });
      }

      // Create clone
      const [component] = await db
        .insert(services)
        .values({
          ...existing,
          id: undefined as unknown as string,
          code: input.newCode,
          name: input.newName,
          tenantId,
          createdAt: undefined as unknown as Date,
          updatedAt: undefined as unknown as Date,
        })
        .returning();

      // Clone pricing rules
      const existingRules = await db
        .select()
        .from(pricingRules)
        .where(eq(pricingRules.componentId, input.id));

      if (existingRules.length > 0) {
        await db.insert(pricingRules).values(
          existingRules.map((rule) => ({
            ...rule,
            id: undefined as unknown as string,
            componentId: component.id,
            tenantId,
            createdAt: undefined as unknown as Date,
            updatedAt: undefined as unknown as Date,
          })),
        );
      }

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service_component",
        entityId: component.id,
        action: "created",
        description: `Cloned service component from: ${existing.name}`,
        userId,
        userName: `${firstName} ${lastName}`,
        metadata: { clonedFrom: input.id },
        newValues: component,
      });

      return { success: true, component };
    }),

  // Bulk update components (activate/deactivate)
  bulkUpdateComponents: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Update all components
      await db
        .update(services)
        .set({
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(
          and(inArray(services.id, input.ids), eq(services.tenantId, tenantId)),
        );

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "service_component",
        entityId: input.ids[0],
        action: "updated",
        description: `Bulk ${input.isActive ? "activated" : "deactivated"} ${input.ids.length} service components`,
        userId,
        userName: `${firstName} ${lastName}`,
        metadata: { ids: input.ids, isActive: input.isActive },
      });

      return { success: true, count: input.ids.length };
    }),

  // ============================================
  // PRICING RULES MANAGEMENT
  // ============================================

  // Get all pricing rules (including inactive)
  getAllRules: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const rules = await db
      .select({
        rule: pricingRules,
        componentName: services.name,
        componentCode: services.code,
      })
      .from(pricingRules)
      .leftJoin(services, eq(pricingRules.componentId, services.id))
      .where(eq(pricingRules.tenantId, tenantId))
      .orderBy(services.name, pricingRules.ruleType);

    return { rules };
  }),

  // Get rules for specific component
  getRulesByComponent: adminProcedure
    .input(z.string())
    .query(async ({ ctx, input: componentId }) => {
      const { tenantId } = ctx.authContext;

      const rules = await db
        .select()
        .from(pricingRules)
        .where(
          and(
            eq(pricingRules.componentId, componentId),
            eq(pricingRules.tenantId, tenantId),
          ),
        )
        .orderBy(pricingRules.ruleType, pricingRules.minValue);

      return { rules };
    }),

  // Create pricing rule
  createRule: adminProcedure
    .input(pricingRuleSchema)
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Validate component exists
      const [component] = await db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, input.componentId),
            eq(services.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!component) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service component not found",
        });
      }

      // Validate min < max for band types
      if (
        input.minValue &&
        input.maxValue &&
        Number(input.minValue) >= Number(input.maxValue)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum value must be less than maximum value",
        });
      }

      // Check for overlapping rules
      if (input.minValue && input.maxValue) {
        const overlapping = await db
          .select()
          .from(pricingRules)
          .where(
            and(
              eq(pricingRules.componentId, input.componentId),
              eq(pricingRules.ruleType, input.ruleType),
              eq(pricingRules.isActive, true),
              sql`${pricingRules.minValue}::numeric < ${input.maxValue}`,
              sql`${pricingRules.maxValue}::numeric > ${input.minValue}`,
            ),
          );

        if (overlapping.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Rule overlaps with existing pricing rule",
          });
        }
      }

      // Create rule
      const [rule] = await db
        .insert(pricingRules)
        .values({
          ...input,
          tenantId,
        })
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_rule",
        entityId: rule.id,
        action: "created",
        description: `Created pricing rule for ${component.name}`,
        userId,
        userName: `${firstName} ${lastName}`,
        newValues: input,
      });

      return { success: true, rule };
    }),

  // Update pricing rule
  updateRule: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: pricingRuleSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing rule
      const [existing] = await db
        .select()
        .from(pricingRules)
        .where(
          and(
            eq(pricingRules.id, input.id),
            eq(pricingRules.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pricing rule not found",
        });
      }

      // Validate min < max if being updated
      const newMinValue = input.data.minValue ?? existing.minValue;
      const newMaxValue = input.data.maxValue ?? existing.maxValue;
      if (
        newMinValue &&
        newMaxValue &&
        Number(newMinValue) >= Number(newMaxValue)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum value must be less than maximum value",
        });
      }

      // Update rule
      const [rule] = await db
        .update(pricingRules)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(pricingRules.id, input.id))
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_rule",
        entityId: rule.id,
        action: "updated",
        description: `Updated pricing rule`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existing,
        newValues: input.data,
      });

      return { success: true, rule };
    }),

  // Delete pricing rule
  deleteRule: adminProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Get existing rule
      const [existing] = await db
        .select()
        .from(pricingRules)
        .where(
          and(eq(pricingRules.id, id), eq(pricingRules.tenantId, tenantId)),
        )
        .limit(1);

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pricing rule not found",
        });
      }

      // Delete rule
      await db.delete(pricingRules).where(eq(pricingRules.id, id));

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_rule",
        entityId: id,
        action: "deleted",
        description: `Deleted pricing rule`,
        userId,
        userName: `${firstName} ${lastName}`,
        oldValues: existing,
      });

      return { success: true };
    }),

  // Bulk create rules
  bulkCreateRules: adminProcedure
    .input(z.array(pricingRuleSchema))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, userId, firstName, lastName } = ctx.authContext;

      // Validate all components exist
      const componentIds = [...new Set(input.map((r) => r.componentId))];
      const components = await db
        .select()
        .from(services)
        .where(
          and(
            inArray(services.id, componentIds),
            eq(services.tenantId, tenantId),
          ),
        );

      if (components.length !== componentIds.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or more service components not found",
        });
      }

      // Insert all rules
      const rules = await db
        .insert(pricingRules)
        .values(
          input.map((rule) => ({
            ...rule,
            tenantId,
          })),
        )
        .returning();

      // Log activity
      await db.insert(activityLogs).values({
        tenantId,
        entityType: "pricing_rule",
        entityId: rules[0]?.id || "",
        action: "created",
        description: `Bulk created ${rules.length} pricing rules`,
        userId,
        userName: `${firstName} ${lastName}`,
        metadata: { count: rules.length },
      });

      return { success: true, count: rules.length, rules };
    }),

  // Validate pricing integrity
  validatePricingIntegrity: adminProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    const issues: Array<{
      type: string;
      severity: "error" | "warning" | "info";
      message: string;
      details?: unknown;
    }> = [];

    // Check for components without rules
    const componentsWithoutRules = await db
      .select({
        id: services.id,
        code: services.code,
        name: services.name,
      })
      .from(services)
      .leftJoin(pricingRules, eq(services.id, pricingRules.componentId))
      .where(
        and(
          eq(services.tenantId, tenantId),
          eq(services.isActive, true),
          sql`${pricingRules.id} IS NULL`,
        ),
      );

    if (componentsWithoutRules.length > 0) {
      issues.push({
        type: "missing_rules",
        severity: "warning",
        message: `${componentsWithoutRules.length} active service components have no pricing rules`,
        details: componentsWithoutRules,
      });
    }

    // Check for rules without components
    const rulesWithoutComponents = await db
      .select({
        id: pricingRules.id,
        ruleType: pricingRules.ruleType,
      })
      .from(pricingRules)
      .leftJoin(services, eq(pricingRules.componentId, services.id))
      .where(
        and(eq(pricingRules.tenantId, tenantId), sql`${services.id} IS NULL`),
      );

    if (rulesWithoutComponents.length > 0) {
      issues.push({
        type: "orphaned_rules",
        severity: "error",
        message: `${rulesWithoutComponents.length} pricing rules reference non-existent components`,
        details: rulesWithoutComponents,
      });
    }

    // Check for inactive components with active rules
    const inactiveWithActiveRules = await db
      .select({
        componentId: services.id,
        componentName: services.name,
        ruleCount: sql<number>`count(${pricingRules.id})::int`,
      })
      .from(services)
      .innerJoin(pricingRules, eq(services.id, pricingRules.componentId))
      .where(
        and(
          eq(services.tenantId, tenantId),
          eq(services.isActive, false),
          eq(pricingRules.isActive, true),
        ),
      )
      .groupBy(services.id, services.name);

    if (inactiveWithActiveRules.length > 0) {
      issues.push({
        type: "inactive_with_active_rules",
        severity: "warning",
        message: `${inactiveWithActiveRules.length} inactive components have active pricing rules`,
        details: inactiveWithActiveRules,
      });
    }

    return {
      success: true,
      healthy: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    };
  }),
});
