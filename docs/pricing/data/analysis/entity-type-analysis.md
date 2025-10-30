# Entity Type Pricing Analysis

**Generated:** [DATE]
**Dataset:** 21-market-data.csv ([N] sources, [N] observations with entity_type)
**Purpose:** Determine if UK accountancy market prices services differently by entity type

---

## Executive Summary

- **Entity type IS a pricing driver:** [YES/NO] for [services list]
- **Entity type is NOT a pricing driver:** [YES/NO] for [services list]
- **Recommended entity multipliers:** [summary]
- **Low evidence flags:** [CIC, LLP, etc. if n<5]

---

## Objective

Determine if UK accountancy market prices services differently by entity type:
- `sole_trader` - Sole traders / Self-employed
- `partnership` - Traditional partnerships
- `ltd` - Private limited companies
- `llp` - Limited liability partnerships
- `cic` - Community interest companies

---

## Hypothesis

- **Sole traders:** Lower pricing (simpler compliance, SATR only, no company accounts)
- **Limited companies:** Higher pricing (Annual Accounts + CT600 + more complexity)
- **Partnerships:** Mid-range (Partnership Tax Return more complex than SATR)
- **LLPs:** Similar to partnerships with slight premium (partnership accounting + company filing)
- **CICs:** Premium pricing (additional compliance burden: community interest report, asset lock)

---

## Methodology

1. Filter market data for observations with `entity_type != NULL`
2. Group by `service_code × entity_type × turnover_band`
3. Calculate median price for each group
4. Compute delta vs baseline (ltd = 1.0x)
5. Statistical significance test (t-test, p<0.05 threshold)
6. Apply LOW EVIDENCE flag if n<5 per cell

---

## Findings

### 1. Annual Accounts + CT600

#### Data Summary
| Entity Type | Turnover Band | Median Price | Delta vs Ltd | n | p-value | Statistically Significant? |
|-------------|---------------|--------------|--------------|---|---------|----------------------------|
| Sole Trader | £150-249k | £0 (N/A) | -100% | 0 | - | N/A - service not applicable |
| Partnership | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Ltd         | £150-249k | £TBD | baseline | TBD | - | - |
| LLP         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| CIC         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO - flag if n<5] |

#### Interpretation
[Analysis of findings for Annual Accounts]

#### Recommendation
**Entity Type Multipliers for COMP_ACCOUNTS:**
- `sole_trader`: 0 (N/A - service not applicable)
- `partnership`: TBD (TBD% delta, [significant/not significant])
- `ltd`: 1.0 (baseline)
- `llp`: TBD (TBD% delta, [significant/not significant])
- `cic`: TBD (TBD% delta, [LOW EVIDENCE if n<5])

---

### 2. Self-Assessment Tax Return (SATR) / Partnership Tax Return

#### Data Summary
| Entity Type | Turnover Band | Median Price | Delta vs Sole Trader | n | p-value | Significant? |
|-------------|---------------|--------------|----------------------|---|---------|--------------|
| Sole Trader | £150-249k | £TBD | baseline | TBD | - | - |
| Partnership | £150-249k | £TBD (Partnership Return) | TBD% | TBD | TBD | [YES/NO] |
| Ltd         | £150-249k | N/A (use CT600) | - | 0 | - | - |
| LLP         | £150-249k | N/A (use CT600) | - | 0 | - | - |
| CIC         | £150-249k | N/A (use CT600) | - | 0 | - | - |

#### Interpretation
[Analysis of Partnership Tax Return premium vs sole trader SATR]

#### Recommendation
**Entity Type Multipliers for SATR_SINGLE:**
- `sole_trader`: 1.0 (baseline)
- `partnership`: TBD (Partnership Tax Return pricing)
- `ltd`: 0 (N/A - use CT600)
- `llp`: 0 (N/A - use CT600)
- `cic`: 0 (N/A - use CT600)

---

### 3. Bookkeeping (Model A - Turnover-Based)

#### Data Summary - Full Service
| Entity Type | Turnover Band | Median Price | Delta vs Ltd | n | p-value | Significant? |
|-------------|---------------|--------------|--------------|---|---------|--------------|
| Sole Trader | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Partnership | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Ltd         | £150-249k | £TBD | baseline | TBD | - | - |
| LLP         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| CIC         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |

#### Data Summary - Basic Service
| Entity Type | Turnover Band | Median Price | Delta vs Ltd | n | p-value | Significant? |
|-------------|---------------|--------------|--------------|---|---------|--------------|
| [Repeat for Basic bookkeeping] | - | - | - | - | - | - |

#### Interpretation
[Analysis - hypothesis: entity type NOT a pricing driver for bookkeeping; complexity and transaction count are stronger drivers]

#### Recommendation
**Entity Type Multipliers for BOOK_BASIC / BOOK_FULL:**
- All entity types: 1.0 (no differential pricing observed)
- **Rationale:** Bookkeeping pricing driven by transaction volume and complexity, not legal structure

---

### 4. VAT Returns

#### Data Summary
| Entity Type | Turnover Band | Median Price | Delta vs Ltd | n | p-value | Significant? |
|-------------|---------------|--------------|--------------|---|---------|--------------|
| Sole Trader | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Partnership | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Ltd         | £150-249k | £TBD | baseline | TBD | - | - |
| LLP         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |
| CIC         | £150-249k | £TBD | TBD% | TBD | TBD | [YES/NO] |

#### Recommendation
[TBD based on findings]

---

### 5. Payroll Services

#### Data Summary
| Entity Type | Employee Band | Median Price | Delta vs Ltd | n | p-value | Significant? |
|-------------|---------------|--------------|--------------|---|---------|--------------|
| Sole Trader | 1-5 employees | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Partnership | 1-5 employees | £TBD | TBD% | TBD | TBD | [YES/NO] |
| Ltd         | 1-5 employees | £TBD | baseline | TBD | - | - |
| LLP         | 1-5 employees | £TBD | TBD% | TBD | TBD | [YES/NO] |
| CIC         | 1-5 employees | £TBD | TBD% | TBD | TBD | [YES/NO] |

#### Recommendation
[TBD based on findings]

---

### 6. Company Secretarial Services

#### Data Summary
| Entity Type | Service Tier | Median Price | Notes | n |
|-------------|--------------|--------------|-------|---|
| Sole Trader | SEC_BASIC | N/A | Not applicable (no company) | 0 |
| Partnership | SEC_BASIC | N/A | Not applicable (no company) | 0 |
| Ltd         | SEC_BASIC | £TBD | Confirmation statement, basic compliance | TBD |
| LLP         | SEC_BASIC | £TBD | LLP equivalent services | TBD |
| CIC         | SEC_BASIC | £TBD | CIC-specific compliance requirements | TBD |

#### Recommendation
**Entity Type Multipliers for SEC_BASIC:**
- `sole_trader`: 0 (N/A)
- `partnership`: 0 (N/A)
- `ltd`: 1.0 (baseline)
- `llp`: TBD (based on findings)
- `cic`: TBD (expect 1.1-1.15x premium for additional CIC compliance)

---

## Overall Recommendations

### Implement Entity Type Multipliers (Phase 1)

```typescript
const entityTypeMultipliers: Record<string, Record<string, number>> = {
  // Compliance services (Annual Accounts, CT600)
  COMP_ACCOUNTS: {
    sole_trader: 0,    // N/A
    partnership: TBD,  // [Based on findings]
    ltd: 1.0,          // Baseline
    llp: TBD,          // [Based on findings]
    cic: TBD,          // [Based on findings, flag if LOW EVIDENCE]
  },

  // Self-Assessment / Partnership Returns
  SATR_SINGLE: {
    sole_trader: 1.0,  // Baseline
    partnership: TBD,  // Partnership Tax Return premium
    ltd: 0,            // N/A
    llp: 0,            // N/A
    cic: 0,            // N/A
  },

  // Bookkeeping (hypothesis: no entity multipliers)
  BOOK_BASIC: {
    sole_trader: 1.0,
    partnership: 1.0,
    ltd: 1.0,
    llp: 1.0,
    cic: 1.0,
  },

  BOOK_FULL: {
    sole_trader: 1.0,
    partnership: 1.0,
    ltd: 1.0,
    llp: 1.0,
    cic: 1.0,
  },

  // VAT Returns
  VAT_RETURNS: {
    sole_trader: TBD,  // [Based on findings]
    partnership: TBD,
    ltd: 1.0,
    llp: TBD,
    cic: TBD,
  },

  // Payroll
  PAYROLL_STANDARD: {
    sole_trader: TBD,  // [Based on findings]
    partnership: TBD,
    ltd: 1.0,
    llp: TBD,
    cic: TBD,
  },

  // Secretarial services (ltd/llp/cic only)
  SEC_BASIC: {
    sole_trader: 0,    // N/A
    partnership: 0,    // N/A
    ltd: 1.0,
    llp: TBD,          // [Based on findings]
    cic: TBD,          // Expect 1.1-1.15x premium
  },
};
```

---

## Low Evidence Flags

### Services with n<5 per entity type
[List services/entity combinations with insufficient data]

**CIC Pricing:**
- Total CIC observations: [N]
- **Action:** If n<5 total, apply assumption-based multipliers (1.10-1.15x for compliance services) and flag for Phase 2 validation

**LLP Pricing:**
- Total LLP observations: [N]
- **Action:** If n<5 per service, note as "marginal significance" and flag for Phase 2 validation

---

## Phase 2 Validation (Future)

1. **CIC pricing:** Expand sample size in Phase 2. Contact CIC-specialist accountants for detailed pricing.
2. **LLP vs Ltd:** If only marginal significance (p=0.05-0.10), re-validate with larger sample.
3. **Partnership complexity test:** Investigate if partnership *complexity* (multiple partners, profit-sharing arrangements) drives price, not entity type alone.
4. **Micro turnover bands:** Test if entity type matters more at lower turnover levels (<£100k).

---

## Statistical Notes

### T-Test Assumptions
- **Null hypothesis (H0):** Mean price for entity type X = mean price for baseline (ltd)
- **Alternative hypothesis (H1):** Mean price for entity type X ≠ mean price for baseline
- **Significance level:** p<0.05
- **Test:** Two-sample t-test (assuming unequal variances)

### Sample Size Requirements
- **Minimum n=5 per cell** for reliable t-test
- **n<5:** Flag as LOW EVIDENCE, use assumption-based multipliers

---

## Conclusion

✅ **Entity type IS a pricing driver** for: [Service list]
❌ **Entity type is NOT a pricing driver** for: [Service list]
⚠️ **Insufficient evidence** for: [Service/entity combinations with n<5]

**Action:** Implement service-specific entity type multipliers as recommended above.

**Next Steps:**
1. Code entity type multiplier function in `app/server/routers/pricing.ts`
2. Update `22-mappings.json` with entity type rules
3. Add entity type field to lead capture form
4. Update pricing DSL with entity type primitive
