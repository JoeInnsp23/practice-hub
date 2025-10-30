# Pricing Reconciliation Report

**Generated:** [DATE]
**Dataset:** 21-market-data.csv ([N] sources, [N] observations)
**Purpose:** Variance analysis between recommended prices and market statistics

---

## Executive Summary

- **Within ±5% of p50:** __% of cells (target: ≥90%)
- **Outliers (>10% variance):** __ cells (flagged for review)
- **Low evidence (n<3):** __ cells (see Decisions section)

---

## Model A - Bookkeeping Basic (ltd, average complexity)

| Turnover Band | Recommended | p25 | p50 | p75 | Variance % | Guardrails Applied | n |
|---------------|-------------|-----|-----|-----|------------|-------------------|---|
| £0-49k        | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £50-99k       | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £100-149k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £150-249k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £250-349k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £350-449k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £450-649k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £650-849k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £850-999k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £1m+          | Manual      | -   | -   | -   | -          | -                 | -   |

---

## Model A - Bookkeeping Full (ltd, average complexity)

| Turnover Band | Recommended | p25 | p50 | p75 | Variance % | Guardrails Applied | n |
|---------------|-------------|-----|-----|-----|------------|-------------------|---|
| £0-49k        | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £50-99k       | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £100-149k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £150-249k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £250-349k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £350-449k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £450-649k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £650-849k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £850-999k     | TBD         | TBD | TBD | TBD | TBD        | TBD               | TBD |
| £1m+          | Manual      | -   | -   | -   | -          | -                 | -   |

---

## Model A - All Other Services

### Annual Accounts + CT600 (ltd, average complexity)

| Turnover Band | Recommended | p25 | p50 | p75 | Variance % | n |
|---------------|-------------|-----|-----|-----|------------|---|
| TBD           | TBD         | TBD | TBD | TBD | TBD        | TBD |

### VAT Returns (ltd, average complexity)

| Turnover Band | Recommended | p25 | p50 | p75 | Variance % | n |
|---------------|-------------|-----|-----|-----|------------|---|
| TBD           | TBD         | TBD | TBD | TBD | TBD        | TBD |

### Payroll (monthly frequency)

| Employee Band | Recommended | p25 | p50 | p75 | Variance % | n |
|---------------|-------------|-----|-----|-----|------------|---|
| TBD           | TBD         | TBD | TBD | TBD | TBD        | TBD |

---

## Model B - Transaction-Based Pricing

### Bookkeeping Basic (ltd, average complexity)

| Tx Band | Base Recommended | Base p50 | Per-Tx Recommended | Per-Tx p50 | Variance % | n |
|---------|------------------|----------|--------------------|------------|------------|---|
| 0-100   | TBD              | TBD      | TBD                | TBD        | TBD        | TBD |
| 101-300 | TBD              | TBD      | TBD                | TBD        | TBD        | TBD |
| 301-500 | TBD              | TBD      | TBD                | TBD        | TBD        | TBD |
| 501+    | Manual           | -        | -                  | -          | -          | -   |

---

## Variance Summary

### High Variance Cells (>10%)
[List cells with variance >10%, with explanation and review status]

### Low Evidence Cells (n<3)
[List cells with n<3, flagged in 60-decisions.md as "DECISION NEEDED"]

---

## Guardrails Applied

### Rounding to £5
- **Applied to:** __% of cells
- **Average adjustment:** £__ per cell

### Minimum Engagement £60/month
- **Applied to:** __ cells (micro turnover bands only)
- **Services affected:** [List]

### Upper Fence Clamp (p75)
- **Applied to:** __ cells (prevented overpricing)
- **Average adjustment:** -£__ per cell

---

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## Methodology

**Recommendation Algorithm:**
```
exact_fee = round_to_£5(clamp(p50, lower=max(p25, £60), upper=p75))
```

**Quality Gates:**
- N ≥ 3 sources per cell (or flagged as LOW EVIDENCE)
- Outliers removed via IQR fences before calculating p25/p50/p75
- All prices normalized to monthly ex-VAT
