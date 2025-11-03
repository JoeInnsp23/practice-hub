# Pricing Model: Formulas, Tiers & Thresholds

**Date:** 2025-10-28
**Version:** 1.0 (Production-Ready Design)
**Currency:** GBP (£)

---

## Executive Summary

Practice Hub uses a **dual-model pricing system**:
- **Model A:** Turnover-based banding (simpler, predictable)
- **Model B:** Transaction-based calculation (more accurate for high-volume businesses)

The system **automatically recommends** the better model based on client data, with complexity and industry multipliers applied to both models.

---

## Core Pricing Formula

### Universal Formula (Both Models):

```
FINAL_PRICE = (BASE_PRICE × COMPLEXITY_MULTIPLIER × INDUSTRY_MULTIPLIER) + SURCHARGES - DISCOUNTS
```

**Where:**
- `BASE_PRICE` = Calculated from Model A or Model B
- `COMPLEXITY_MULTIPLIER` = 0.95 (clean) to 1.4 (disaster)
- `INDUSTRY_MULTIPLIER` = 0.95 (simple) to 1.3 (regulated)
- `SURCHARGES` = Add-ons (multi-currency £25, multi-entity variable)
- `DISCOUNTS` = Volume, new client, rush, custom

---

## Model A: Turnover-Based Pricing

### Formula:

```
BASE_PRICE_A = TURNOVER_BAND_PRICE[lookupBand(annualTurnover)]
```

**For each service:**

```typescript
const calculateModelA = (service: Service, params: PricingParams): number => {
  // 1. Determine base price from turnover band
  const turnoverBand = mapTurnoverBand(params.turnover);
  const rule = findPricingRule(service.id, turnoverBand);
  let basePrice = rule.price;

  // 2. Apply complexity multiplier
  const complexityMultiplier = getComplexityMultiplier(params.complexity, 'modelA');
  basePrice *= complexityMultiplier;

  // 3. Apply industry multiplier
  const industryMultiplier = getIndustryMultiplier(params.industry);
  basePrice *= industryMultiplier;

  // 4. Special cases
  if (service.code === 'PAYROLL_STANDARD') {
    basePrice = calculatePayrollPrice(params.employees, params.frequency);
  }

  return basePrice;
};
```

### Turnover Bands (Market-Aligned):

| Band Label | Min (£) | Max (£) | Example Services Pricing |
|------------|---------|---------|-------------------------|
| `0-89k` | 0 | 89,999 | Annual Accounts: £300-£660 |
| `90k-149k` | 90,000 | 149,999 | Annual Accounts: £660-£900 |
| `150k-249k` | 150,000 | 249,999 | Annual Accounts: £840-£1,020 |
| `250k-499k` | 250,000 | 499,999 | Annual Accounts: £900-£1,260 |
| `500k-749k` | 500,000 | 749,999 | Annual Accounts: £1,260-£1,470 |
| `750k-999k` | 750,000 | 999,999 | Annual Accounts: £1,470-£2,000 |
| `1m+` | 1,000,000 | null | Annual Accounts: £2,000-£7,500 |

**Source:** Market research (src003, src002, src013) - See `21-market-data.csv`

### Complexity Multipliers (Model A):

```typescript
const COMPLEXITY_MULTIPLIERS_A = {
  clean: 0.95,       // Well-maintained books, Xero/QuickBooks
  average: 1.0,      // Standard complexity (baseline)
  complex: 1.15,     // Multiple income streams, Excel-based
  disaster: 1.4      // Major cleanup required, no records
};
```

**Location:** `app/server/routers/pricing.ts:81-100`

### Industry Multipliers (Both Models):

```typescript
const INDUSTRY_MULTIPLIERS = {
  simple: 0.95,      // Sole trader consulting, low transaction volume
  standard: 1.0,     // Standard retail, services (baseline)
  complex: 1.15,     // Construction, ecommerce, property
  regulated: 1.3     // Financial services, legal, healthcare
};
```

**Location:** `app/server/routers/pricing.ts:102-110`

---

## Model B: Transaction-Based Pricing

### Formula:

```
BASE_PRICE_B = TRANSACTION_BAND_BASE + (TRANSACTIONS_PER_MONTH × RATE_PER_TRANSACTION)
```

**For each service:**

```typescript
const calculateModelB = (service: Service, params: PricingParams): number => {
  // 1. Determine transaction band pricing rule
  const txnBand = mapTransactionBand(params.monthlyTransactions);
  const rule = findTransactionRule(service.id, txnBand);

  // 2. Calculate base from transactions
  let basePrice = rule.basePrice + (params.monthlyTransactions * rule.ratePerTransaction);

  // 3. Apply LOWER complexity multiplier (Model B is more granular)
  const complexityMultiplier = getComplexityMultiplier(params.complexity, 'modelB');
  basePrice *= complexityMultiplier;

  // 4. Apply industry multiplier (same as Model A)
  const industryMultiplier = getIndustryMultiplier(params.industry);
  basePrice *= industryMultiplier;

  // 5. Fallback to Model A for turnover-only services
  if (!rule) {
    return calculateModelA(service, params);
  }

  return basePrice;
};
```

### Transaction Bands:

| Band | Monthly Transactions | Base Price | Rate/Transaction | Market Benchmark |
|------|----------------------|------------|------------------|------------------|
| Low | 0-100 | £100 | £0.50 | £100-£150/month |
| Medium | 101-300 | £150 | £0.75 | £150-£250/month |
| High | 301-500 | £250 | £1.00 | £250-£350/month |
| Very High | 501+ | £350 | £1.25 | £350+/month |

**Market Source:** src007 (Simplex £0.50-£2.00/txn), src008 (£100-£300/month)

### Complexity Multipliers (Model B - Lower):

```typescript
const COMPLEXITY_MULTIPLIERS_B = {
  clean: 0.98,       // Transaction-based already accounts for volume
  average: 1.0,
  complex: 1.08,     // Lower than Model A (1.15)
  disaster: 1.2      // Lower than Model A (1.4)
};
```

**Rationale:** Model B's per-transaction pricing already captures volume complexity.

---

## Transaction Estimation (When No Data Available)

### Formula:

```typescript
const estimateTransactions = (
  turnover: number,
  industry: string,
  vatRegistered: boolean
): number => {
  // 1. Base estimate from turnover band
  const baseEstimates = {
    "0-89k": 35,
    "90k-149k": 55,
    "150k-249k": 80,
    "250k-499k": 120,
    "500k-749k": 180,
    "750k-999k": 250,
    "1m+": 350
  };

  let estimate = baseEstimates[mapTurnoverBand(turnover)];

  // 2. Apply industry multiplier
  const industryMultipliers = {
    retail: 1.5,        // More transactions
    ecommerce: 2.0,     // High transaction volume
    construction: 0.7,  // Fewer, larger transactions
    consulting: 0.5,    // Low transaction volume
    default: 1.0
  };

  estimate *= industryMultipliers[industry] || 1.0;

  // 3. VAT registered businesses typically have more transactions
  if (vatRegistered) {
    estimate *= 1.2;
  }

  return Math.round(estimate);
};
```

**Location:** `app/server/routers/pricing.ts:589-622`

---

## Model Comparison & Recommendation Logic

### Comparison Engine:

```typescript
const compareModels = (modelA: number, modelB: number): Recommendation => {
  // 1. If no Model B data, recommend Model A
  if (!modelB) {
    return { model: 'A', reason: 'Model B data not available' };
  }

  // 2. Calculate price difference
  const difference = Math.abs(modelA - modelB);
  const percentDiff = (difference / Math.min(modelA, modelB)) * 100;

  // 3. If difference < 10%, recommend Model A (simpler to explain)
  if (percentDiff < 10) {
    return {
      model: 'A',
      reason: 'Models within 10% - turnover-based is simpler',
      savings: 0
    };
  }

  // 4. Otherwise recommend cheaper model
  if (modelB < modelA) {
    return {
      model: 'B',
      reason: 'Transaction-based pricing saves you money',
      savings: modelA - modelB,
      savingsPercent: Math.round(((modelA - modelB) / modelA) * 100)
    };
  } else {
    return {
      model: 'A',
      reason: 'Turnover-based pricing saves you money',
      savings: modelB - modelA,
      savingsPercent: Math.round(((modelB - modelA) / modelB) * 100)
    };
  }
};
```

**Location:** `app/server/routers/pricing.ts:548-587`

---

## Service-Specific Pricing

### 1. Payroll Pricing (Tiered by Employee Count)

```typescript
const calculatePayrollPrice = (employees: number, frequency: string): number => {
  // Base monthly price
  let basePrice;

  if (employees === 0 || employees <= 2) {
    basePrice = 18; // Director-only
  } else if (employees <= 5) {
    basePrice = 50;
  } else if (employees <= 10) {
    basePrice = 70;
  } else if (employees <= 15) {
    basePrice = 90;
  } else if (employees <= 20) {
    basePrice = 110;
  } else {
    basePrice = 130 + ((employees - 20) * 2); // £2 per additional employee
  }

  // Apply frequency multiplier
  const frequencyMultipliers = {
    weekly: 3,
    fortnightly: 2,
    '4weekly': 2,
    monthly: 1
  };

  return basePrice * frequencyMultipliers[frequency];
};
```

**Market Benchmark:** £4-£10/employee/month (our £18 director-only to £7/employee for larger teams is competitive)

**Location:** `app/server/routers/pricing.ts:112-132`

### 2. VAT Returns Pricing (Turnover-Based)

| Turnover Band | Quarterly Price | Annual Cost |
|---------------|-----------------|-------------|
| £0-£100k | £120 | £480 |
| £100k-£200k | £180 | £720 |
| £200k-£400k | £240 | £960 |

**Market Source:** src003 (RJ Accountancy)

### 3. Rental Properties (Per-Property Addon)

```
PRICE_PER_PROPERTY = £12-£30/year
```

**Market Source:** £30/property (RJ Accountancy), £12-£30 range (market research)

### 4. CIS Returns (Per Subcontractor)

```
CIS_MONTHLY = £30 base + (£6 × number_of_subcontractors)
```

**Market Source:** src022 (The Accountancy)

### 5. R&D Tax Credits (Percentage of Savings)

```typescript
const calculateRDFee = (savingsAchieved: number): number => {
  if (savingsAchieved <= 55000) {
    return 2750; // Fixed minimum
  } else if (savingsAchieved <= 200000) {
    return savingsAchieved * 0.05; // 5% up to £200k
  } else {
    return (200000 * 0.05) + ((savingsAchieved - 200000) * 0.025); // 2.5% above £200k
  }
};
```

**Market Source:** src017 (Tax Cloud)

---

## Surcharges (Add-Ons)

### Multi-Currency Surcharge:

```
MULTI_CURRENCY_SURCHARGE = £25/month
```

**Justification:** Additional bookkeeping complexity, exchange rate tracking

### Multi-Entity Surcharge (Group Structures):

```typescript
const MULTI_ENTITY_SURCHARGE = {
  2: 40,        // 2 entities
  "3-5": 90,    // 3-5 entities
  "6+": 150     // 6+ entities
};
```

**Justification:** Group consolidation, inter-company transactions

---

## Discounts

### Volume Discounts:

```typescript
const calculateVolumeDiscount = (monthlyTotal: number): number => {
  let discount = 0;

  if (monthlyTotal > 500) {
    discount = 0.05; // 5% over £500/month
  }

  if (monthlyTotal > 1000) {
    discount = 0.08; // Additional 3% (total 8%) over £1000/month
  }

  return discount;
};
```

**Location:** `app/server/routers/pricing.ts:189-253`

### New Client Discount:

```
NEW_CLIENT_DISCOUNT = 10% (first year)
```

**Market Practice:** Common for acquisition, builds loyalty

### Annual Payment Discount (Recommended - DEC-003):

```
ANNUAL_PAYMENT_DISCOUNT = 10% (if paid annually)
```

**Justification:** Improves cash flow, industry standard

### Rush Fee (Premium):

```
RUSH_FEE = +25% (for expedited service)
```

**Justification:** Opportunity cost, prioritization

---

## Rounding Rules (DEC-004)

### Recommended: Round to Nearest £5

```typescript
const roundToNearest5 = (price: number): number => {
  return Math.round(price / 5) * 5;
};

// Examples:
// £127.42 → £125
// £127.50 → £130 (round up on tie)
// £128.99 → £130
```

**Justification:**
- Clean pricing (easier to remember)
- Industry standard for monthly fees
- Minimal revenue impact

---

## Minimum Engagement (DEC-005)

### Recommended Minimum:

```
MINIMUM_MONTHLY_FEE = £60
```

**Exceptions:**
- Dormant companies: £0 (free via WebFiling) to £99 (service provider)
- One-off services: No minimum

**Justification:**
- Market median for solo directors: £60-£100/month
- Covers basic compliance costs
- Allows small client acquisition while ensuring profitability

---

## Tiered Package Model (Alternative to Dual-Model)

### Option: Pre-Defined Packages (DEC-002 Alternative C)

| Tier | Monthly Price | Annual Price | Services Included |
|------|---------------|--------------|-------------------|
| **Essentials** | £60-£80 | £720-£960 | Annual Accounts, CT, 1 Director SATR |
| **Standard** | £100-£150 | £1,200-£1,800 | Essentials + Payroll (1-5), VAT Returns |
| **Plus** | £200-£300 | £2,400-£3,600 | Standard + Bookkeeping, Management Accounts |

**Market Alignment:**
- Essentials: Solo directors, no employees (60% of market)
- Standard: Small teams (30% of market)
- Plus: Growing businesses with advisory needs (10% of market)

**Trade-Off:** Simpler to market but less flexible than dual-model.

---

## Example Calculations

### Example 1: Solo Director, Clean Books

**Inputs:**
- Turnover: £45,000
- Employees: 0
- VAT Registered: No
- Complexity: Clean
- Industry: Consulting (simple)

**Model A Calculation:**
```
Turnover band: £0-£89k
Base price (Annual Accounts): £600
Complexity: 0.95
Industry: 0.95
Final: £600 × 0.95 × 0.95 = £541.50 → rounds to £540/year (£45/month)
```

**Model B:** Not enough transactions, fallback to Model A

**Recommendation:** Model A - Turnover-Based @ £540/year

---

### Example 2: Ecommerce Business, High Transactions

**Inputs:**
- Turnover: £150,000
- Monthly Transactions: 400
- Employees: 2
- VAT Registered: Yes
- Complexity: Average
- Industry: Ecommerce (complex)

**Model A Calculation:**
```
Turnover band: £150k-£249k
Base price (Annual Accounts): £840
Complexity: 1.0
Industry: 1.15
Annual Accounts: £840 × 1.0 × 1.15 = £966/year

VAT Returns (quarterly): £180 × 4 = £720/year
Payroll (director only): £18 × 12 = £216/year

Total Model A: £1,902/year (£158.50/month) → rounds to £160/month
```

**Model B Calculation:**
```
Bookkeeping (transaction-based):
Base: £250 (301-500 band)
Transactions: 400 × £1.00 = £400
Monthly: £250 + £150 (for 150 txn over 250 base) = £400 × 1.0 × 1.15 = £460/month

Annual: £5,520 (bookkeeping) + £966 (accounts) + £720 (VAT) + £216 (payroll) = £7,422/year (£618.50/month)
```

**Comparison:** Model A (£160/month) vs Model B (£618/month)

**Recommendation:** Model A - Turnover-Based saves £458/month (74% savings!)

**Reason:** Transaction-based pricing not cost-effective for this transaction volume at this turnover.

---

## Implementation Notes

1. **Feature Flags:** Use `pricing.modelB.enabled` flag for staged rollout (DEC-010)
2. **Audit Trail:** Log all pricing calculations for transparency
3. **Override Capability:** Staff can manually adjust prices (with justification)
4. **Testing:** Unit tests for each formula component (see `50-test-plan.md`)
5. **Performance:** Cache pricing rules in Redis for <50ms response times

---

## Future Enhancements

1. **Machine Learning:** Predict optimal model based on historical data
2. **Dynamic Pricing:** Adjust for market demand, capacity
3. **Client Lifetime Value:** Factor in retention probability
4. **Competitor Tracking:** Auto-adjust to market shifts

---

**End of Pricing Model**
