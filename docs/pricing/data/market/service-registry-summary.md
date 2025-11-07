# Service Registry - Summary Report

**Date:** 2025-01-06
**Phase:** 5 - Service Registry Creation
**Source Dataset:** 21-market-data.csv (1,200 observations)

---

## Executive Summary

✅ **Service Registry Complete** - Standardized taxonomy of 133 unique UK accountancy service codes organized into 8 categories.

**Key Statistics:**
- **133 unique service codes** identified across 1,200 observations
- **8 service categories** created
- **Top 5 services** represent 800+ observations (67% of dataset)
- **Pricing models documented:** Model A (turnover-based), Model B (transaction-based), Fixed fee

---

## Service Categories

### 1. Core Compliance Services (COMPLIANCE)
**Primary services for UK business statutory requirements**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| COMP_ACCOUNTS | Company Accounts Preparation | 437 | £135.50 |
| COMP_SATR | Self Assessment Tax Return | 174 | £42.30 |
| COMP_CT | Corporation Tax Return | 12 | £45.00 |
| COMP_DORMANT | Dormant Company Accounts | 5 | £18.00 |
| COMP_CONFIRMATION | Confirmation Statement | 4 | £9.00 |
| COMP_PARTNERSHIP | Partnership Tax Return | 6 | £35.00 |

**Category Insights:**
- Accounts preparation (COMP_ACCOUNTS) is the most common service (437 obs)
- Self-assessment returns widespread across all entity types
- Dormant company accounts are lowest-cost compliance service (£18 avg)

### 2. Bookkeeping Services (BOOKKEEPING)
**Transaction processing and record-keeping services**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| BOOK_MONTHLY | Monthly Bookkeeping | 108 | £163.25 |
| BOOK_BASIC | Basic Bookkeeping | 37 | £85.40 |
| BOOK_QUARTERLY | Quarterly Bookkeeping | 21 | £42.85 |
| BOOK_STANDARD | Standard Bookkeeping | 18 | £125.00 |
| BOOK_FULL | Full Bookkeeping Service | 7 | £180.00 |

**Category Insights:**
- Monthly bookkeeping (BOOK_MONTHLY) predominantly uses **Model B (transaction-based) pricing**
- Wide price variation (£10-£900) reflects transaction volume differences
- Quarterly bookkeeping averages £42.85/month (lower frequency = lower cost)

### 3. VAT Services (VAT)
**VAT registration, returns, and compliance**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| VAT_QTR | Quarterly VAT Returns | 47 | £58.50 |
| VAT_MTH | Monthly VAT Returns | 6 | £75.00 |

**Category Insights:**
- Quarterly VAT most common (47 obs)
- Monthly VAT £16.50 premium over quarterly (more frequent filings)
- Price range: £10-£375/month (complex VAT scenarios command premiums)

### 4. Payroll Services (PAYROLL)
**Payroll processing and pension administration**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| PAYROLL_BASE | Payroll Processing | 42 | £42.15 |
| PAYROLL_RUN | Payroll Run | 16 | £25.00 |

**Category Insights:**
- Payroll pricing typically **per employee** or **per payroll run**
- Base payroll averages £42/month (likely 1-2 employees)
- Per-run pricing lower (£25 avg) for ad-hoc processing

### 5. Property & Landlord Services (PROPERTY)
**Property tax and landlord accounting**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| LANDLORD_TAX | Landlord Tax Return | 23 | £28.50 |
| PROPERTY_RENTAL | Property Rental Accounts | 4 | £40.00 |

**Category Insights:**
- Landlord tax returns affordable (£28.50 avg)
- Often tiered by property count
- Range: £3-£75/month

### 6. Management Accounting (MANAGEMENT)
**Management accounts and financial reporting**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| MGMT_ACCTS | Management Accounts | 33 | £165.00 |

**Category Insights:**
- Premium service (£165 avg) for active business monitoring
- Wide range: £35-£500/month (complexity-dependent)
- Typically monthly P&L, balance sheet, cash flow, KPIs

### 7. Specialized Services (SPECIALIZED)
**Niche accounting and tax services**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| SALES_INV | Sales Invoicing | 24 | £75.00 |
| CGT_FILING | Capital Gains Tax Filing | 8 | £125.00 |
| CIS_RETURN | CIS Returns | 7 | £45.00 |

**Category Insights:**
- Sales invoicing uses **Model B (transaction-based)** pricing (£10-£240 range)
- CGT filing premium specialist service (£125 avg)
- CIS returns for construction sector

### 8. Service Packages (PACKAGES)
**Bundled multi-service offerings**

| Service Code | Service Name | Observations | Mean Price |
|--------------|--------------|--------------|------------|
| PACKAGE_START | Starter Package | 4 | £52.50 |
| PACKAGE_OPERATE | Operate Package | 4 | £87.50 |

**Category Insights:**
- Starter packages £45-£60/month (entry-level)
- Operate packages £75-£100/month (mid-tier with VAT/payroll)
- Bundle discounts vs. à la carte pricing

---

## Top 10 Most Common Services

| Rank | Service Code | Count | Mean Price | % of Dataset |
|------|--------------|-------|------------|--------------|
| 1 | COMP_ACCOUNTS | 437 | £135.50 | 36.4% |
| 2 | COMP_SATR | 174 | £42.30 | 14.5% |
| 3 | BOOK_MONTHLY | 108 | £163.25 | 9.0% |
| 4 | VAT_QTR | 47 | £58.50 | 3.9% |
| 5 | PAYROLL_BASE | 42 | £42.15 | 3.5% |
| 6 | BOOK_BASIC | 37 | £85.40 | 3.1% |
| 7 | MGMT_ACCTS | 33 | £165.00 | 2.8% |
| 8 | SALES_INV | 24 | £75.00 | 2.0% |
| 9 | LANDLORD_TAX | 23 | £28.50 | 1.9% |
| 10 | BOOK_QUARTERLY | 21 | £42.85 | 1.8% |

**Combined:** Top 10 services = 946 observations (78.8% of dataset)

---

## Pricing Model Distribution by Service Type

### Model B (Transaction-Based) Services
**Services predominantly using transaction/invoice volume pricing:**

- **BOOK_MONTHLY** (108 obs) - £163 avg - Transaction volume tiers
- **BOOK_QUARTERLY** (21 obs) - £43 avg - Quarterly transaction processing
- **SALES_INV** (24 obs) - £75 avg - Per-invoice pricing
- **Model B Total:** 153+ observations in bookkeeping/invoicing services

### Model A (Turnover-Based) Services
**Services predominantly using turnover band pricing:**

- **COMP_ACCOUNTS** (437 obs) - £136 avg - Turnover-based tiers
- **COMP_SATR** (174 obs) - £42 avg - Often income-based
- **VAT_QTR** (47 obs) - £59 avg - Fixed or turnover-based

### Fixed Fee Services
**Services with flat pricing regardless of size:**

- **COMP_DORMANT** (5 obs) - £18 avg
- **COMP_CONFIRMATION** (4 obs) - £9 avg
- **PAYROLL_RUN** (16 obs) - £25 avg

---

## Service Inclusions Analysis

### Typical Package Inclusions

**Basic Compliance Package (£50-80/month):**
- Statutory accounts preparation
- Self-assessment tax return
- Companies House filing
- Basic support

**Standard Business Package (£100-150/month):**
- Statutory accounts + tax
- Monthly bookkeeping (up to 50-100 transactions)
- VAT returns (quarterly)
- Payroll for 1-2 employees
- Phone/email support

**Premium Package (£200-300/month):**
- All standard services
- Management accounts
- Higher transaction volumes (200+)
- Tax planning
- Dedicated account manager

**Enterprise Package (£400+/month):**
- E-commerce specialists
- High-volume bookkeeping (500+ transactions)
- Virtual CFO services
- Multi-entity support
- Strategic advisory

---

## Practice Hub Integration Recommendations

### Service Code Mapping

**For Practice Hub pricing calculator, implement these core services:**

1. **COMP_ACCOUNTS** - Core offering for Ltd companies
   - Pricing: Turnover-based tiers
   - Range: £80-£200/month

2. **COMP_SATR** - Core offering for Sole traders
   - Pricing: Fixed or income-based
   - Range: £30-60/month

3. **BOOK_MONTHLY** - Optional add-on
   - Pricing: Transaction-based (Model B)
   - Range: £60-£200/month
   - Tiers: 0-50, 51-100, 101-200, 201+ transactions

4. **VAT_QTR** - Add-on service
   - Pricing: Fixed quarterly (£150-200/year = £40-50/month)

5. **PAYROLL_BASE** - Add-on service
   - Pricing: Per employee (£30-50/month for 1-5 employees)

6. **MGMT_ACCTS** - Premium add-on
   - Pricing: Fixed monthly (£150-200/month)

### Service Bundling Strategy

**Tier 1: Compliance Only (£60-100/month)**
- COMP_ACCOUNTS or COMP_SATR
- COMP_CT (if applicable)
- Basic support

**Tier 2: Business Standard (£120-180/month)**
- Tier 1 services
- BOOK_MONTHLY (up to 100 transactions)
- VAT_QTR
- PAYROLL_BASE (1-2 employees)

**Tier 3: Growth Package (£200-300/month)**
- Tier 2 services
- BOOK_MONTHLY (up to 200 transactions)
- MGMT_ACCTS
- Enhanced support

---

## Data Quality Notes

### Service Code Standardization

- **Naming Convention:** CATEGORY_DESCRIPTOR format
- **Consistency:** 133 unique codes across 1,200 observations
- **Coverage:** All major UK accountancy services represented

### Known Limitations

1. **Minor services** (<5 observations) may not represent market accurately
2. **Package codes** vary by firm (PACKAGE_START vs PACKAGE_STARTER)
3. **Add-on services** (ADDON_*) often bundled, hard to price individually
4. **Banking services** (BANKING_*) primarily from Anna Money, not representative

### Recommendations for Future Enhancement

1. **Consolidate package codes** - Standardize similar packages (PACKAGE_STARTER = PACKAGE_START)
2. **Separate add-ons** - Create clear base service + add-on pricing model
3. **Industry-specific services** - Track e-commerce, construction, hospitality specialist pricing
4. **Software bundling** - Document which firms include accounting software (Xero, QuickBooks, etc.)

---

## Registry Statistics

- **Total Service Codes:** 133
- **Service Categories:** 8
- **Observations:** 1,200
- **Mean Service Price:** £111.99/month
- **Median Service Price:** £60/month
- **Price Range:** £0-£3,704/month

**Top Category by Observations:** Compliance (600+ observations)
**Top Category by Revenue:** Bookkeeping (£17,631 total monthly value)
**Most Expensive Service Category:** Management Accounting (£165 avg)
**Most Affordable Service Category:** Compliance - Dormant (£18 avg)

---

## Phase 5 Status: ✅ COMPLETE

**Deliverables:**
1. `service-registry.json` - Structured service taxonomy (408 lines)
2. `service-registry-summary.md` - This report

**Next Phase:** Phase 6 - Generate Exact Pricing Schedules

---

**Report Prepared By:** Claude
**Date:** 2025-01-06
**Data Source:** 21-market-data.csv (1,200 UK pricing observations)
