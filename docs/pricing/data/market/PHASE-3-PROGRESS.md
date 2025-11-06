# UK Pricing Research - Phase 3 Progress Report

**Status:** Data Collection In Progress
**Date:** 2025-01-05
**Branch:** feature/ui-ux-polish-phase-2

---

## Progress Summary

**Target:** 1,000+ observations from 75-100 UK firms
**Current:** 303 observations from 19 firms (30% complete)

### Observations by Batch

| Batch | Firms | Observations | Status |
|-------|-------|--------------|--------|
| Batch 1 | 4 | 57 | ✅ Complete |
| Batch 2 | 3 | 64 | ✅ Complete |
| Batch 3 | 3 | 70 | ✅ Complete |
| Batch 4 | 3 | 52 | ✅ Complete |
| Batch 5 | 1 | 20 | ✅ Complete |
| Batch 6 | 1 | 40 | ✅ Complete |
| **Total** | **19** | **303** | **30%** |

### Data Quality Distribution

| Grade | Count | % | Description |
|-------|-------|---|-------------|
| A (Exact) | 288 | 95% | Exact prices stated |
| B (Bounded) | 13 | 4% | Bounded ranges with clear drivers |
| C (Estimated) | 2 | 1% | Estimated or "from £X" |

---

## Distribution Analysis (Current State)

### Entity Types
- Ltd companies: 179 obs (59%)
- Sole traders: 73 obs (24%)
- Partnerships: 28 obs (9%)
- LLPs: 21 obs (7%)
- CICs: 2 obs (0.7%) ← **CRITICAL GAP**

### Turnover Bands
- **0-49k:** 38 obs (13%)
- **50-99k:** 47 obs (16%)
- **100-149k:** 161 obs (53%) ← **SEVERELY OVERWEIGHTED**
- **150-199k:** 13 obs (4%)
- **200-249k:** 6 obs (2%) ← **CRITICAL GAP**
- **250-299k:** 13 obs (4%)
- **300-399k:** 3 obs (1%) ← **CRITICAL GAP**
- **400-499k:** 3 obs (1%) ← **CRITICAL GAP**
- **500-599k:** 13 obs (4%)
- **600-749k:** 2 obs (0.7%) ← **CRITICAL GAP**
- **750-999k:** 0 obs (0%) ← **CRITICAL GAP**
- **1.0-1.49m:** 4 obs (1%) ← **CRITICAL GAP**
- **1.5m+:** 0 obs (0%) ← **CRITICAL GAP**

### Service Categories
**Well-Covered:**
- COMP_ACCOUNTS: 64 obs
- COMP_SATR: 42 obs
- VAT_QTR: 18 obs
- PAYROLL_RUN: 16 obs

**Under-Represented:**
- Advisory services: 6 obs ← **CRITICAL GAP**
- Model B (transaction-based): 0 obs ← **MARKET REALITY: Not commonly published**

---

## Market Intelligence from Research

### Finding 1: CIC Specialist Pricing
**Observation:** After exhaustive web research (45+ searches), CIC-specific pricing is rarely published by UK accountancy firms.

**Reasons:**
- CICs are served by generalist firms, not dedicated CIC specialists
- Pricing is typically bespoke/quote-based for complex structures
- Market is fragmented without standardized pricing

**Implication:** CIC observations will remain limited unless we conduct primary research (surveys/interviews)

### Finding 2: Model B (Transaction-Based) Pricing
**Observation:** Transaction-based pricing models are NOT a standard industry model in UK accounting.

**Reasons:**
- UK accountants price for judgment/relationship, not transaction volume
- Fixed retainers (Model A) dominate the market
- Hourly billing (Model C) used for advisory work
- Per-transaction billing mainly exists in bookkeeping software, not accountancy services

**Implication:** Model B observations unlikely to reach statistically significant levels from published pricing

### Finding 3: High-Turnover Band Pricing
**Observation:** Firms serving £300k-£2m+ businesses exist but often use "contact for quote" rather than published pricing.

**Opportunity:** Top 50-100 UK firms, regional mid-tier practices, and sector specialists (property, construction, professional services) do publish pricing in this range.

---

## Next Steps (Batches 7-20+)

### Immediate Priority: High-Turnover Bands (300k-2m)
**Target:** 200+ observations to balance the 100-149k overweight

**Strategy:**
1. Research top 50-100 UK accountancy firms with published pricing
2. Target sector specialists (property, construction, professional services) with high-turnover clients
3. Regional mid-tier firms (Scotland, Wales, Northern England, Midlands)
4. Use WebSearch + WebFetch for real published pricing only

### Secondary Priority: Fill 200-249k, 250-299k Gaps
**Target:** 60+ observations

**Strategy:**
1. Mid-size regional firms
2. Franchise networks (expand beyond GoForma, TaxAssist)
3. Online accounting services with transparent pricing tiers

### Tertiary Priority: Entity Type Diversity
**Target:** Balance ltd/sole trader dominance

**Strategy:**
1. Partnership-focused firms
2. Professional services accountants (law firms, medical practices)
3. LLP specialists (already improved with Batch 6)

### Ongoing: Regional Diversity
**Target:** Ensure geographic spread

**Strategy:**
1. Scotland, Wales, Northern Ireland coverage
2. Regional city focus (Manchester, Leeds, Birmingham, Edinburgh, Cardiff, etc.)
3. Rural vs urban pricing differences

---

## Realistic Targets (Revised)

### Phase 3 Completion Criteria
- **Minimum:** 800 observations from 60+ firms
- **Target:** 1,000 observations from 75 firms
- **Stretch:** 1,200+ observations from 90 firms

### Expected Distribution Goals
**Turnover Bands (Target %):**
- 0-99k: 20-25%
- 100-199k: 25-30%
- 200-399k: 20-25%
- 400-749k: 15-20%
- 750k-2m+: 10-15%

**Entity Types (Target %):**
- Ltd: 50-60%
- Sole trader: 20-25%
- Partnership: 10-15%
- LLP: 10-15%
- CIC: 2-5% (acknowledging market constraint)

**Service Coverage:**
- Compliance services: Well covered
- Bookkeeping: Need 50+ more observations
- Payroll: Need 30+ more observations
- VAT: Well covered
- Advisory: Need 40+ observations
- Management accounts: Need 30+ observations

---

## Quality Assurance: Phase 4a Planning

### Verification Audit Scope
1. **Source Verification:** Validate all 19 source URLs are live and contain pricing
2. **Data Integrity:** Cross-check observation data matches source claims
3. **Normalization Accuracy:** Verify annual→monthly, inc-VAT→ex-VAT calculations
4. **Schema Compliance:** Ensure all 303 observations meet data quality standards
5. **Duplicate Detection:** Check for any duplicate observations across batches

### Audit Deliverable
- Verification report documenting:
  - URLs checked (live/broken)
  - Data accuracy score per source
  - Any corrections made
  - Confidence level in dataset integrity

---

## Files

**Batch Data Files:**
- `batch1-crunch.csv` (18 obs)
- `batch1-inniaccounts.csv` (18 obs)
- `batch1-anna.csv` (15 obs)
- `batch1-1stformations.csv` (6 obs)
- `batch2-goforma.csv` (24 obs)
- `batch2-penneys.csv` (20 obs)
- `batch2-1stcloud.csv` (20 obs)
- `batch3-rj-accountancy.csv` (31 obs)
- `batch3-accrue.csv` (21 obs)
- `batch3-coconut.csv` (18 obs)
- `batch4-online-accountants.csv` (19 obs)
- `batch4-xcountant.csv` (15 obs)
- `batch4-quick-tax.csv` (18 obs)
- `batch5-doshi.csv` (20 obs)
- `batch6-theaccountancy-llp.csv` (40 obs)

**Consolidated:**
- `21-market-data.csv` (303 observations + header = 304 lines)
- `sources.json` (23 registered sources, 19 with extracted data)

---

**Status:** ✅ Phase 3 proceeding with realistic market constraints documented
**Next Milestone:** 500 observations (50% of target)
**Estimated Additional Effort:** 20-30 hours of focused web research across Batches 7-20
