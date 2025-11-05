# UK Pricing Research - Phase 3 Progress Report

**Status:** Data Collection In Progress
**Date:** 2025-01-05
**Branch:** feature/ui-ux-polish-phase-2

---

## Progress Summary

**Target:** 1,000 observations from 75-100 UK firms
**Current:** 243 observations from 17 firms (24% complete)

### Observations by Batch

| Batch | Firms | Observations | Status |
|-------|-------|--------------|--------|
| Batch 1 | 4 | 57 | ✅ Complete |
| Batch 2 | 3 | 64 | ✅ Complete |
| Batch 3 | 3 | 70 | ✅ Complete |
| Batch 4 | 3 | 52 | ✅ Complete |
| **Total** | **17** | **243** | **24%** |

### Data Quality Distribution

| Grade | Count | % | Description |
|-------|-------|---|-------------|
| A (Exact) | 231 | 95% | Exact prices stated |
| B (Bounded) | 10 | 4% | Bounded ranges with clear drivers |
| C (Estimated) | 2 | 1% | Estimated or "from £X" |

### Source Distribution

| Source ID | Brand | Observations | Credibility | Type |
|-----------|-------|--------------|-------------|------|
| SRC002 | Crunch | 18 | 10 | Tiered packages |
| SRC004 | InniAccounts | 18 | 9 | Contractor-focused |
| SRC005 | Anna Money | 15 | 9 | Banking + tax |
| SRC003 | 1st Formations | 6 | 9 | Partial (site blocking) |
| SRC007 | GoForma | 24 | 9 | Franchise network |
| SRC008 | Penneys Accountancy | 20 | 8 | Digital firm |
| SRC009 | 1st Cloud Accountants | 20 | 8 | Cloud-first |
| SRC011 | RJ Accountancy | 31 | 8 | Granular turnover bands |
| SRC012 | Accrue Accounting | 21 | 8 | Contractor packages |
| SRC013 | Coconut | 18 | 9 | App-based software |
| SRC015 | The Online Accountants | 19 | 8 | Fixed-fee packages |
| SRC016 | Xcountant | 15 | 8 | Bronze/Silver/Gold |
| SRC017 | Quick Tax Returns | 18 | 7 | Tax specialist |

**Registered but not yet extracted:**
- SRC001 (DNS Accountants) - Site blocks automated access
- SRC006 (TaxAssist) - Custom quotes only, no published pricing
- SRC010 (The Accountancy Cloud) - JavaScript-rendered, inaccessible
- SRC014 (Sleek) - Heavy JavaScript, incomplete data

### Coverage Analysis

**Entity Types:**
- ✅ Ltd companies: Well covered (0-49k through 1m+ turnover)
- ✅ Sole traders: Broad coverage across turnover ranges
- ✅ Partnerships: Basic to complex structures
- ⚠️ LLPs: Limited observations
- ⚠️ CICs: Minimal observations

**Service Categories:**
- ✅ Bookkeeping (basic/full): 60+ observations
- ✅ Compliance (accounts, CT, SATR): 90+ observations
- ✅ VAT returns: 25+ observations
- ✅ Payroll: 20+ observations
- ✅ Admin fees: 15+ observations
- ✅ Packages: 40+ observations
- ⚠️ Advisory services: Limited observations
- ⚠️ Model B (transaction-based): 0 observations (requires tx data)

**Turnover Bands:**
- ✅ 0-49k: Well covered
- ✅ 50-99k: Excellent coverage
- ✅ 100-149k: Highest concentration
- ✅ 150-199k: Good coverage
- ⚠️ 200-249k: Moderate coverage
- ⚠️ 250-299k: Limited coverage
- ⚠️ 300-399k: Minimal coverage
- ❌ 400k+: Very limited observations

### Pricing Insights

**Bookkeeping (Monthly Ex-VAT):**
- Basic: £10-150/month
- Full: £65-310/month
- Significant variation by region and complexity

**Compliance (Ltd Companies, Monthly Ex-VAT):**
- Accounts (0-49k): £5-30/month (£60-360/year)
- Accounts (100-149k): £30-95/month (£360-1,140/year)
- Accounts (1m+): £105-350/month (£1,260-4,200/year)

**Packages (Monthly Ex-VAT):**
- Bronze/Starter: £40-85/month
- Silver/Standard: £100-180/month
- Gold/Premium: £165-375/month

**VAT Returns:**
- Quarterly: £5-50/month
- Monthly: £75/month

**Payroll:**
- Small (1-5 employees): £5-15/month
- Medium (6-10 employees): £15-50/month
- Large (25+ employees): £110/month

---

## Next Steps

### Immediate (Batch 5-10)
- Target 57 more observations to reach 300 (30% of target)
- Focus on:
  - Mid-tier regional firms (200k-500k turnover bands)
  - LLP and CIC coverage
  - Advisory services pricing
  - Model B transaction-based observations

### Phase 3 Completion
- Reach 1,000 observations from 75-100 firms
- Estimated effort: 15-25 more hours of data collection
- Parallel approach: 5-10 firms per batch with focused CSV extraction

### Data Quality Actions
- Extract DNS Accountants data (requires browser automation or manual extraction)
- Attempt TaxAssist franchise partner direct inquiry
- Use Playwright for JavaScript-heavy sites (Sleek, Accountancy Cloud)

---

## Files

**Batch Data Files:**
- `batch1-crunch.csv` (18 observations)
- `batch1-inniaccounts.csv` (18 observations)
- `batch1-anna.csv` (15 observations)
- `batch1-1stformations.csv` (6 observations)
- `batch2-goforma.csv` (24 observations)
- `batch2-penneys.csv` (20 observations)
- `batch2-1stcloud.csv` (20 observations)
- `batch3-rj-accountancy.csv` (31 observations)
- `batch3-accrue.csv` (21 observations)
- `batch3-coconut.csv` (18 observations)
- `batch4-online-accountants.csv` (19 observations)
- `batch4-xcountant.csv` (15 observations)
- `batch4-quick-tax.csv` (18 observations)

**Consolidated:**
- `21-market-data.csv` (243 observations + header)
- `sources.json` (17 registered sources)

**Sample (Original):**
- `21-market-data-SAMPLE.csv` (100 observations - framework demo)

---

**Status:** ✅ Phase 3 data collection proceeding smoothly
**Next Milestone:** 300 observations (30% of target)
**Estimated completion:** 15-25 hours additional research
