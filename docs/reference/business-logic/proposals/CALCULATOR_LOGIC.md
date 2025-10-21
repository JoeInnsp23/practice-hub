# Pricing Calculator - Technical Implementation Guide

**Version:** 1.0
**Last Updated:** September 30, 2025
**Audience:** Developers

This document provides technical specifications for implementing the modular pricing calculator system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Models](#data-models)
3. [Calculation Algorithms](#calculation-algorithms)
4. [Transaction Estimation](#transaction-estimation)
5. [API Specifications](#api-specifications)
6. [Frontend Components](#frontend-components)
7. [Testing Requirements](#testing-requirements)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Service   │  │   Pricing    │  │  Proposal  │ │
│  │  Selector   │→ │  Calculator  │→ │  Builder   │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────│──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  tRPC Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   Pricing   │  │  Proposals   │  │Transaction │ │
│  │   Router    │  │    Router    │  │Data Router │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────│──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│               Business Logic Layer                   │
│  ┌─────────────────────────────────────────────┐   │
│  │  Pricing Engine                             │   │
│  │  - Model A Calculator                       │   │
│  │  - Model B Calculator                       │   │
│  │  - Comparison Engine                        │   │
│  │  - Modifier Application                     │   │
│  └─────────────────────────────────────────────┘   │
└──────────────────────────│──────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│                  Database (PostgreSQL)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │   Service    │  │   Pricing    │  │Transaction│ │
│  │  Components  │  │    Rules     │  │   Data    │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Data Models

### TypeScript Interfaces

```typescript
// Service Component
interface ServiceComponent {
  id: number;
  tenantId: string;
  code: string; // e.g., 'COMP_ACCOUNTS', 'BOOK_BASIC'
  name: string;
  category: ServiceCategory;
  description?: string;
  pricingModel: 'turnover' | 'transaction' | 'both' | 'fixed';
  basePrice?: number;
  isActive: boolean;
}

enum ServiceCategory {
  COMPLIANCE = 'compliance',
  VAT = 'vat',
  BOOKKEEPING = 'bookkeeping',
  PAYROLL = 'payroll',
  MANAGEMENT = 'management',
  SECRETARIAL = 'secretarial',
  TAX_PLANNING = 'tax_planning',
  ADDON = 'addon',
}

// Pricing Rule
interface PricingRule {
  id: number;
  tenantId: string;
  componentId: number;
  ruleType: 'turnover_band' | 'transaction_band' | 'per_unit' | 'fixed';
  minValue?: number; // For bands
  maxValue?: number; // For bands
  price: number;
  complexityLevel?: 'clean' | 'average' | 'complex' | 'disaster';
  metadata?: Record<string, any>;
  isActive: boolean;
}

// Service Selection
interface ServiceSelection {
  componentCode: string;
  quantity?: number; // For per-unit services
  config?: {
    complexity?: 'clean' | 'average' | 'complex' | 'disaster';
    frequency?: 'monthly' | 'quarterly' | 'annual';
    employees?: number; // For payroll
    payrollFrequency?: 'monthly' | 'weekly' | 'fortnightly' | '4weekly';
    [key: string]: any;
  };
}

// Calculation Input
interface PricingCalculationInput {
  turnover: string; // e.g., '90k-149k'
  industry: 'simple' | 'standard' | 'complex' | 'regulated';
  services: ServiceSelection[];
  transactionData?: {
    monthlyTransactions: number;
    source: 'xero' | 'manual' | 'estimated';
  };
  modifiers?: {
    isRush?: boolean;
    newClient?: boolean;
    customDiscount?: number; // Percentage
  };
}

// Calculation Output
interface PricingCalculationResult {
  modelA: PricingModel;
  modelB?: PricingModel;
  recommendation: {
    model: 'A' | 'B';
    reason: string;
    savings?: number;
  };
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

interface ServicePrice {
  componentCode: string;
  componentName: string;
  calculation: string; // Human-readable explanation
  basePrice: number;
  adjustments: Adjustment[];
  finalPrice: number;
}

interface Adjustment {
  type: 'complexity' | 'industry' | 'volume' | 'rush';
  description: string;
  multiplier?: number;
  amount?: number;
}

interface Discount {
  type: 'volume' | 'new_client' | 'custom';
  description: string;
  percentage?: number;
  amount: number;
}
```

---

## Calculation Algorithms

### Model A: Turnover-Based Calculation

```typescript
function calculateModelA(input: PricingCalculationInput): PricingModel {
  const services: ServicePrice[] = [];
  let subtotal = 0;

  for (const service of input.services) {
    // Get component
    const component = getServiceComponent(service.componentCode);

    // Get pricing rule for this turnover band
    const rule = getPricingRule(
      component.id,
      'turnover_band',
      input.turnover,
      service.config?.complexity
    );

    if (!rule) {
      throw new Error(`No pricing rule found for ${service.componentCode}`);
    }

    let basePrice = rule.price;
    const adjustments: Adjustment[] = [];

    // Apply complexity multiplier (if applicable)
    if (service.config?.complexity && component.supportsComplexity) {
      const complexityMultiplier = getComplexityMultiplier(
        service.config.complexity
      );
      adjustments.push({
        type: 'complexity',
        description: `${service.config.complexity} books`,
        multiplier: complexityMultiplier,
      });
      basePrice *= complexityMultiplier;
    }

    // Apply industry multiplier
    const industryMultiplier = getIndustryMultiplier(input.industry);
    if (industryMultiplier !== 1.0) {
      adjustments.push({
        type: 'industry',
        description: `${input.industry} industry`,
        multiplier: industryMultiplier,
      });
      basePrice *= industryMultiplier;
    }

    // Handle special cases (e.g., payroll by employee count)
    if (component.code.startsWith('PAYROLL')) {
      const payrollPrice = calculatePayroll(
        service.config?.employees || 0,
        service.config?.payrollFrequency || 'monthly'
      );
      basePrice = payrollPrice;
    }

    services.push({
      componentCode: service.componentCode,
      componentName: component.name,
      calculation: buildCalculationString(component, rule, adjustments),
      basePrice: rule.price,
      adjustments,
      finalPrice: basePrice,
    });

    subtotal += basePrice;
  }

  // Apply discounts
  const discounts = applyDiscounts(subtotal, input.modifiers);

  const total = subtotal - discounts.reduce((sum, d) => sum + d.amount, 0);

  return {
    name: 'Turnover-Based',
    services,
    subtotal,
    discounts,
    total,
    monthlyTotal: total,
    annualTotal: total * 12,
  };
}
```

### Model B: Transaction-Based Calculation

```typescript
function calculateModelB(input: PricingCalculationInput): PricingModel | null {
  if (!input.transactionData) return null;

  const services: ServicePrice[] = [];
  let subtotal = 0;

  for (const service of input.services) {
    const component = getServiceComponent(service.componentCode);

    // Check if component supports transaction-based pricing
    if (component.pricingModel !== 'transaction' &&
        component.pricingModel !== 'both') {
      // Fall back to Model A for this service
      const fallbackPrice = calculateServiceModelA(service, input);
      services.push(fallbackPrice);
      subtotal += fallbackPrice.finalPrice;
      continue;
    }

    // Get transaction band rule
    const rule = getTransactionBandRule(
      component.id,
      input.transactionData.monthlyTransactions,
      service.config?.complexity
    );

    let basePrice = component.basePrice || 0;
    let transactionFee = 0;
    const adjustments: Adjustment[] = [];

    // Calculate transaction-based fee
    if (rule.ruleType === 'transaction_band') {
      const rate = rule.price;
      transactionFee = input.transactionData.monthlyTransactions * rate;

      adjustments.push({
        type: 'volume',
        description: `${input.transactionData.monthlyTransactions} transactions @ £${rate}`,
        amount: transactionFee,
      });
    }

    let finalPrice = basePrice + transactionFee;

    // Apply complexity multiplier (smaller impact for Model B)
    if (service.config?.complexity && component.supportsComplexity) {
      const complexityMultiplier = getComplexityMultiplier(
        service.config.complexity,
        'modelB' // Lower multipliers for Model B
      );
      adjustments.push({
        type: 'complexity',
        description: `${service.config.complexity} books`,
        multiplier: complexityMultiplier,
      });
      finalPrice *= complexityMultiplier;
    }

    services.push({
      componentCode: service.componentCode,
      componentName: component.name,
      calculation: buildTransactionCalculationString(
        component,
        basePrice,
        transactionFee,
        adjustments
      ),
      basePrice: basePrice,
      adjustments,
      finalPrice,
    });

    subtotal += finalPrice;
  }

  // Apply discounts
  const discounts = applyDiscounts(subtotal, input.modifiers);

  const total = subtotal - discounts.reduce((sum, d) => sum + d.amount, 0);

  return {
    name: 'Transaction-Based',
    services,
    subtotal,
    discounts,
    total,
    monthlyTotal: total,
    annualTotal: total * 12,
  };
}
```

### Comparison Engine

```typescript
function compareModels(
  modelA: PricingModel,
  modelB: PricingModel | null
): RecommendationResult {
  // If no Model B, recommend Model A
  if (!modelB) {
    return {
      model: 'A',
      reason: 'Transaction data not available',
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
      model: 'A',
      reason: 'Both models similar - using simpler turnover-based approach',
      savings: undefined,
    };
  }

  // Recommend cheaper model
  if (priceB < priceA) {
    return {
      model: 'B',
      reason: `Transaction-based saves £${difference.toFixed(2)}/month (£${(difference * 12).toFixed(0)}/year)`,
      savings: difference,
    };
  } else {
    return {
      model: 'A',
      reason: `Turnover-based saves £${difference.toFixed(2)}/month (£${(difference * 12).toFixed(0)}/year)`,
      savings: difference,
    };
  }
}
```

### Discount Application

```typescript
function applyDiscounts(
  subtotal: number,
  modifiers?: PricingCalculationInput['modifiers']
): Discount[] {
  const discounts: Discount[] = [];

  // Volume discount
  if (subtotal > 500) {
    const discount = subtotal * 0.05;
    discounts.push({
      type: 'volume',
      description: '5% volume discount (over £500/month)',
      percentage: 5,
      amount: discount,
    });
    subtotal -= discount; // Apply for next tier
  }

  if (subtotal > 1000) {
    const additionalDiscount = subtotal * 0.03; // Additional 3% (total 8%)
    discounts.push({
      type: 'volume',
      description: 'Additional 3% discount (over £1000/month)',
      percentage: 3,
      amount: additionalDiscount,
    });
  }

  // Rush fee (modifier, not discount, but handled here)
  if (modifiers?.isRush) {
    const rushFee = subtotal * 0.25;
    discounts.push({
      type: 'rush',
      description: '25% rush fee (within 1 month of deadline)',
      percentage: 25,
      amount: -rushFee, // Negative = additional charge
    });
  }

  // New client discount (requires approval)
  if (modifiers?.newClient) {
    const discount = subtotal * 0.10;
    discounts.push({
      type: 'new_client',
      description: '10% first-year discount (new client)',
      percentage: 10,
      amount: discount,
    });
  }

  // Custom discount (requires approval)
  if (modifiers?.customDiscount) {
    const discount = subtotal * (modifiers.customDiscount / 100);
    discounts.push({
      type: 'custom',
      description: `${modifiers.customDiscount}% custom discount (approved)`,
      percentage: modifiers.customDiscount,
      amount: discount,
    });
  }

  return discounts;
}
```

---

## Transaction Estimation

When transaction data is not available, estimate based on business characteristics:

```typescript
function estimateMonthlyTransactions(
  turnover: string,
  industry: string,
  vatRegistered: boolean
): number {
  // Base estimates by turnover
  const baseEstimates: Record<string, number> = {
    '0-89k': 35,
    '90k-149k': 55,
    '150k-249k': 80,
    '250k-499k': 120,
    '500k-749k': 180,
    '750k-999k': 250,
    '1m+': 350,
  };

  let estimate = baseEstimates[turnover] || 100;

  // Industry adjustments
  const industryMultipliers: Record<string, number> = {
    simple: 0.7, // Consultancy, low-volume B2B
    standard: 1.0,
    complex: 1.4, // Retail, e-commerce, high-volume
    regulated: 1.2, // Financial services
  };

  estimate *= industryMultipliers[industry] || 1.0;

  // VAT registration typically means more transactions
  if (vatRegistered) {
    estimate *= 1.2;
  }

  return Math.round(estimate);
}
```

---

## API Specifications

### tRPC Router: Pricing

```typescript
// app/server/routers/pricing.ts

import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

const serviceSelectionSchema = z.object({
  componentCode: z.string(),
  quantity: z.number().optional(),
  config: z.record(z.any()).optional(),
});

const pricingInputSchema = z.object({
  turnover: z.string(),
  industry: z.enum(['simple', 'standard', 'complex', 'regulated']),
  services: z.array(serviceSelectionSchema),
  transactionData: z.object({
    monthlyTransactions: z.number(),
    source: z.enum(['xero', 'manual', 'estimated']),
  }).optional(),
  modifiers: z.object({
    isRush: z.boolean().optional(),
    newClient: z.boolean().optional(),
    customDiscount: z.number().optional(),
  }).optional(),
});

export const pricingRouter = router({
  // Calculate pricing
  calculate: protectedProcedure
    .input(pricingInputSchema)
    .query(async ({ ctx, input }) => {
      const modelA = calculateModelA(input);
      const modelB = input.transactionData
        ? calculateModelB(input)
        : null;
      const recommendation = compareModels(modelA, modelB);

      return {
        modelA,
        modelB,
        recommendation,
      };
    }),

  // Get all service components
  getComponents: protectedProcedure
    .query(async ({ ctx }) => {
      return await db.select()
        .from(serviceComponents)
        .where(eq(serviceComponents.tenantId, ctx.authContext.tenantId))
        .where(eq(serviceComponents.isActive, true))
        .orderBy(serviceComponents.category, serviceComponents.name);
    }),

  // Get pricing rules for a component
  getRules: protectedProcedure
    .input(z.object({ componentId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.select()
        .from(pricingRules)
        .where(eq(pricingRules.componentId, input.componentId))
        .where(eq(pricingRules.isActive, true));
    }),

  // Estimate transactions
  estimateTransactions: protectedProcedure
    .input(z.object({
      turnover: z.string(),
      industry: z.string(),
      vatRegistered: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      return {
        estimated: estimateMonthlyTransactions(
          input.turnover,
          input.industry,
          input.vatRegistered
        ),
      };
    }),
});
```

---

## Frontend Components

### Service Selector Component

```typescript
// app/proposal-hub/components/ServiceSelector.tsx

'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function ServiceSelector({ onChange }: { onChange: (services: any[]) => void }) {
  const { data: components } = api.pricing.getComponents.useQuery();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const groupedComponents = components?.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof components>);

  const handleToggle = (code: string) => {
    const newSelected = { ...selected, [code]: !selected[code] };
    setSelected(newSelected);

    const selectedServices = Object.keys(newSelected)
      .filter(key => newSelected[key])
      .map(code => ({ componentCode: code }));

    onChange(selectedServices);
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-2xl font-semibold mb-4">Select Services</h2>

      {Object.entries(groupedComponents || {}).map(([category, comps]) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-medium mb-2 capitalize">
            {category.replace('_', ' ')}
          </h3>
          <div className="space-y-2">
            {comps.map(comp => (
              <div key={comp.code} className="flex items-center space-x-2">
                <Checkbox
                  id={comp.code}
                  checked={selected[comp.code] || false}
                  onCheckedChange={() => handleToggle(comp.code)}
                />
                <Label htmlFor={comp.code} className="cursor-pointer">
                  {comp.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Pricing Calculator Component

```typescript
// app/proposal-hub/components/PricingCalculator.tsx

'use client';

import { api } from '@/lib/trpc/client';
import { Card } from '@/components/ui/card';

interface Props {
  turnover: string;
  industry: string;
  services: any[];
  transactionData?: any;
}

export function PricingCalculator(props: Props) {
  const { data, isLoading } = api.pricing.calculate.useQuery(props);

  if (isLoading) return <div>Calculating...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Model A */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">
          Option A: Turnover-Based
        </h3>
        <div className="space-y-2">
          {data.modelA.services.map(service => (
            <div key={service.componentCode} className="flex justify-between">
              <span>{service.componentName}</span>
              <span>£{service.finalPrice.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>£{data.modelA.monthlyTotal.toFixed(2)}/month</span>
          </div>
        </div>
      </Card>

      {/* Model B */}
      {data.modelB && (
        <Card className="p-6 border-2 border-primary">
          <h3 className="text-xl font-semibold mb-4">
            Option B: Transaction-Based ✓ Recommended
          </h3>
          <div className="space-y-2">
            {data.modelB.services.map(service => (
              <div key={service.componentCode} className="flex justify-between">
                <span>{service.componentName}</span>
                <span>£{service.finalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>£{data.modelB.monthlyTotal.toFixed(2)}/month</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-green-600">
            {data.recommendation.reason}
          </p>
        </Card>
      )}
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('Pricing Calculator', () => {
  describe('Model A Calculation', () => {
    it('should calculate basic accounts pricing correctly', () => {
      const result = calculateModelA({
        turnover: '90k-149k',
        industry: 'standard',
        services: [{ componentCode: 'COMP_ACCOUNTS' }],
      });

      expect(result.monthlyTotal).toBe(59);
    });

    it('should apply complexity multiplier', () => {
      const result = calculateModelA({
        turnover: '150k-249k',
        industry: 'standard',
        services: [{
          componentCode: 'BOOK_FULL',
          config: { complexity: 'complex' },
        }],
      });

      // Base £300 * 1.15 (complex) = £345
      expect(result.monthlyTotal).toBe(345);
    });

    it('should apply industry multiplier', () => {
      const result = calculateModelA({
        turnover: '90k-149k',
        industry: 'complex',
        services: [{ componentCode: 'COMP_ACCOUNTS' }],
      });

      // Base £59 * 1.15 (complex industry) = £67.85
      expect(result.monthlyTotal).toBeCloseTo(67.85);
    });
  });

  describe('Model B Calculation', () => {
    it('should calculate transaction-based pricing correctly', () => {
      const result = calculateModelB({
        turnover: '90k-149k',
        industry: 'standard',
        services: [{ componentCode: 'COMP_ACCOUNTS' }],
        transactionData: {
          monthlyTransactions: 100,
          source: 'xero',
        },
      });

      // Base £30 + (100 * £0.15) = £45
      expect(result?.monthlyTotal).toBe(45);
    });
  });

  describe('Comparison Engine', () => {
    it('should recommend Model B when significantly cheaper', () => {
      const modelA = { monthlyTotal: 300 } as PricingModel;
      const modelB = { monthlyTotal: 200 } as PricingModel;

      const recommendation = compareModels(modelA, modelB);

      expect(recommendation.model).toBe('B');
      expect(recommendation.savings).toBe(100);
    });

    it('should recommend Model A when difference is small', () => {
      const modelA = { monthlyTotal: 100 } as PricingModel;
      const modelB = { monthlyTotal: 98 } as PricingModel;

      const recommendation = compareModels(modelA, modelB);

      expect(recommendation.model).toBe('A');
      expect(recommendation.reason).toContain('similar');
    });
  });

  describe('Transaction Estimation', () => {
    it('should estimate correctly for small business', () => {
      const estimated = estimateMonthlyTransactions('90k-149k', 'standard', true);

      // 55 (base) * 1.0 (standard) * 1.2 (VAT) = 66
      expect(estimated).toBe(66);
    });

    it('should estimate correctly for retail', () => {
      const estimated = estimateMonthlyTransactions('150k-249k', 'complex', false);

      // 80 (base) * 1.4 (complex/retail) = 112
      expect(estimated).toBe(112);
    });
  });
});
```

### Integration Tests

```typescript
describe('Pricing tRPC Router', () => {
  it('should calculate pricing via API', async () => {
    const result = await caller.pricing.calculate({
      turnover: '90k-149k',
      industry: 'standard',
      services: [{ componentCode: 'COMP_ACCOUNTS' }],
    });

    expect(result.modelA).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  it('should fetch service components', async () => {
    const components = await caller.pricing.getComponents();

    expect(components.length).toBeGreaterThan(0);
    expect(components[0]).toHaveProperty('code');
  });
});
```

---

## Performance Considerations

1. **Cache pricing rules** - Rules rarely change, cache for 1 hour
2. **Debounce calculator** - Don't recalculate on every keystroke
3. **Lazy load components** - Don't load all components upfront
4. **Optimize database queries** - Use indexes on componentId, tenantId
5. **Transaction data caching** - Cache Xero data for 30 days

---

## Error Handling

```typescript
class PricingCalculationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PricingCalculationError';
  }
}

// Usage
try {
  const result = calculateModelA(input);
} catch (error) {
  if (error instanceof PricingCalculationError) {
    if (error.code === 'MISSING_RULE') {
      // Log and use fallback
      logger.error('Missing pricing rule', error.details);
      return fallbackPricing();
    }
  }
  throw error;
}
```

---

*End of Document*
