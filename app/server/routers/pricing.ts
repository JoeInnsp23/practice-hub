import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pricingRules, serviceComponents } from "@/lib/db/schema";
import { protectedProcedure, router } from "../trpc";

// Zod schemas
const serviceSelectionSchema = z.object({
  componentCode: z.string(),
  quantity: z.number().optional(),
  config: z
    .object({
      complexity: z
        .enum(["clean", "average", "complex", "disaster"])
        .optional(),
      frequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
      employees: z.number().optional(),
      payrollFrequency: z
        .enum(["monthly", "weekly", "fortnightly", "4weekly"])
        .optional(),
    })
    .passthrough()
    .optional(),
});

const pricingInputSchema = z.object({
  turnover: z.string(),
  industry: z.enum(["simple", "standard", "complex", "regulated"]),
  services: z.array(serviceSelectionSchema),
  transactionData: z
    .object({
      monthlyTransactions: z.number(),
      source: z.enum(["xero", "manual", "estimated"]),
    })
    .optional(),
  modifiers: z
    .object({
      isRush: z.boolean().optional(),
      newClient: z.boolean().optional(),
      customDiscount: z.number().optional(),
    })
    .optional(),
});

// TypeScript interfaces
interface ServicePrice {
  componentCode: string;
  componentName: string;
  calculation: string;
  basePrice: number;
  adjustments: Adjustment[];
  finalPrice: number;
}

interface Adjustment {
  type: "complexity" | "industry" | "volume" | "rush";
  description: string;
  multiplier?: number;
  amount?: number;
}

interface Discount {
  type: "volume" | "new_client" | "custom" | "rush";
  description: string;
  percentage?: number;
  amount: number;
}

interface PricingModel {
  name: string;
  services: ServicePrice[];
  subtotal: number;
  discounts: Discount[];
  total: number;
  monthlyTotal: number;
  annualTotal: number;
}

// Helper functions
function getComplexityMultiplier(
  complexity: "clean" | "average" | "complex" | "disaster",
  model: "modelA" | "modelB" = "modelA",
): number {
  const multipliers = {
    modelA: {
      clean: 0.95,
      average: 1.0,
      complex: 1.15,
      disaster: 1.4,
    },
    modelB: {
      clean: 0.98,
      average: 1.0,
      complex: 1.08,
      disaster: 1.2,
    },
  };
  return multipliers[model][complexity];
}

function getIndustryMultiplier(industry: string): number {
  const multipliers: Record<string, number> = {
    simple: 0.95,
    standard: 1.0,
    complex: 1.15,
    regulated: 1.3,
  };
  return multipliers[industry] || 1.0;
}

function calculatePayroll(employees: number, frequency: string): number {
  // Director only
  if (employees === 0 || employees === 1) {
    return 18;
  }

  // Based on employee count (monthly)
  let basePrice = 18;
  if (employees <= 5) basePrice = 50;
  else if (employees <= 10) basePrice = 70;
  else if (employees <= 15) basePrice = 90;
  else if (employees <= 20) basePrice = 110;
  else basePrice = 130 + (employees - 20) * 2;

  // Adjust for frequency
  if (frequency === "weekly") return basePrice * 3;
  if (frequency === "fortnightly") return basePrice * 2;
  if (frequency === "4weekly") return basePrice * 2;

  return basePrice;
}

function parseTurnoverBand(turnover: string): {
  min: number;
  max: number | null;
} {
  // Handle formats like "0-89k", "90k-149k", "1m+"
  if (turnover === "1m+") {
    return { min: 1000000, max: null };
  }

  const parts = turnover.split("-");
  const parseValue = (val: string): number => {
    if (val.endsWith("k")) {
      return Number.parseInt(val.slice(0, -1), 10) * 1000;
    }
    if (val.endsWith("m")) {
      return Number.parseInt(val.slice(0, -1), 10) * 1000000;
    }
    return Number.parseInt(val, 10);
  };

  return {
    min: parseValue(parts[0]),
    max: parts[1] ? parseValue(parts[1]) : null,
  };
}

function buildCalculationString(
  rule: { price: string | number },
  adjustments: Adjustment[],
): string {
  let calc = `Base: £${Number(rule.price).toFixed(2)}`;
  for (const adj of adjustments) {
    if (adj.multiplier) {
      calc += ` × ${adj.multiplier} (${adj.description})`;
    }
  }
  return calc;
}

function buildTransactionCalculationString(
  basePrice: number,
  adjustments: Adjustment[],
): string {
  let calc = `Base: £${basePrice.toFixed(2)}`;
  const volumeAdj = adjustments.find((a) => a.type === "volume");
  if (volumeAdj) {
    calc += ` + ${volumeAdj.description}`;
  }
  const complexityAdj = adjustments.find((a) => a.type === "complexity");
  if (complexityAdj?.multiplier) {
    calc += ` × ${complexityAdj.multiplier} (${complexityAdj.description})`;
  }
  return calc;
}

function applyDiscounts(
  subtotal: number,
  modifiers?: z.infer<typeof pricingInputSchema>["modifiers"],
): Discount[] {
  const discounts: Discount[] = [];
  let currentSubtotal = subtotal;

  // Volume discount (tier 1)
  if (currentSubtotal > 500) {
    const discount = currentSubtotal * 0.05;
    discounts.push({
      type: "volume",
      description: "5% volume discount (over £500/month)",
      percentage: 5,
      amount: discount,
    });
    currentSubtotal -= discount;
  }

  // Volume discount (tier 2)
  if (currentSubtotal > 1000) {
    const additionalDiscount = currentSubtotal * 0.03;
    discounts.push({
      type: "volume",
      description: "Additional 3% discount (over £1000/month)",
      percentage: 3,
      amount: additionalDiscount,
    });
  }

  // Rush fee (modifier, not discount)
  if (modifiers?.isRush) {
    const rushFee = subtotal * 0.25;
    discounts.push({
      type: "rush",
      description: "25% rush fee (within 1 month of deadline)",
      percentage: 25,
      amount: -rushFee, // Negative = additional charge
    });
  }

  // New client discount (requires approval)
  if (modifiers?.newClient) {
    const discount = subtotal * 0.1;
    discounts.push({
      type: "new_client",
      description: "10% first-year discount (new client)",
      percentage: 10,
      amount: discount,
    });
  }

  // Custom discount (requires approval)
  if (modifiers?.customDiscount) {
    const discount = subtotal * (modifiers.customDiscount / 100);
    discounts.push({
      type: "custom",
      description: `${modifiers.customDiscount}% custom discount (approved)`,
      percentage: modifiers.customDiscount,
      amount: discount,
    });
  }

  return discounts;
}

// Main calculation functions
async function calculateModelA(
  input: z.infer<typeof pricingInputSchema>,
  tenantId: string,
): Promise<PricingModel> {
  const services: ServicePrice[] = [];
  let subtotal = 0;

  for (const service of input.services) {
    // Get component
    const [component] = await db
      .select()
      .from(serviceComponents)
      .where(
        and(
          eq(serviceComponents.code, service.componentCode),
          eq(serviceComponents.tenantId, tenantId),
          eq(serviceComponents.isActive, true),
        ),
      )
      .limit(1);

    if (!component) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Service component ${service.componentCode} not found`,
      });
    }

    // Special handling for payroll
    if (component.code.startsWith("PAYROLL")) {
      const payrollPrice = calculatePayroll(
        service.config?.employees || 0,
        service.config?.payrollFrequency || "monthly",
      );

      services.push({
        componentCode: service.componentCode,
        componentName: component.name,
        calculation: `${service.config?.employees || 0} employees, ${service.config?.payrollFrequency || "monthly"}`,
        basePrice: payrollPrice,
        adjustments: [],
        finalPrice: payrollPrice,
      });

      subtotal += payrollPrice;
      continue;
    }

    // Handle fixed-price services (no pricing rules needed)
    if (component.pricingModel === "fixed") {
      const fixedPrice = component.price ? Number(component.price) : 0;

      services.push({
        componentCode: service.componentCode,
        componentName: component.name,
        calculation: `Fixed price`,
        basePrice: fixedPrice,
        adjustments: [],
        finalPrice: fixedPrice,
      });

      subtotal += fixedPrice;
      continue;
    }

    // Get pricing rule for turnover band (for turnover/both pricing models)
    const turnoverBand = parseTurnoverBand(input.turnover);
    const rules = await db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.componentId, component.id),
          eq(pricingRules.ruleType, "turnover_band"),
          eq(pricingRules.isActive, true),
          lte(pricingRules.minValue, turnoverBand.min.toString()),
          gte(pricingRules.maxValue, turnoverBand.min.toString()),
        ),
      )
      .limit(1);

    const rule = rules[0];
    if (!rule) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No pricing rule found for ${service.componentCode} at turnover ${input.turnover}`,
      });
    }

    let basePrice = Number(rule.price);
    const adjustments: Adjustment[] = [];

    // Apply complexity multiplier
    if (service.config?.complexity && component.supportsComplexity) {
      const complexityMultiplier = getComplexityMultiplier(
        service.config.complexity,
      );
      adjustments.push({
        type: "complexity",
        description: `${service.config.complexity} books`,
        multiplier: complexityMultiplier,
      });
      basePrice *= complexityMultiplier;
    }

    // Apply industry multiplier
    const industryMultiplier = getIndustryMultiplier(input.industry);
    if (industryMultiplier !== 1.0) {
      adjustments.push({
        type: "industry",
        description: `${input.industry} industry`,
        multiplier: industryMultiplier,
      });
      basePrice *= industryMultiplier;
    }

    services.push({
      componentCode: service.componentCode,
      componentName: component.name,
      calculation: buildCalculationString(rule, adjustments),
      basePrice: Number(rule.price),
      adjustments,
      finalPrice: basePrice,
    });

    subtotal += basePrice;
  }

  // Apply discounts
  const discounts = applyDiscounts(subtotal, input.modifiers);
  const total = subtotal - discounts.reduce((sum, d) => sum + d.amount, 0);

  return {
    name: "Turnover-Based",
    services,
    subtotal,
    discounts,
    total,
    monthlyTotal: total,
    annualTotal: total * 12,
  };
}

async function calculateModelB(
  input: z.infer<typeof pricingInputSchema>,
  tenantId: string,
): Promise<PricingModel | null> {
  if (!input.transactionData) return null;

  const services: ServicePrice[] = [];
  let subtotal = 0;

  for (const service of input.services) {
    // Get component
    const [component] = await db
      .select()
      .from(serviceComponents)
      .where(
        and(
          eq(serviceComponents.code, service.componentCode),
          eq(serviceComponents.tenantId, tenantId),
          eq(serviceComponents.isActive, true),
        ),
      )
      .limit(1);

    if (!component) continue;

    // Special handling for payroll (same as Model A)
    if (component.code.startsWith("PAYROLL")) {
      const payrollPrice = calculatePayroll(
        service.config?.employees || 0,
        service.config?.payrollFrequency || "monthly",
      );

      services.push({
        componentCode: service.componentCode,
        componentName: component.name,
        calculation: `${service.config?.employees || 0} employees, ${service.config?.payrollFrequency || "monthly"}`,
        basePrice: payrollPrice,
        adjustments: [],
        finalPrice: payrollPrice,
      });

      subtotal += payrollPrice;
      continue;
    }

    // Handle fixed-price services (same as Model A)
    if (component.pricingModel === "fixed") {
      const fixedPrice = component.price ? Number(component.price) : 0;

      services.push({
        componentCode: service.componentCode,
        componentName: component.name,
        calculation: `Fixed price`,
        basePrice: fixedPrice,
        adjustments: [],
        finalPrice: fixedPrice,
      });

      subtotal += fixedPrice;
      continue;
    }

    // Check if component supports transaction-based pricing
    if (
      component.pricingModel !== "transaction" &&
      component.pricingModel !== "both"
    ) {
      // Skip turnover-only services in Model B (not applicable)
      continue;
    }

    // Get transaction band rule
    const rules = await db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.componentId, component.id),
          or(
            eq(pricingRules.ruleType, "transaction_band"),
            eq(pricingRules.ruleType, "per_unit"),
          ),
          eq(pricingRules.isActive, true),
        ),
      )
      .limit(1);

    const rule = rules[0];
    if (!rule) continue;

    const basePrice = component.basePrice ? Number(component.basePrice) : 0;
    let transactionFee = 0;
    const adjustments: Adjustment[] = [];

    // Calculate transaction-based fee
    if (rule.ruleType === "transaction_band" || rule.ruleType === "per_unit") {
      const rate = Number(rule.price);
      transactionFee = input.transactionData.monthlyTransactions * rate;

      adjustments.push({
        type: "volume",
        description: `${input.transactionData.monthlyTransactions} transactions @ £${rate.toFixed(2)}`,
        amount: transactionFee,
      });
    }

    let finalPrice = basePrice + transactionFee;

    // Apply complexity multiplier (smaller for Model B)
    if (service.config?.complexity && component.supportsComplexity) {
      const complexityMultiplier = getComplexityMultiplier(
        service.config.complexity,
        "modelB",
      );
      adjustments.push({
        type: "complexity",
        description: `${service.config.complexity} books`,
        multiplier: complexityMultiplier,
      });
      finalPrice *= complexityMultiplier;
    }

    services.push({
      componentCode: service.componentCode,
      componentName: component.name,
      calculation: buildTransactionCalculationString(basePrice, adjustments),
      basePrice,
      adjustments,
      finalPrice,
    });

    subtotal += finalPrice;
  }

  // Apply discounts
  const discounts = applyDiscounts(subtotal, input.modifiers);
  const total = subtotal - discounts.reduce((sum, d) => sum + d.amount, 0);

  return {
    name: "Transaction-Based",
    services,
    subtotal,
    discounts,
    total,
    monthlyTotal: total,
    annualTotal: total * 12,
  };
}

function compareModels(
  modelA: PricingModel,
  modelB: PricingModel | null,
): { model: "A" | "B"; reason: string; savings?: number } {
  if (!modelB) {
    return {
      model: "A",
      reason: "Transaction data not available",
      savings: undefined,
    };
  }

  const priceA = modelA.monthlyTotal;
  const priceB = modelB.monthlyTotal;
  const difference = Math.abs(priceA - priceB);
  const percentDiff = (difference / priceA) * 100;

  // If difference is less than 10%, recommend Model A (simpler)
  if (percentDiff < 10) {
    return {
      model: "A",
      reason: "Both models similar - using simpler turnover-based approach",
      savings: undefined,
    };
  }

  // Recommend cheaper model
  if (priceB < priceA) {
    return {
      model: "B",
      reason: `Transaction-based saves £${difference.toFixed(2)}/month (£${(difference * 12).toFixed(0)}/year)`,
      savings: difference,
    };
  }
  return {
    model: "A",
    reason: `Turnover-based saves £${difference.toFixed(2)}/month (£${(difference * 12).toFixed(0)}/year)`,
    savings: difference,
  };
}

function estimateMonthlyTransactions(
  turnover: string,
  industry: string,
  vatRegistered: boolean,
): number {
  const baseEstimates: Record<string, number> = {
    "0-89k": 35,
    "90k-149k": 55,
    "150k-249k": 80,
    "250k-499k": 120,
    "500k-749k": 180,
    "750k-999k": 250,
    "1m+": 350,
  };

  let estimate = baseEstimates[turnover] || 100;

  // Industry adjustments
  const industryMultipliers: Record<string, number> = {
    simple: 0.7,
    standard: 1.0,
    complex: 1.4,
    regulated: 1.2,
  };

  estimate *= industryMultipliers[industry] || 1.0;

  // VAT registration typically means more transactions
  if (vatRegistered) {
    estimate *= 1.2;
  }

  return Math.round(estimate);
}

// Router definition
export const pricingRouter = router({
  // Calculate pricing
  calculate: protectedProcedure
    .input(pricingInputSchema)
    .query(async ({ ctx, input }) => {
      const { tenantId } = ctx.authContext;

      const modelA = await calculateModelA(input, tenantId);
      const modelB = input.transactionData
        ? await calculateModelB(input, tenantId)
        : null;
      const recommendation = compareModels(modelA, modelB);

      return {
        modelA,
        modelB,
        recommendation,
      };
    }),

  // Get all service components
  getComponents: protectedProcedure.query(async ({ ctx }) => {
    const { tenantId } = ctx.authContext;

    return await db
      .select()
      .from(serviceComponents)
      .where(
        and(
          eq(serviceComponents.tenantId, tenantId),
          eq(serviceComponents.isActive, true),
        ),
      )
      .orderBy(serviceComponents.category, serviceComponents.name);
  }),

  // Get pricing rules for a component
  getRules: protectedProcedure
    .input(z.object({ componentId: z.string() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(pricingRules)
        .where(
          and(
            eq(pricingRules.componentId, input.componentId),
            eq(pricingRules.isActive, true),
          ),
        );
    }),

  // Estimate transactions
  estimateTransactions: protectedProcedure
    .input(
      z.object({
        turnover: z.string(),
        industry: z.string(),
        vatRegistered: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      return {
        estimated: estimateMonthlyTransactions(
          input.turnover,
          input.industry,
          input.vatRegistered,
        ),
      };
    }),
});
