# Data Quality Report - Market Research

**Generated:** [DATE]
**Dataset:** 21-market-data.csv ([N] sources, [N] observations)
**Purpose:** Comprehensive data quality audit

---

## Executive Summary

- ✅ **Completeness:** Required fields [X]% complete
- ✅ **Outliers:** [X] observations excluded via IQR fences
- ✅ **Geographic distribution:** Quotas [MET/NOT MET]
- ✅ **Credibility:** Average score [X]/5 (target: ≥4.0)
- ⚠️ **Low evidence cells:** [X] cells with n<3

---

## 1. Completeness Analysis

### Required Fields (Must be 100%)
| Field | Complete % | Nulls | Notes |
|-------|-----------|-------|-------|
| source_id | TBD% | TBD | [Notes] |
| service_code | TBD% | TBD | [Notes] |
| observed_price_value | TBD% | TBD | [Notes] |
| frequency | TBD% | TBD | [Notes] |
| turnover_band OR driver | TBD% | TBD | [Notes] |

### Optional Fields (Acceptable nulls)
| Field | Complete % | Nulls | Target | Status |
|-------|-----------|-------|--------|--------|
| entity_type | TBD% | TBD | ≥40% | [PASS/FAIL] |
| service_level (bookkeeping) | TBD% | TBD | ≥70% | [PASS/FAIL] |
| complexity_tier | TBD% | TBD | ≥30% | [PASS/FAIL] |
| bank_accounts | TBD% | TBD | ≥20% | [PASS/FAIL] |
| scope_inclusions | TBD% | TBD | ≥50% | [PASS/FAIL] |

---

## 2. Outlier Analysis (IQR Method)

### Methodology
```
Q1 = 25th percentile
Q3 = 75th percentile
IQR = Q3 - Q1
Lower Fence = Q1 - (1.5 × IQR)
Upper Fence = Q3 + (1.5 × IQR)
```

Observations outside fences are flagged as outliers and reviewed for:
- Data entry errors
- Scope mismatches (bundled services)
- Promotional pricing (unsustainable)
- Premium positioning (legitimate high-end)

### Outliers Detected by Service

#### Annual Accounts + CT600 (£150-249k band, ltd, average complexity)
- **IQR:** Q1=£TBD, Q3=£TBD, IQR=£TBD
- **Fences:** Lower=£TBD, Upper=£TBD
- **Outliers detected:** [N] observations

| source_id | Price | Reason | Action |
|-----------|-------|--------|--------|
| srcXXX | £X,XXX | [Reason] | [EXCLUDED/FLAGGED/KEPT] |

#### Bookkeeping Full (tx_02: 101-300 txn/mo, ltd, average complexity)
- **IQR:** Q1=£TBD, Q3=£TBD, IQR=£TBD
- **Fences:** Lower=£TBD, Upper=£TBD
- **Outliers detected:** [N] observations

| source_id | Price | Reason | Action |
|-----------|-------|--------|--------|
| srcXXX | £X,XXX | [Reason] | [EXCLUDED/FLAGGED/KEPT] |

### Summary
- **Total outliers detected:** [N] observations ([X]% of dataset)
- **Excluded:** [N] observations (data errors, scope mismatches)
- **Flagged for review:** [N] observations (manual verification needed)
- **Kept:** [N] observations (legitimate high-end/low-end pricing)

---

## 3. Low-Evidence Cells (n<3)

### Entity_type × Complexity_tier Gaps
| Service | Entity Type | Complexity | Turnover/Tx Band | n | Action |
|---------|-------------|------------|------------------|---|--------|
| [Service] | CIC | [Tier] | [Band] | 0-2 | [Action/Assumption] |

### Recommended Actions
1. **CIC (Community Interest Companies):** [N] observations total
   - **Action:** Use ltd pricing + 10-15% premium assumption (flag as "DECISION NEEDED" in 60-decisions.md)

2. **LLP × disaster complexity × high turnover:** [N] observations
   - **Action:** Interpolate from adjacent cells + flag for Phase 2 validation

3. **Specialist services:** [List services with n<3]
   - **Action:** Flag as "LOW EVIDENCE" in all schedule CSVs

---

## 4. Network De-Duplication

### Franchises & Networks Identified
| Network | Locations Sampled | Location Kept | De-duped Count | Rationale |
|---------|-------------------|---------------|----------------|-----------|
| TaxAssist | TBD | [City] | TBD | Standardized franchise pricing |
| [Network 2] | TBD | [City] | TBD | [Rationale] |

**Total de-duplicated:** [N] observations (treated as 1 network per franchise)

---

## 5. Brand De-Duplication

### Duplicate Brands Found
| Brand | Occurrences | URLs | Resolution |
|-------|-------------|------|------------|
| [If any duplicates found, list here] | - | - | - |

**Result:** [N] duplicates found and merged

---

## 6. Geographic Distribution

### Target Quotas
- ✅ **England:** ≥50 sources
  - London/SE: ≥15
  - Midlands: ≥10
  - North: ≥15
  - South West: ≥10
- ✅ **Scotland:** ≥8 sources
- ✅ **Wales:** ≥5 sources
- ✅ **Northern Ireland:** ≥4 sources
- ✅ **National/Online:** ≥30 sources

### Actual Distribution
| Region | Count | % of Total | Quota | Status |
|--------|-------|------------|-------|--------|
| England_London | TBD | TBD% | ≥15 | [PASS/FAIL] |
| England_Midlands | TBD | TBD% | ≥10 | [PASS/FAIL] |
| England_North | TBD | TBD% | ≥15 | [PASS/FAIL] |
| England_SW | TBD | TBD% | ≥10 | [PASS/FAIL] |
| Scotland | TBD | TBD% | ≥8 | [PASS/FAIL] |
| Wales | TBD | TBD% | ≥5 | [PASS/FAIL] |
| NI | TBD | TBD% | ≥4 | [PASS/FAIL] |
| National | TBD | TBD% | ≥30 | [PASS/FAIL] |
| **TOTAL** | **TBD** | **100%** | **≥100** | **[PASS/FAIL]** |

---

## 7. Segment Distribution

### Target Quotas
- ✅ **Solo/Micro practices:** ≥20
- ✅ **Local/Regional SME firms:** ≥25
- ✅ **Digital-first/online:** ≥15
- ✅ **Networks/Franchises:** ≥10 unique networks
- ✅ **Mid-range transparent firms:** ≥10
- ✅ **Specialist firms:** ≥15

### Actual Distribution
| Segment | Count | % of Total | Quota | Status |
|---------|-------|------------|-------|--------|
| solo | TBD | TBD% | ≥20 | [PASS/FAIL] |
| regional_sme | TBD | TBD% | ≥25 | [PASS/FAIL] |
| digital_first | TBD | TBD% | ≥15 | [PASS/FAIL] |
| network | TBD | TBD% | ≥10 | [PASS/FAIL] |
| midrange | TBD | TBD% | ≥10 | [PASS/FAIL] |
| specialist | TBD | TBD% | ≥15 | [PASS/FAIL] |
| **TOTAL** | **TBD** | **100%** | **≥100** | **[PASS/FAIL]** |

---

## 8. Credibility Score Distribution

### Target: Average ≥4.0/5

| Credibility Level | Count | % of Total | Description |
|-------------------|-------|------------|-------------|
| Excellent (5) | TBD | TBD% | Detailed published schedules with turnover bands |
| Good (4) | TBD | TBD% | Clear fee ranges with reasonable detail |
| Fair (3) | TBD | TBD% | Indicative pricing, some ambiguity |
| Limited (2) | TBD | TBD% | Partial pricing, many gaps |
| Poor (1) | TBD | TBD% | Vague "from £X" with no context |

**Average Credibility:** **TBD** / 5 (target: ≥4.0) - **[PASS/FAIL]**

---

## 9. Service Level Classification (Bookkeeping)

### Target: ≥70% classified (≤30% unspecified)

| Classification | Count | % of Bookkeeping Observations | Description |
|----------------|-------|------------------------------|-------------|
| Basic (cash-coding) | TBD | TBD% | Xero/QB cash-coding only, bank feeds, no invoice posting |
| Full (invoice posting) | TBD | TBD% | Invoice-level bookkeeping, debtor/creditor, reconciliations |
| Unspecified | TBD | TBD% | Unclear from source material |

**Classification Rate:** **TBD%** (target: ≥70%) - **[PASS/FAIL]**

---

## 10. Entity Type Coverage

### Target: Sufficient observations per entity type

| Entity Type | Count | % of Total | Status |
|-------------|-------|------------|--------|
| Limited Company (ltd) | TBD | TBD% | [PASS/FAIL - expect ≥60%] |
| Sole Trader | TBD | TBD% | [PASS/FAIL - expect ≥20%] |
| Partnership | TBD | TBD% | [PASS/FAIL - expect ≥10%] |
| LLP | TBD | TBD% | [PASS/FAIL - expect ≥5%] |
| CIC | TBD | TBD% | [LOW EVIDENCE OK if n<5] |
| Unspecified | TBD | TBD% | [Acceptable ≤40%] |

---

## 11. Data Validation Errors

### Schema Compliance
- [ ] All prices numeric and ≥0
- [ ] All turnover/transaction bands match standard definitions
- [ ] All service_codes exist in 10-service-inventory.md
- [ ] All entity_type values in valid enum
- [ ] All frequency values in valid enum
- [ ] All region values in valid enum
- [ ] All segment values in valid enum

### Errors Found
| Row | Field | Error | Resolution |
|-----|-------|-------|------------|
| [If any errors, list here] | - | - | - |

---

## 12. Recommendations

### Phase 1 (Immediate)
1. ✅ Dataset ready for production use: **[YES/NO]**
2. ⚠️ Low evidence cells: **[N] cells** - flagged in 60-decisions.md
3. ⚠️ CIC/LLP coverage: **Expand in Phase 2** if insufficient

### Phase 2 (Future Improvement)
4. ⚠️ Re-visit [X]% unspecified bookkeeping service levels (contact firms for clarification)
5. ⚠️ Expand specialist service coverage (R&D, IR35, Virtual FD)
6. ⚠️ Validate entity type multipliers with larger sample (especially CIC)

---

## 13. Approval

**Quality Gate:** [PASS/FAIL]

**Sign-off:**
- Data Quality Review: [NAME] - [DATE]
- Technical Approval: [NAME] - [DATE]
- Business Approval: [NAME] - [DATE]

---

## Appendix: IQR Calculation Examples

[Include detailed IQR calculations for top 3 services as reference]
