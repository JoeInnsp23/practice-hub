# UK Pricing Research Plan Reference (v4 - PRODUCTION-READY)

**Session Date**: 2025-10-30
**Estimated Effort**: 45-60 hours (6-8 working days)
**Status**: Phase 1 In Progress

---

## Autonomy Mandate

**Do all exploration, web research, analysis, writing, file generation, and validation yourself. Do not ask the user to supply figures. If subagents are unsupported, emulate sequentially.**

---

## Objectives

1. **UK Accountancy Firm Pricing** (100 targeted, ≥75 minimum)
2. **Competitor Proposal Software Analysis** (15-20 platforms)
3. **Quality-Weighted Recommendations** (≥1,000 observations)

---

## Global Standards

- **Complexity**: `simple | standard | complex | regulated` (everywhere)
- **Legacy Mapping**: clean→simple, average→standard, disaster→regulated
- **VAT**: All prices normalized to GBP monthly ex-VAT
- **Delimiter**: Pipe `|` for multi-value CSV fields (NOT commas)
- **Entity Types**: sole_trader, partnership, ltd, llp, **cic** (5 total)

---

## Work Breakdown Structure

### Phase 1: Competitor Source Discovery (4-5h) ✅ IN PROGRESS
- **1A**: UK firm catalog (100 targeted) → `38-competitor-catalog.csv`
- **1B**: Software platforms (15-20) → `software-catalog.csv`
- **1C**: Alternative sources (forums, reports) → `source-inventory.md`

### Phase 2: Deep Data Capture (10-14h)
- **2A**: Extract pricing (≥1,000 observations) → `21-market-data.csv`
- **2B**: Software analysis (15-20 teardowns) → `calculator-analysis/*.md`
- **2C**: Forum/report mining
- **2D**: Admin catalog (20+ items)

### Phase 3: Quality Scoring (3-4h)
- Credibility scoring (1-10 scale)
- Data quality categorization (A/B/C)
- Outlier detection (IQR method)
- Network deduplication

### Phase 4: Statistical Analysis (4-5h)
- **4A**: Coverage analysis → `coverage.csv` (2000+ cells)
- **4B**: Weighted medians → `weighted-medians.csv`
- **4C**: Model B regression → `model-b-regression.md` (R²≥0.8 gate)

### Phase 5: Service Registry (1h)
- Create `service-codes.json` (27 core + 20+ admin codes)

### Phase 6: Pricing Schedules (6-8h)
- **6A**: Model A (33a/33b/35) - 300+300+1500 rows
- **6B**: Model B (43a/43b/45) - 20+20+100 rows
- **6C**: Admin fees & packages (34/39)

### Phase 7: Validation (3-4h)
- **7A**: Reconciliation → `36-reconciliation.md`
- **7B**: Service gaps → `37-service-gaps.md`
- **7C**: Software comparison → `competitive-analysis.md`

### Phase 8: Documentation (3-4h)
- Update 14 existing docs
- Create 5 new docs

---

## Acceptance Criteria

- **AC1**: ≥100 competitors (≥75 min), geographic quotas met
- **AC2**: Exact schedules for bookkeeping (basic/full), compliance, VAT, payroll, advisory (9+ codes), admin (20+ items), packages
- **AC3**: ≥3 sources per cell OR LOW-EVIDENCE with DECISION blocks
- **AC4**: 15 bands × 5 entities × 4 complexity × service_level; all rows have service_code, n_sources, source_ids, stats, flags, currency, frequency
- **AC5**: ≥1,000 observations; quality gates; traceability; complexity standardization
- **AC6**: Software feature matrix + formula teardowns (15-20 platforms)
- **AC7**: Model B regression with per-entity/per-level summary table (R²≥0.8)

---

## Stop-the-Line Triggers

- Source credibility <5/10 without corroboration
- Coverage <3 sources in HIGH-PRIORITY cells
- Weighted median variance >30% from unweighted
- Model B R² <0.8
- **Observation count <1,000 at Phase 4**
- Missing CIC entity type
- Missing service_level for bookkeeping
- Inconsistent complexity naming
- Missing service_code column
- CSV encoding error (commas in source_ids)
- Packages validation failure

---

## Deliverables (30+ Files)

### Core Schedules (7 files)
- 33a-bookkeeping-modelA-basic.schedule.csv (300 rows)
- 33b-bookkeeping-modelA-full.schedule.csv (300 rows)
- 35-modelA-all-services.schedule.csv (1500+ rows)
- 43a-bookkeeping-modelB-basic.params.csv (20 rows)
- 43b-bookkeeping-modelB-full.params.csv (20 rows)
- 45-modelB-all-services.schedule.csv (100+ rows)
- 34-admin-fees.table.csv (20+ rows)

### Service Registry (1 file)
- service-codes.json (27 core + 20+ admin)

### Packages (1 file)
- 39-packages.csv (50+ bundles)

### Validation (4 files)
- 36-reconciliation.md
- 37-service-gaps.md
- data/validation/quality_report.md
- data/validation/outliers.csv

### Data (6+ files)
- 21-market-data.csv (≥1,000 observations)
- data/market/sources.json (100+ sources)
- data/market/38-competitor-catalog.csv (100 targeted)
- data/market/software-catalog.csv (20 platforms)
- data/market/coverage.csv (2000+ cells)
- data/validation/deduplication-log.md

### Software Analysis (5+ files)
- data/software/competitive-analysis.md
- data/software/platforms-inventory.md
- data/software/best-practices.md
- data/software/calculator-analysis/*.md (15-20)

### Documentation (6 files)
- Updated: 00-exec-brief.md, 20-market-research.md, 30-pricing-model.md, 22-mappings.json
- New: data/research/methodology.md, data/software/platforms-inventory.md

**TOTAL**: 30+ files

---

## Bookkeeping Classification Rules (Hard Rules)

### Basic Bookkeeping
**Keywords**: "cash-coding", "bank feeds", "rules", "no invoice posting"

**Scope Includes**: Bank feed categorization, cash-coding, basic reconciliation

**Scope Excludes**: Invoice posting, debtor/creditor, accruals, journals

### Full Bookkeeping
**Keywords**: "sales invoices", "purchase invoices", "debtor management", "accruals", "journal adjustments"

**Scope Includes**: All basic items PLUS invoice posting, debtor/creditor, accruals, journals

### Hard Rules for Edge Cases
- **Both cues + TWO prices** → Record TWO observations
- **Both cues + ONE price** → Mark `unspecified`, flag in QA
- **"from £X"** → data_quality=C unless upper bound stated

---

## Progress Tracking

**Phase 1 Status**: In Progress
- ✅ Web searches completed (10+ searches, 53 existing sources)
- ✅ Directories created
- 🔄 Building competitor catalog (targeting 100)
- 🔄 Building software catalog (targeting 20)

**Next Steps**:
1. Complete Phase 1A/1B catalogs
2. Phase 1C: Alternative sources inventory
3. Move to Phase 2: Deep data capture

---

**Last Updated**: 2025-10-30 (Context preserved for continuity)
