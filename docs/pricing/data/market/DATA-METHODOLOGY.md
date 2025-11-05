# UK Pricing Research - Data Methodology & Sample Framework

**Status:** Research Phase 1-2 Complete (Framework & Sample)
**Date:** 2025-01-05
**Purpose:** Establish data structure, methodology, and representative sample for UK accountancy pricing research

---

## Overview

This directory contains the foundational research framework for Practice Hub's UK pricing intelligence system. Phase 1-2 deliverables include:

1. **Competitor catalog** (90 firms across all UK regions/segments)
2. **Software platform catalog** (18 platforms)
3. **Data structure & methodology** (schemas, classification rules, normalization)
4. **Representative sample** (100 observations demonstrating structure)

---

## Data Files

### Core Research Data

| File | Purpose | Status | Row Count |
|------|---------|--------|-----------|
| `38-competitor-catalog.csv` | 90 UK accountancy firms | ✅ Complete | 90 |
| `software-catalog.csv` | 18 practice/pricing platforms | ✅ Complete | 18 |
| `sources.json` | Source registry with credibility scores | ✅ Sample (10) | 10 |
| `21-market-data-SAMPLE.csv` | Pricing observations (sample) | ✅ Framework | 100 |
| `source-inventory.md` | Research methodology log | ✅ Complete | - |
| `RESEARCH-REPORT.md` | Comprehensive Phase 1 analysis | ✅ Complete | - |

### Target for Full Implementation

To achieve production-ready pricing schedules, the full dataset should contain:

- **≥1,000 observations** in `21-market-data.csv` (currently 100 sample)
- **90 sources** in `sources.json` (currently 10 sample)
- **≥50 packages** in `39-packages.csv` (pending)
- **Snapshots** for top 30 sources (pending)

---

## Data Collection Methodology

### 1. Source Selection & Credibility Scoring

**Selection Criteria:**
- UK-based accountancy firms with verifiable UK operations
- Public pricing information (no login required)
- Geographic and segment diversity (quotas enforced)

**Credibility Scoring (1-10):**
| Score | Description | Example |
|-------|-------------|---------|
| 9-10 | Established brand with detailed public pricing/calculator | DNS Accountants, Crunch |
| 7-8 | Published pricing pages or ranges | TaxAssist, GoForma |
| 5-6 | Incomplete pricing or ranges only | Regional firms |
| 3-4 | No pricing but quotes available | Solo practitioners |
| 1-2 | Limited web presence | Minimal firms |

**Phase 1 Results:**
- Average credibility: 7.1/10
- High credibility (7+): 67% of firms
- Top 10 sources (9-10 score): 100% URL accessibility

### 2. Observation Collection Rules

**One Source Per Observation:**
- Each row in `21-market-data.csv` has exactly ONE `source_id`
- Multiple observations from same source = multiple rows
- Example: DNS Accountants pricing page → 15 observations (different services/turnover bands)

**Service Code Classification:**
- Uppercase pattern: `CATEGORY_DESCRIPTOR`
- Examples: `BOOK_BASIC`, `COMP_ACCOUNTS`, `VAT_QTR`, `ADMIN_KYC`
- Full registry in `service-codes.json` (Phase 5)

**Bookkeeping Classification (Critical):**

| Level | Keywords | What's Included | What's Excluded |
|-------|----------|-----------------|-----------------|
| `basic` | cash-coding, bank feeds, rules, reconciliation | Bank transactions, cash coding, basic reconciliation | Invoice posting, debtor/creditor, journals |
| `full` | invoices, debtor, creditor, accruals, journals | Everything in basic + sales/purchase invoices, debtor/creditor management, accruals/prepayments, journals | - |
| `unspecified` | Ambiguous scope without clear classification | Varies by source | Mark for manual review |

**Hard Rule:** If pricing shows "Basic: £X | Full: £Y" → Create TWO observations (one per service level)

### 3. Data Quality Assessment

| Grade | Definition | Example | Usage |
|-------|------------|---------|-------|
| **A** | Exact price stated | "£150/month" or calculator output | 40% target |
| **B** | Bounded range with clear driver | "£120-180 depending on turnover" | 35% target |
| **C** | Estimated or "from £X" | "From £150/month" or "Typical £100-200" | 25% target |

**Quality Flags:**
- ✅ Grade A observations preferred for Model A/B fitting
- ⚠️ Grade B acceptable if bounds are clear and driver-linked
- ❌ Grade C used for gap-filling only; excluded from regression

### 4. Normalization Rules (Applied Before CSV Entry)

**Annual → Monthly:**
```
monthly_ex_vat = round_to_5(annual_ex_vat / 12)
scope_notes = "Normalized from £{annual}/year"
```

**Inc-VAT → Ex-VAT:**
```
ex_vat = inc_vat / 1.2
scope_notes = "Converted from inc-VAT £{inc_vat}"
```
*Assumption:* 20% VAT unless source states otherwise

**Quarterly → Monthly:**
```
monthly_ex_vat = round_to_5(quarterly_ex_vat / 3)
scope_notes = "Normalized from £{quarterly}/quarter"
```

**Rounding:**
- All monthly prices rounded to nearest £5
- Applied AFTER division (annual/quarterly conversion)
- Example: £1,234/year → £102.83/month → £105/month (rounded)

**What NOT to Normalize Yet:**
- ❌ Do NOT apply minimum engagement (£60 floor) - Phase 4
- ❌ Do NOT apply guardrails (p25/p75 clamps) - Phase 4
- ❌ Do NOT interpolate missing cells - Phase 6

### 5. Entity Types & Turnover Bands

**Entity Types (5):**
1. `sole_trader` - Self-employed individual
2. `partnership` - Traditional partnership
3. `ltd` - Limited company
4. `llp` - Limited liability partnership
5. `cic` - Community interest company

**Turnover Bands (15 standard):**
```
0-49k, 50-99k, 100-149k, 150-199k, 200-249k, 250-299k,
300-399k, 400-499k, 500-599k, 600-749k, 750-999k,
1.0-1.49m, 1.5-1.99m, 2.0-2.99m, 3.0m+
```

**Complexity Tiers (4):**
- `simple` - Basic structure, low transaction volume
- `standard` - Typical business complexity
- `complex` - High transactions, multi-entity, payroll
- `regulated` - FCA-regulated, specialized compliance

---

## Sample Dataset Characteristics (100 observations)

### Service Distribution

| Service Category | Observations | % of Sample |
|------------------|--------------|-------------|
| Bookkeeping (basic/full) | 32 | 32% |
| Compliance (accounts/CT/SATR) | 41 | 41% |
| VAT Returns | 4 | 4% |
| Payroll | 2 | 2% |
| Admin Fees | 8 | 8% |
| Tax Planning/Advisory | 4 | 4% |
| Other (CIS, Mgmt Accounts) | 9 | 9% |

### Entity Type Distribution

| Entity | Observations | % | Target Full Dataset |
|--------|--------------|---|---------------------|
| ltd | 73 | 73% | 40% (800 obs) |
| sole_trader | 16 | 16% | 25% (500 obs) |
| partnership | 6 | 6% | 20% (400 obs) |
| llp | 3 | 3% | 10% (200 obs) |
| cic | 2 | 2% | 5% (100 obs) |

*Note:* Sample over-represents `ltd` for demonstration; full dataset should match target distribution.

### Turnover Band Coverage

| Band | Observations | Coverage |
|------|--------------|----------|
| 0-49k | 3 | ✓ |
| 50-99k | 13 | ✓✓ |
| 100-149k | 60 | ✓✓✓✓ (concentrated for demo) |
| 150-199k | 14 | ✓✓ |
| 200-249k | 7 | ✓ |
| 250-299k | 2 | ✓ |
| 300-399k | 1 | ✓ |

*Note:* Full dataset should have broader distribution across all 15 bands.

### Data Quality Distribution

| Grade | Count | % | Target |
|-------|-------|---|--------|
| A (Exact) | 98 | 98% | 40% |
| B (Bounded) | 2 | 2% | 35% |
| C (Estimated) | 0 | 0% | 25% |

*Note:* Sample prioritizes Grade A for clarity; full dataset will include B/C observations.

### Pricing Model Distribution

| Model | Count | % |
|-------|-------|---|
| modelA (fixed/turnover-based) | 89 | 89% |
| fixed (one-off fees) | 9 | 9% |
| percentage (e.g., R&D claims) | 2 | 2% |
| modelB (transaction-based) | 0 | 0% (requires tx data) |

---

## Key Findings from Sample

### Pricing Ranges Observed (Monthly Ex-VAT)

**Bookkeeping:**
- Basic: £65-110 (0-199k turnover)
- Full: £135-310 (50k-399k turnover)
- London premium: ~10-15% vs. England regions

**Compliance (Ltd Companies):**
- Annual Accounts (100-149k, standard): £95-125/month (£1,140-1,500/year)
- Self-Assessment (50-149k, sole trader): £35-50/month (£420-600/year)
- Corporation Tax: Often bundled with accounts (£30-40/month standalone)

**VAT Returns:**
- Quarterly: £45-50/month
- Annual: £35/month

**Payroll:**
- Per-run (up to 5 employees): £30-35/month
- Pension admin: £20/month

**Admin Fees (One-Off):**
- VAT Registration: £125
- Company Formation: £100
- PAYE Setup: £85-95
- Confirmation Statement: £45-50/year

**Advisory:**
- Basic Tax Planning: £85/month
- Advanced Tax Planning: £200/month
- Virtual FD: From £300/month
- R&D Tax Credits: From £500 or % of claim

### Brand-Specific Insights

**DNS Accountants (SRC001):**
- Most comprehensive pricing coverage
- Clear turnover-based pricing tiers
- Strong coverage across entity types (ltd, llp, cic)
- London-based with premium pricing

**TaxAssist Accountants (SRC006):**
- Franchise network with standardized pricing
- Consistent across UK regions
- Package-based approach
- Slightly lower than digital-first competitors

**Crunch (SRC002):**
- Software + accountant model
- Tiered packages (Starter, Growth, Enterprise implied)
- Competitive pricing for digital-first approach

**GoForma (SRC007):**
- Franchise network similar to TaxAssist
- Regional England focus
- Package-based with clear tiers

---

## Next Steps for Full Implementation

### Phase 3: Expand Dataset to ≥1,000 Observations

**Prioritized Collection:**
1. **High-Value Cells** (80% of use cases):
   - Ltd companies: 0-500k turnover, standard complexity
   - Sole traders: 0-150k turnover, simple/standard complexity
   - Bookkeeping basic/full across all bands
   - Core compliance (accounts, CT, SATR)

2. **Model B Observations** (transaction-based):
   - Requires tx volume data (e.g., "£50 base + £0.50/tx")
   - Target: Digital firms with calculator tools
   - Minimum 100 observations for regression fitting

3. **Geographic Variation**:
   - London vs. regional comparison dataset
   - 20% of observations from non-London sources
   - Document premium as metadata (not baked into schedules)

4. **Package Bundles** (≥50):
   - Bronze/Silver/Gold structures
   - Map included services to service codes
   - Note exclusions explicitly
   - Effective monthly pricing

### Phase 4: Statistical Analysis & Quality Assurance

**Weighting System:**
```
observation_weight = credibility_score × quality_multiplier
quality_multiplier: A=1.0, B=0.7, C=0.4
```

**Outlier Detection:**
- IQR method: [Q1 - 1.5×IQR, Q3 + 1.5×IQR]
- Log outliers with justification
- Exclude from median calculations

**Weighted Medians:**
- Calculate p25, p50, p75 per cell (entity × turnover × service × complexity)
- Minimum n=3 sources per cell for confidence
- Flag cells with n<3 as LOW_EVIDENCE

### Phase 5: Model A & B Schedule Generation

**Model A (Fixed/Turnover-Based):**
- Recommended price = clamp(p50, [max(p25, £60), p75])
- Round to nearest £5
- Full traceability: n_sources, source_ids, p25/p50/p75, flags

**Model B (Transaction-Based):**
- Fit: price = base + (tx_rate × transactions) + (acct_rate × extra_accounts)
- Weighted least squares per entity × complexity × service_level
- Accept if R² ≥ 0.8; otherwise use Model A

---

## Schema Reference

### 21-market-data.csv (Observations)

```csv
observation_id     : Unique ID (OBS0001, OBS0002, ...)
brand              : Firm name from 38-competitor-catalog.csv
brand_network      : Network affiliation or "independent"
source_id          : Single source reference (SRC001, SRC002, ...)
entity_type        : sole_trader | partnership | ltd | llp | cic
turnover_band      : One of 15 standard bands
service_code       : UPPERCASE_DESCRIPTOR pattern
service_name       : Human-readable service name
service_level      : basic | full | unspecified | n/a
complexity_tier    : simple | standard | complex | regulated
price_gbp_monthly_ex_vat : Numeric (rounded to £5)
pricing_model      : modelA | modelB | fixed | tiered | percentage
scope_notes        : Normalization notes, scope details
data_quality       : A | B | C
url                : Source URL
captured_date      : YYYY-MM-DD
region             : London | England | Scotland | Wales | N. Ireland
```

### sources.json (Source Registry)

```json
{
  "source_id": "SRC###",
  "brand": "Firm Name",
  "url": "https://...",
  "captured_date": "YYYY-MM-DD",
  "credibility_score": 1-10,
  "source_type": "published_pricing_page | pricing_calculator | quote",
  "notes": "Brief description"
}
```

---

## Quality Assurance Checklist

Before finalizing datasets:

- [ ] All observation_ids unique
- [ ] All source_ids exist in sources.json
- [ ] Entity types from enum list only
- [ ] Turnover bands from standard 15 only
- [ ] Service codes follow UPPERCASE pattern
- [ ] Data quality A/B/C assigned to all
- [ ] No commas inside CSV cells (use pipe |)
- [ ] All dates in YYYY-MM-DD format
- [ ] All prices rounded to £5
- [ ] Normalization noted in scope_notes
- [ ] URLs tested and accessible
- [ ] service_level appropriate for service_code

---

## Research Ethics & Compliance

**Data Sources:**
- ✅ Public pricing pages only
- ✅ Publicly accessible calculators
- ❌ No login-required data
- ❌ No scraping bots (manual extraction only)

**Attribution:**
- All observations linked to source_id
- Brand names used for research purposes only
- URLs provide full traceability
- Pricing subject to change; snapshot in time

**Usage:**
- Internal research and benchmarking
- Practice Hub pricing model calibration
- No public redistribution of raw data
- Aggregated/anonymized insights only

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-05 | 1.0 | Initial framework and 100-observation sample |

---

**Status:** Phase 1-2 framework complete. Ready for Phase 3 expansion to ≥1,000 observations.
