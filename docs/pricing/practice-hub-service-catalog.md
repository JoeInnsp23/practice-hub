# Practice Hub Service Catalog

**Version:** 1.0.0 (Draft)
**Date:** 2025-01-07
**Purpose:** Complete service catalog mapped to Practice Hub's 10 service categories

---

## Service Category Structure (10 Categories)

1. **Accounts** - Accounts production
2. **Tax** - Tax returns (all types)
3. **MTD** - Making Tax Digital (VAT and Income Tax)
4. **Bookkeeping** - Transaction processing and bookkeeping
5. **Management Accounts** - Management reporting and analysis
6. **Payroll** - Payroll processing (includes CIS)
7. **Business Admin** - Company secretarial, formation, closure
8. **Advisory** - Strategic and planning services
9. **Software** - Accounting software setup and support
10. **Ad-Hoc** - One-off projects and due diligence

---

## 1. ACCOUNTS (Accounts Production)

### 1.1 Limited Company Accounts
- **Service Code:** ACC_LTD
- **Description:** Statutory accounts preparation and Companies House filing
- **Entity Types:** Ltd, LLP, CIC
- **Market Data:** 437 observations, £135.50 avg
- **Pricing Model:** Model A (turnover-based)
- **Typical Inclusions:**
  - Statutory accounts preparation
  - Companies House filing
  - Director's report
  - Accounting policies
- **Variations:**
  - Micro-entity accounts
  - Abridged accounts
  - Full accounts
  - FRS 102 accounts
  - FRS 105 accounts (micro-entities)

### 1.2 Sole Trader Accounts
- **Service Code:** ACC_SOLE
- **Description:** Full accounts preparation for sole traders
- **Entity Types:** Sole Trader
- **Market Data:** Limited specific data (often bundled with tax return)
- **Pricing Model:** Model A (income-based) or Fixed
- **Typical Inclusions:**
  - Income and expenditure accounts
  - Balance sheet
  - Accounting records preparation

### 1.3 Partnership Accounts
- **Service Code:** ACC_PARTNERSHIP
- **Description:** Partnership accounts and profit allocation
- **Entity Types:** Partnership
- **Market Data:** 6 observations, £35 avg (may be understated)
- **Pricing Model:** Fixed + per partner
- **Typical Inclusions:**
  - Partnership accounts
  - Profit/loss allocation
  - Partner capital accounts

### 1.4 Dormant Company Accounts
- **Service Code:** ACC_DORMANT
- **Description:** Dormant company statutory accounts
- **Entity Types:** Ltd
- **Market Data:** 5 observations, £18 avg
- **Pricing Model:** Fixed (low-cost)
- **Typical Inclusions:**
  - Dormant accounts preparation
  - Companies House filing

### 1.5 Charity/CIC Accounts
- **Service Code:** ACC_CHARITY
- **Description:** Charity accounts (SORP compliant)
- **Entity Types:** CIC, Charity
- **Market Data:** 11 observations, £83.82 avg
- **Pricing Model:** Fixed or turnover-based
- **Typical Inclusions:**
  - SORP-compliant accounts
  - Trustees' report
  - Charity Commission filing

---

## 2. TAX (Tax Returns)

### 2.1 Self Assessment Tax Return (Individuals)
- **Service Code:** TAX_SATR_IND
- **Description:** Personal tax return for individuals (non-business)
- **Entity Types:** Individual
- **Market Data:** Part of 174 SATR observations
- **Pricing Model:** Fixed fee
- **Complexity Tiers:**
  - Simple (employment income only): ~£35/month
  - Standard (employment + savings/dividends): ~£45/month
  - Complex (property, investments, foreign income): ~£75/month

### 2.2 Self Assessment Tax Return (Sole Trader)
- **Service Code:** TAX_SATR_SOLE
- **Description:** Self assessment for sole traders
- **Entity Types:** Sole Trader
- **Market Data:** 174 observations (combined), £42.30 avg
- **Pricing Model:** Fixed fee or income-based
- **Complexity Tiers:**
  - Simple (single income source): ~£40/month
  - Standard (multiple income sources): ~£60/month
  - Complex (multiple businesses): ~£85/month

### 2.3 Self Assessment Tax Return (Ltd Director)
- **Service Code:** TAX_SATR_DIR
- **Description:** Director's personal tax return
- **Entity Types:** Individual (Ltd Director)
- **Market Data:** Part of 174 SATR observations, £42.30 avg
- **Pricing Model:** Fixed fee
- **Typical Price:** £45-£60/month
- **Typical Inclusions:**
  - Salary and dividends
  - Director's loan account
  - Benefits in kind

### 2.4 Corporation Tax Return
- **Service Code:** TAX_CT
- **Description:** Corporation tax computation and HMRC filing
- **Entity Types:** Ltd, LLP
- **Market Data:** 12 observations, £45 avg (often bundled with accounts)
- **Pricing Model:** Fixed fee
- **Note:** Often bundled with ACC_LTD service
- **Typical Inclusions:**
  - CT600 preparation
  - Tax computation
  - HMRC filing

### 2.5 Partnership Tax Return
- **Service Code:** TAX_PARTNERSHIP
- **Description:** Partnership tax return and partner allocations
- **Entity Types:** Partnership
- **Market Data:** 6 observations, £35 avg
- **Pricing Model:** Fixed + per partner
- **Typical Inclusions:**
  - Partnership return
  - Partner profit allocations
  - SA800 filing

### 2.6 Landlord Tax Return
- **Service Code:** TAX_LANDLORD
- **Description:** Property income tax return for landlords
- **Entity Types:** Individual, Sole Trader
- **Market Data:** 23 observations, £28.50 avg
- **Pricing Model:** Fixed, often tiered by property count
- **Typical Tiers:**
  - 1 property: £15-25/month
  - 2-3 properties: £25-40/month
  - 4-5 properties: £40-60/month
  - 6+ properties: £60-75/month

### 2.7 Capital Gains Tax Filing
- **Service Code:** TAX_CGT
- **Description:** CGT computation and filing
- **Entity Types:** Individual
- **Market Data:** 8 observations, £125 avg
- **Pricing Model:** Fixed per filing
- **Typical Price:** £50-250 depending on complexity

### 2.8 R&D Tax Credits
- **Service Code:** TAX_RND
- **Description:** R&D tax credit claims
- **Entity Types:** Ltd
- **Market Data:** Not in research (specialist service)
- **Pricing Model:** Fixed fee or % of claim
- **Note:** High-value specialist service

### 2.9 Capital Allowances Claims
- **Service Code:** TAX_CAPALLOW
- **Description:** Capital allowances optimization and claims
- **Entity Types:** Ltd, Sole Trader, Partnership
- **Market Data:** Not in research
- **Pricing Model:** Fixed project fee
- **Note:** Often one-off or annual review

### 2.10 EIS/SEIS Claims
- **Service Code:** TAX_EIS_SEIS
- **Description:** Enterprise Investment Scheme / Seed EIS claims
- **Entity Types:** Ltd
- **Market Data:** Not in research
- **Pricing Model:** Fixed project fee

---

## 3. MTD (Making Tax Digital)

### 3.1 VAT Returns - Quarterly
- **Service Code:** MTD_VAT_QTR
- **Description:** Quarterly VAT return preparation and MTD submission
- **Entity Types:** All VAT-registered entities
- **Market Data:** 47 observations, £58.50 avg
- **Pricing Model:** Fixed monthly (quarterly fee ÷ 3)
- **Typical Tiers:**
  - Micro (£0-50k): £40-60/month
  - Small (£50-250k): £50-70/month
  - Medium (£250k-1m): £60-100/month
  - Large (£1m+): £100-150/month

### 3.2 VAT Returns - Monthly
- **Service Code:** MTD_VAT_MTH
- **Description:** Monthly VAT return preparation and MTD submission
- **Entity Types:** All VAT-registered entities (monthly scheme)
- **Market Data:** 6 observations, £75 avg
- **Pricing Model:** Fixed monthly
- **Premium vs Quarterly:** +25-30%
- **Typical Tiers:**
  - Medium (£250k-1m): £70-90/month
  - Large (£1m+): £90-150/month

### 3.3 VAT Registration
- **Service Code:** MTD_VAT_REG
- **Description:** VAT registration application
- **Entity Types:** All entity types
- **Market Data:** Not in research (one-off service)
- **Pricing Model:** Fixed one-time fee
- **Typical Price:** £150-300 one-time

### 3.4 MTD for Income Tax
- **Service Code:** MTD_ITSA
- **Description:** Making Tax Digital for Income Tax (new requirement)
- **Entity Types:** Sole Trader, Partnership
- **Market Data:** Not in research (new service, 2026 rollout)
- **Pricing Model:** TBD (quarterly submissions)
- **Note:** New HMRC requirement starting 2026

### 3.5 VAT Scheme Changes
- **Service Code:** MTD_VAT_SCHEME
- **Description:** VAT scheme changes (flat rate, cash accounting, etc.)
- **Entity Types:** All VAT-registered
- **Market Data:** Not in research
- **Pricing Model:** Fixed project fee
- **Typical Price:** £100-200 one-time

---

## 4. BOOKKEEPING

### 4.1 Monthly Bookkeeping - Model A (Fixed)
- **Service Code:** BOOK_MTH_A
- **Description:** Monthly bookkeeping with fixed pricing (turnover-based)
- **Entity Types:** All
- **Market Data:** 163 observations (Model A only), £118 avg
- **Pricing Model:** Model A - Fixed monthly based on turnover/complexity
- **Typical Tiers:**
  - Basic (0-50k, simple): £60-100/month
  - Standard (50-250k): £100-150/month
  - Full (250k+): £150-220/month
- **Typical Inclusions:**
  - Transaction processing
  - Bank reconciliation
  - Monthly reports
  - Creditor/debtor management

### 4.2 Monthly Bookkeeping - Model B (Transaction-Based)
- **Service Code:** BOOK_MTH_B
- **Description:** Monthly bookkeeping with transaction-based pricing
- **Entity Types:** All
- **Market Data:** 108 observations (Model B), £163.25 avg
- **Pricing Model:** Model B - Priced by transaction volume
- **Typical Tiers:**
  - 0-50 transactions: £60/month
  - 51-100 transactions: £100/month
  - 101-150 transactions: £140/month
  - 151-200 transactions: £180/month
  - 201-300 transactions: £250/month
  - 301-400 transactions: £350/month
  - 401+ transactions: Custom quote
- **Premium vs Model A:** +43.6% on average
- **Typical Inclusions:** Same as Model A
- **Note:** Better for high-volume businesses (e-commerce, retail, construction)

### 4.3 Quarterly Bookkeeping
- **Service Code:** BOOK_QTR
- **Description:** Quarterly bookkeeping and transaction processing
- **Entity Types:** All (typically micro businesses)
- **Market Data:** 21 observations, £42.85 avg
- **Pricing Model:** Model B (transaction-based) typically
- **Typical Price:** £40-90/month

### 4.4 Sales Invoicing
- **Service Code:** BOOK_SALES_INV
- **Description:** Sales invoice processing and management
- **Entity Types:** All
- **Market Data:** 24 observations, £75 avg
- **Pricing Model:** Model B - Per invoice tiers
- **Typical Tiers:**
  - 0-25 invoices: £10-30/month
  - 26-50 invoices: £30-60/month
  - 51-100 invoices: £60-120/month
  - 101+ invoices: £120-240/month

### 4.5 Purchase Invoice Processing
- **Service Code:** BOOK_PURCH_INV
- **Description:** Purchase invoice processing
- **Entity Types:** All
- **Market Data:** Not specifically captured (part of bookkeeping)
- **Pricing Model:** Model B - Per invoice or included in bookkeeping
- **Note:** Often bundled with monthly bookkeeping

### 4.6 Bank Reconciliation (Standalone)
- **Service Code:** BOOK_BANKREC
- **Description:** Bank reconciliation service (standalone)
- **Entity Types:** All
- **Market Data:** Not specifically captured (usually bundled)
- **Pricing Model:** Fixed monthly or per account
- **Typical Price:** £20-50/month per account

---

## 5. MANAGEMENT ACCOUNTS

### 5.1 Management Accounts - Monthly
- **Service Code:** MGMT_ACCTS_MTH
- **Description:** Monthly management accounts and reporting
- **Entity Types:** Ltd, Partnership
- **Market Data:** 33 observations, £165 avg
- **Pricing Model:** Fixed monthly
- **Typical Tiers:**
  - Micro (0-100k): £80-120/month
  - Small (100-500k): £120-200/month
  - Medium (500k-1m): £200-350/month
  - Large (1m+): £350-500/month
- **Typical Inclusions:**
  - Monthly P&L statement
  - Balance sheet
  - Cash flow forecast
  - KPI dashboard
  - Monthly commentary

### 5.2 Cash Flow Forecasting
- **Service Code:** MGMT_CASHFLOW
- **Description:** Cash flow forecasting and scenario planning
- **Entity Types:** All
- **Market Data:** Often bundled with management accounts
- **Pricing Model:** Fixed monthly or project fee
- **Note:** Can be standalone or bundled with MGMT_ACCTS_MTH

### 5.3 KPI Dashboard
- **Service Code:** MGMT_KPI
- **Description:** Custom KPI dashboard and reporting
- **Entity Types:** All
- **Market Data:** Often bundled with management accounts
- **Pricing Model:** Fixed monthly or one-time setup + monthly
- **Note:** Can be standalone or bundled

### 5.4 Budget vs Actual Reporting
- **Service Code:** MGMT_BUDGET
- **Description:** Budget creation and variance analysis
- **Entity Types:** All
- **Market Data:** Often bundled with management accounts
- **Pricing Model:** Project fee for budget creation + monthly reporting

### 5.5 Financial Modeling
- **Service Code:** MGMT_MODEL
- **Description:** Financial modeling and scenario analysis
- **Entity Types:** All
- **Market Data:** Not in research (specialist service)
- **Pricing Model:** Project-based pricing

---

## 6. PAYROLL

### 6.1 Payroll Processing - Per Employee
- **Service Code:** PAY_BASE
- **Description:** Monthly payroll processing
- **Entity Types:** All employers
- **Market Data:** 42 observations, £42.15 avg
- **Pricing Model:** Per employee per month
- **Typical Tiers:**
  - 1-2 employees: £15-20/employee/month
  - 3-5 employees: £12-15/employee/month
  - 6-10 employees: £10-12/employee/month
  - 11-25 employees: £8-10/employee/month
  - 26+ employees: £6-8/employee/month
- **Typical Inclusions:**
  - Payslip generation
  - RTI submissions
  - P60s annual
  - Basic pension support

### 6.2 Payroll Processing - Per Run
- **Service Code:** PAY_RUN
- **Description:** Per-run payroll processing (alternative pricing)
- **Entity Types:** All employers
- **Market Data:** 16 observations, £25 avg per run
- **Pricing Model:** Per payroll run
- **Typical Pricing:**
  - Monthly run: £25-35/run
  - Bi-weekly run: £20-30/run
  - Weekly run: £15-25/run

### 6.3 CIS Returns
- **Service Code:** PAY_CIS
- **Description:** Construction Industry Scheme returns
- **Entity Types:** Ltd, Sole Trader (construction contractors)
- **Market Data:** 7 observations, £45 avg
- **Pricing Model:** Fixed monthly
- **Typical Tiers:**
  - 1-5 subcontractors: £37-45/month
  - 6-10 subcontractors: £45-53/month
  - 11+ subcontractors: £53+/month

### 6.4 Auto-Enrollment Pensions
- **Service Code:** PAY_PENSION
- **Description:** Auto-enrollment pension administration
- **Entity Types:** All employers
- **Market Data:** Not specifically captured (often bundled)
- **Pricing Model:** Per employee or included in payroll
- **Note:** Often bundled with PAY_BASE

### 6.5 P11D Benefits Reporting
- **Service Code:** PAY_P11D
- **Description:** Annual P11D benefits and expenses reporting
- **Entity Types:** Ltd, employers with benefits
- **Market Data:** Not in research
- **Pricing Model:** Annual fee or per P11D
- **Typical Price:** £50-100 per P11D annually

### 6.6 Payroll Year-End
- **Service Code:** PAY_YEAREND
- **Description:** Payroll year-end processing
- **Entity Types:** All employers
- **Market Data:** Not specifically captured
- **Pricing Model:** Annual fee
- **Note:** Often included in payroll service, sometimes separate

---

## 7. BUSINESS ADMIN

### 7.1 Confirmation Statement
- **Service Code:** ADMIN_CONFIRM
- **Description:** Annual Companies House confirmation statement
- **Entity Types:** Ltd, LLP
- **Market Data:** 4 observations, £9 avg
- **Pricing Model:** Fixed annual fee
- **Typical Price:** £8-10/month (annual fee normalized)

### 7.2 Company Formation
- **Service Code:** ADMIN_FORMATION
- **Description:** Company incorporation and registration
- **Entity Types:** Ltd (new formation)
- **Market Data:** Not in research (one-off service)
- **Pricing Model:** Fixed one-time fee
- **Typical Price:** £100-300 one-time
- **Typical Inclusions:**
  - Companies House registration
  - Memorandum and Articles
  - Initial shares allocation
  - First director appointment

### 7.3 Company Closure/Dissolution
- **Service Code:** ADMIN_CLOSURE
- **Description:** Company dissolution and final filings
- **Entity Types:** Ltd
- **Market Data:** 1 observation from GoForma, £485 one-time
- **Pricing Model:** Fixed project fee
- **Typical Price:** £400-600 one-time
- **Typical Inclusions:**
  - Final accounts
  - Final tax returns
  - Dissolution application
  - Members' voluntary liquidation (if needed)

### 7.4 Registered Office Address
- **Service Code:** ADMIN_REGOFFICE
- **Description:** Registered office address service
- **Entity Types:** Ltd, LLP
- **Market Data:** 2 observations, £10 avg (annual)
- **Pricing Model:** Fixed annual fee
- **Typical Price:** £5-15/month

### 7.5 Company Secretary Service
- **Service Code:** ADMIN_SECRETARY
- **Description:** Company secretary services
- **Entity Types:** Ltd, LLP
- **Market Data:** 1 observation, £15/month
- **Pricing Model:** Fixed monthly
- **Typical Price:** £15-30/month
- **Typical Inclusions:**
  - Statutory registers maintenance
  - Board minutes
  - Compliance monitoring

### 7.6 Director Appointments/Resignations
- **Service Code:** ADMIN_DIRECTOR
- **Description:** Director appointment or resignation filings
- **Entity Types:** Ltd, LLP
- **Market Data:** Not in research
- **Pricing Model:** Fixed per filing
- **Typical Price:** £50-100 per filing

### 7.7 Share Allotments/Transfers
- **Service Code:** ADMIN_SHARES
- **Description:** Share allotment or transfer documentation
- **Entity Types:** Ltd
- **Market Data:** Not in research
- **Pricing Model:** Fixed per transaction
- **Typical Price:** £100-200 per transaction

### 7.8 PSC Register Maintenance
- **Service Code:** ADMIN_PSC
- **Description:** Persons with Significant Control register maintenance
- **Entity Types:** Ltd, LLP
- **Market Data:** Not in research
- **Pricing Model:** Fixed annual or included in secretary service
- **Typical Price:** £50-100 annually or included

### 7.9 Mail Forwarding
- **Service Code:** ADMIN_MAIL
- **Description:** Mail handling and forwarding service
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Fixed monthly
- **Typical Price:** £10-20/month

---

## 8. ADVISORY

### 8.1 Tax Planning
- **Service Code:** ADV_TAX_PLAN
- **Description:** Proactive tax planning and optimization
- **Entity Types:** All
- **Market Data:** Often bundled in premium packages
- **Pricing Model:** TBD (hourly, fixed, or retainer)
- **Typical Approaches:**
  - Hourly rate: £100-200/hour
  - Annual retainer: £500-2000/year
  - Included in premium packages

### 8.2 Business Planning
- **Service Code:** ADV_BIZ_PLAN
- **Description:** Business plan creation and review
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based
- **Typical Price:** £500-2000 per plan

### 8.3 Financial Forecasting
- **Service Code:** ADV_FORECAST
- **Description:** Strategic financial forecasting
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based or monthly retainer
- **Note:** Different from MGMT_CASHFLOW (more strategic)

### 8.4 Dividend Planning
- **Service Code:** ADV_DIVIDEND
- **Description:** Dividend optimization and planning
- **Entity Types:** Ltd
- **Market Data:** Not in research
- **Pricing Model:** Hourly or annual review
- **Typical Price:** £200-500 annual review

### 8.5 Exit Planning
- **Service Code:** ADV_EXIT
- **Description:** Business exit and succession planning
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based
- **Typical Price:** £1000-5000+ depending on complexity

### 8.6 Strategic Reviews
- **Service Code:** ADV_STRATEGIC
- **Description:** Annual strategic business review
- **Entity Types:** All
- **Market Data:** Bundled in premium packages (InniAccounts Business tier)
- **Pricing Model:** Annual fee or quarterly reviews
- **Typical Price:** Included in £200+/month packages

### 8.7 Succession Planning
- **Service Code:** ADV_SUCCESSION
- **Description:** Business succession planning
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based
- **Typical Price:** £1000-3000+

---

## 9. SOFTWARE

### 9.1 Accounting Software Setup - Xero
- **Service Code:** SOFT_XERO_SETUP
- **Description:** Xero accounting software setup and configuration
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** One-time setup fee
- **Typical Price:** £200-500 one-time

### 9.2 Accounting Software Setup - QuickBooks
- **Service Code:** SOFT_QB_SETUP
- **Description:** QuickBooks setup and configuration
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** One-time setup fee
- **Typical Price:** £200-500 one-time

### 9.3 Accounting Software Setup - Sage
- **Service Code:** SOFT_SAGE_SETUP
- **Description:** Sage accounting software setup
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** One-time setup fee
- **Typical Price:** £300-600 one-time

### 9.4 Accounting Software Setup - FreeAgent
- **Service Code:** SOFT_FA_SETUP
- **Description:** FreeAgent setup and configuration
- **Entity Types:** All
- **Market Data:** Often bundled (Crunch, GoForma use FreeAgent)
- **Pricing Model:** One-time setup or included
- **Typical Price:** £150-400 one-time or included in package

### 9.5 Software Training
- **Service Code:** SOFT_TRAINING
- **Description:** Accounting software training sessions
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Hourly or per-session
- **Typical Price:** £50-100/hour or £200-400 per full-day session

### 9.6 Cloud Migration
- **Service Code:** SOFT_MIGRATION
- **Description:** Migration from legacy software to cloud accounting
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based
- **Typical Price:** £500-2000 depending on complexity

### 9.7 Software Support
- **Service Code:** SOFT_SUPPORT
- **Description:** Ongoing accounting software support
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Monthly retainer or hourly
- **Typical Price:** £50-150/month retainer or £60-100/hour

### 9.8 App Integrations
- **Service Code:** SOFT_INTEGRATIONS
- **Description:** Third-party app integrations (inventory, e-commerce, etc.)
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Per integration setup
- **Typical Price:** £100-300 per integration

---

## 10. AD-HOC

### 10.1 Due Diligence
- **Service Code:** ADHOC_DD
- **Description:** Financial due diligence for acquisitions/investments
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based or hourly
- **Typical Price:** £1000-10000+ depending on scope

### 10.2 HMRC Investigations/Disputes
- **Service Code:** ADHOC_HMRC_DISPUTE
- **Description:** HMRC investigation support and dispute resolution
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Hourly or fixed project fee
- **Typical Price:** £150-250/hour or £1000-5000 fixed

### 10.3 Grant Applications
- **Service Code:** ADHOC_GRANTS
- **Description:** Grant application support (BBL, CBILS, innovation grants, etc.)
- **Entity Types:** All
- **Market Data:** Not in research (was popular during COVID)
- **Pricing Model:** Fixed fee or % of grant
- **Typical Price:** £500-2000 or 5-10% of grant value

### 10.4 Business Valuations
- **Service Code:** ADHOC_VALUATION
- **Description:** Business valuation for sale, divorce, disputes
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based
- **Typical Price:** £1000-5000+ depending on complexity

### 10.5 Forensic Accounting
- **Service Code:** ADHOC_FORENSIC
- **Description:** Forensic accounting for fraud investigations, disputes
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Hourly
- **Typical Price:** £150-300/hour

### 10.6 One-Off Projects
- **Service Code:** ADHOC_PROJECT
- **Description:** Miscellaneous one-off accounting projects
- **Entity Types:** All
- **Market Data:** Not in research
- **Pricing Model:** Project-based or hourly
- **Typical Price:** Quote on request

---

## Summary Statistics

### Service Count by Category

| Category | Service Count | Market Data Coverage |
|----------|--------------|---------------------|
| Accounts | 5 | High (437 obs for main service) |
| Tax | 10 | High (174+ obs across services) |
| MTD | 5 | Medium (53 obs VAT only) |
| Bookkeeping | 6 | High (191 obs) |
| Management Accounts | 5 | Medium (33 obs) |
| Payroll | 6 | Medium (58 obs) |
| Business Admin | 9 | Low (limited obs) |
| Advisory | 7 | Very Low (bundled only) |
| Software | 8 | Not in research |
| Ad-Hoc | 6 | Not in research |

**Total Services:** 67 individual services across 10 categories

---

## Key Pricing Model Distribution

### Services Using Model A (Turnover/Income-Based)
- ACC_LTD, ACC_SOLE, ACC_PARTNERSHIP
- BOOK_MTH_A
- Most tax services (income-based tiers)

### Services Using Model B (Transaction/Volume-Based)
- BOOK_MTH_B (primary Model B service)
- BOOK_SALES_INV
- MTD_VAT (turnover-based tiers)
- PAY_BASE (per-employee)

### Services Using Fixed Pricing
- Most one-off services (formation, closure, confirmations)
- Annual services (P11D, year-end)

### Services Using Hourly/Project Pricing
- Advisory services
- Software services (some)
- Ad-Hoc services

---

## Next Steps for Pricing Structure

### For Services with Market Data:
1. ✅ Use research pricing as baseline
2. Adjust for Practice Hub positioning
3. Define exact tiers/bands

### For Services WITHOUT Market Data:
1. Research industry standards
2. Define pricing based on:
   - Time/effort required
   - Competitive positioning
   - Customer value perception

### Services Requiring Deep Dive:
1. **Advisory** - Need to decide hourly vs retainer vs project
2. **Software** - Need to define setup vs ongoing support pricing
3. **Ad-Hoc** - Need to standardize common project types

---

**Status:** DRAFT - Ready for review and refinement
**Next:** Define exact pricing for each service based on Practice Hub's strategic positioning
