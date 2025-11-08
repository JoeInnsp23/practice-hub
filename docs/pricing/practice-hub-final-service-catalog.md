# Practice Hub Final Service Catalog

**Version:** 2.0.0 (Final - Post Category Review)
**Date:** 2025-01-07
**Status:** Production-Ready
**Total Services:** 71 services across 10 categories

---

## Document Overview

This service catalog represents the complete Practice Hub service offering after comprehensive category-by-category review. All services have been validated, refined, and structured for implementation in the Practice Hub pricing calculator.

**Key Principles:**
- **À la carte pricing** - No package discounts, all services sold individually
- **Bundling for workflow** - Services can be bundled (e.g., ACC_LTD + TAX_CT) but priced separately for task/time tracking
- **Model A/B at proposal level** - Transaction-based vs turnover-based pricing is a proposal creator decision, not a customer-facing service option
- **Modifiers over proliferation** - Use frequency/complexity/entity modifiers instead of creating separate services

---

## Service Category Structure (10 Categories)

1. **Accounts** - Accounts production (5 services)
2. **Tax** - Tax returns all types (7 services)
3. **MTD** - Making Tax Digital VAT and Income Tax (5 services)
4. **Bookkeeping** - Transaction processing and bookkeeping (3 services)
5. **Management Accounts** - Management reporting and analysis (6 services)
6. **Payroll** - Payroll processing including CIS (11 services)
7. **Business Admin** - Company secretarial, formation, closure (9 services)
8. **Advisory** - Strategic and planning services (8 services)
9. **Software** - Xero setup and support (5 services)
10. **Ad-Hoc** - One-off projects and due diligence (12 services)

---

## CATEGORY 1: ACCOUNTS (5 services)

### 1.1 ACC_LTD - Limited Company Accounts
**Description:** Statutory accounts preparation and Companies House filing

**Entity Types:** Ltd, LLP

**Market Data:** 437 observations, £135.50 avg

**Pricing Model:** Model A (turnover-based tiers)

**Typical Inclusions:**
- Statutory accounts preparation
- Companies House filing
- Director's report
- Accounting policies

**Pricing:** See turnover band pricing table (TBD based on market research)

**Notes:**
- Bundled by default with TAX_CT (but priced separately for workflow)
- FRS variations (micro-entity, FRS 102, FRS 105) handled at task/checklist level, not pricing level

---

### 1.2 ACC_SOLE - Sole Trader Accounts
**Description:** Full accounts preparation for sole traders

**Entity Types:** Sole Trader

**Market Data:** Limited specific data (often bundled with tax return)

**Pricing Model:** Model A (income-based) or Fixed

**Typical Inclusions:**
- Income and expenditure accounts
- Balance sheet
- Accounting records preparation

**Pricing:** TBD

**Notes:**
- **ALWAYS bundled with TAX_SATR (Sole Trader)** by default
- Can be unbundled if needed, but default is bundled for workflow

---

### 1.3 ACC_PARTNERSHIP - Partnership Accounts
**Description:** Full partnership accounts and profit allocation

**Entity Types:** Partnership

**Market Data:** 6 observations, £35 avg (likely understated - this is for full accounts not just return)

**Pricing Model:** Base fee + per partner

**Typical Inclusions:**
- Partnership accounts preparation
- Profit/loss allocation
- Partner capital accounts

**Pricing:** £300 base (includes 2 partners) + £50 per additional partner (placeholder)

**Notes:**
- Partnership tax return (SA800) is separate service under TAX category
- Individual partner SA returns handled by TAX_SATR

---

### 1.4 ACC_DORMANT - Dormant Company Accounts
**Description:** Dormant company statutory accounts

**Entity Types:** Ltd

**Market Data:** 5 observations, £18 avg

**Pricing Model:** Fixed (low-cost)

**Typical Inclusions:**
- Dormant accounts preparation
- Companies House filing

**Pricing:** £18/month (from market data)

---

### 1.5 ACC_CLUBS_SOCIETIES - Clubs & Societies Accounts
**Description:** Accounts for registered social clubs and associations requiring FCA submissions

**Entity Types:** Unincorporated associations, social clubs, sports clubs

**Market Data:** None in research

**Pricing Model:** Fixed or complexity-based

**Typical Inclusions:**
- Accounts preparation
- FCA submissions (if required)
- Regulatory compliance

**Pricing:** £80-150/month (placeholder, similar to charity accounts from research)

---

## CATEGORY 2: TAX (7 services)

### 2.1 TAX_SATR - Self Assessment Tax Return
**Description:** Self assessment tax return preparation and HMRC filing

**Entity Modifier:** Individual (non-business), Sole Trader, Ltd Director, Partnership (individual partner)

**Market Data:** 174 observations, £42.30 avg (combined)

**Pricing Model:** Fixed fee (varies by entity type)

**Typical Inclusions:**
- Self assessment return preparation
- Tax computation
- HMRC filing

**Pricing by Entity Type (Placeholder):**
- **Individual (non-business):** Simple £35, Standard £45, Complex £75
- **Sole Trader:** Simple £40, Standard £60, Complex £85
- **Ltd Director:** Simple £45, Standard £60, Complex £75
- **Partnership (individual partner):** Simple £40, Standard £70, Complex £85

**Complexity Tiers:**
- Simple: Single income source, basic
- Standard: Multiple income sources, investments
- Complex: Multiple businesses, property, foreign income

**Notes:**
- Sole Trader version bundled by default with ACC_SOLE
- Can be unbundled if needed

---

### 2.2 TAX_CT - Corporation Tax Return
**Description:** Corporation tax computation and HMRC filing (CT600)

**Entity Types:** Ltd, LLP

**Market Data:** 12 observations, £45 avg (often bundled with accounts)

**Pricing Model:** Fixed fee

**Typical Inclusions:**
- CT600 preparation
- Tax computation
- HMRC filing

**Pricing:** £45/month (from market data)

**Notes:**
- Different timelines from ACC_LTD, kept separate for task/time tracking
- Bundled by default with ACC_LTD (no discount, just bundling)
- Can be unbundled if needed

---

### 2.3 TAX_PARTNERSHIP_RETURN - Partnership Tax Return (SA800)
**Description:** Partnership tax return and partner allocations

**Entity Types:** Partnership

**Market Data:** 6 observations, £35 avg

**Pricing Model:** Fixed + per partner

**Typical Inclusions:**
- Partnership return (SA800)
- Partner profit allocations
- HMRC filing

**Pricing:** £300 base (includes 2 partners) + £50 per additional partner

**Notes:**
- Partnership return only (not individual partner SA returns)
- Individual partner SA returns handled by TAX_SATR with partnership modifier
- Bundled by default but separate tasks for each partner

---

### 2.4 TAX_LANDLORD - Landlord/Property Tax
**Description:** Property income tax return for landlords (UK, overseas, non-resident)

**Entity Types:** Individual, Sole Trader

**Market Data:** 23 observations, £28.50 avg

**Pricing Model:** Tiered by property count

**Typical Inclusions:**
- Property income schedules
- Tax computation
- HMRC filing

**Pricing Tiers:**
- 1 property: £15-25/month
- 2-3 properties: £25-40/month
- 4-5 properties: £40-60/month
- 6+ properties: £60-75/month

**Complexity Levels:**
- UK landlords: Standard
- Overseas property: Higher complexity
- Non-resident landlords: Higher complexity

---

### 2.5 TAX_CGT - Capital Gains Tax Filing
**Description:** CGT computation and filing (shares, property, other assets)

**Entity Types:** Individual

**Market Data:** 8 observations, £125 avg

**Pricing Model:** Fixed per filing

**Typical Inclusions:**
- CGT computation
- HMRC filing

**Pricing:** £125 per filing (from market data)

---

### 2.6 TAX_RND - R&D Tax Credits
**Description:** R&D tax credit claims

**Entity Types:** Ltd

**Market Data:** Not in research (specialist service)

**Pricing Model:** Fixed one-off project fee

**Pricing:** £2000-5000 (placeholder)

**Notes:** High-value specialist service

---

### 2.7 TAX_CAPALLOW - Capital Allowances Claims
**Description:** Capital allowances optimization and claims

**Entity Types:** Ltd, Sole Trader, Partnership

**Market Data:** Not in research

**Pricing Model:** Fixed one-off project fee

**Pricing:** £500-2000 (placeholder)

**Notes:** Often one-off or annual review

---

## CATEGORY 3: MTD (5 services)

### 3.1 MTD_VAT - VAT Returns
**Description:** VAT return preparation and MTD submission

**Frequency Modifier:** Quarterly, Monthly

**Complexity Modifier:** Simple, Standard, Complex

**Entity Types:** All VAT-registered entities

**Market Data:**
- Quarterly: 47 observations, £58.50 avg
- Monthly: 6 observations, £75 avg

**Pricing Model:** Fixed monthly (monthly ~25-30% higher than quarterly)

**Typical Inclusions:**
- VAT return preparation
- MTD submission
- Basic VAT advice

**Pricing (Placeholder):**

**Quarterly:**
- Simple: £40-60/month
- Standard: £50-70/month
- Complex: £60-100/month

**Monthly:**
- Simple: £70-90/month
- Standard: £90-120/month
- Complex: £120-150/month

**Notes:**
- Model A/B pricing decision made at proposal level (not customer-facing option)
- Complexity tiers reflect level of service, not pricing model choice

---

### 3.2 MTD_ITSA - MTD for Income Tax
**Description:** Making Tax Digital for Income Tax (2026+ requirement)

**Entity Types:** Sole Trader, Partnership

**Frequency:** Quarterly submissions

**Complexity Modifier:** Simple, Standard, Complex

**Market Data:** None (new service - beta trial pricing needed)

**Pricing Model:** Fixed quarterly fee (normalized to monthly)

**Pricing:** TBD (beta trial pricing required)

**Notes:**
- New HMRC requirement starting 2026
- Include now for beta trial client pricing
- Quarterly submissions similar to VAT

---

### 3.3 MTD_VAT_REG - VAT Registration
**Description:** VAT registration application

**Entity Types:** All entity types

**Market Data:** Not in research, Add-ons file shows £5/month

**Pricing Model:** Fixed one-time fee

**Pricing:** £60 one-time (£5/month × 12 months normalized, or standalone fee TBD)

**Notes:** One-time service

---

### 3.4 MTD_VAT_DEREG - VAT Deregistration
**Description:** VAT deregistration application

**Entity Types:** All VAT-registered entities

**Market Data:** Not in research

**Pricing Model:** Fixed one-time fee

**Pricing:** £100-200 one-time (placeholder)

**Notes:** One-time service

---

### 3.5 MTD_VAT_SCHEME - VAT Scheme Changes
**Description:** VAT scheme changes (flat rate, cash accounting, standard, etc.)

**Entity Types:** All VAT-registered entities

**Market Data:** Not in research

**Pricing Model:** Fixed one-time fee

**Pricing:** £100-200 one-time (placeholder)

**Notes:** One-time service

---

## CATEGORY 4: BOOKKEEPING (3 services)

### 4.1 BOOK - Bookkeeping
**Description:** Transaction processing and bookkeeping services

**Frequency Modifier:** Monthly, Quarterly

**Complexity Modifier:** Simple, Full

**Entity Types:** All

**Market Data:**
- Monthly Model A: 163 observations, £118 avg
- Monthly Model B: 108 observations, £163 avg
- Quarterly: 21 observations, £42.85 avg

**Pricing Model:** Model A (turnover-based) OR Model B (transaction-based) - decided at proposal level

**Typical Inclusions:**
- Transaction processing
- Bank reconciliation
- Monthly/quarterly reports
- Creditor/debtor management

**Pricing (Model A - Turnover-Based):**
- Simple (0-50k): £60-100/month
- Full (250k+): £150-220/month

**Pricing (Model B - Transaction-Based):**
- 0-50 transactions: £60/month
- 51-100 transactions: £100/month
- 101-150 transactions: £140/month
- 151-200 transactions: £180/month
- 201-300 transactions: £250/month
- 301-400 transactions: £350/month
- 401+ transactions: Custom quote

**Notes:**
- Model B commands 43.6% premium over Model A (market research finding)
- Model A/B is proposal-level decision, NOT customer-facing service option
- Sales/purchase invoicing included in bookkeeping service (not separate)
- Bank reconciliation always included (not standalone)

---

### 4.2 BOOK_CASHFLOW - Cash Flow Tracking
**Description:** Cash flow position tracking and monitoring

**Frequency Modifier:** Daily, Weekly, Monthly

**Entity Types:** All

**Market Data:** Not in research (may be bundled with management accounts)

**Pricing Model:** Fixed monthly (varies by frequency)

**Pricing:** TBD

**Notes:**
- Different from MGMT_CASHFLOW (which is forecasting)
- This is actual cash position tracking
- Different from management accounts cash flow forecasting

---

### 4.3 BOOK_PROJECT_EXPENSE - Project Expense Tracking
**Description:** Project-based expense tracking (for construction, consultancies, agencies)

**Entity Types:** All (primarily construction, consultancies, agencies)

**Market Data:** Not in research

**Pricing Model:** Per project tracked or volume tiers

**Pricing:** TBD (likely per project or included in bookkeeping)

**Notes:**
- Like bookkeeping but organized by project/job
- For businesses tracking expenses by project/job code

---

## CATEGORY 5: MANAGEMENT ACCOUNTS (6 services)

### 5.1 MGMT_ACCTS - Management Accounts
**Description:** Management accounts and reporting

**Frequency Modifier:** Monthly, Quarterly

**Entity Types:** Ltd, Partnership (primarily)

**Market Data:** 33 observations, £165 avg (monthly)

**Pricing Model:** Fixed monthly/quarterly

**Basic Reporting Included:**
- P&L statement
- Balance sheet
- Basic cash flow
- Standard KPIs
- Monthly/quarterly commentary

**Pricing Tiers (Monthly):**
- Micro (0-100k): £80-120/month
- Small (100-500k): £120-200/month
- Medium (500k-1m): £200-350/month
- Large (1m+): £350-500/month

**Pricing Tiers (Quarterly):**
- TBD (likely 60-70% of monthly pricing)

**Notes:**
- Basic reporting included in base service
- Custom reporting available as add-ons (services below)

---

### 5.2 MGMT_CASHFLOW - Cash Flow Forecasting (Custom)
**Description:** Advanced cash flow forecasting and scenario planning

**Entity Types:** All

**Market Data:** Often bundled with management accounts

**Pricing Model:** Fixed add-on or hourly

**Pricing:** TBD

**Notes:**
- Add-on to MGMT_ACCTS or standalone
- Different from BOOK_CASHFLOW (this is forecasting, that is tracking)
- Custom/advanced forecasting beyond basic cash flow in MGMT_ACCTS

---

### 5.3 MGMT_KPI - Custom KPI Dashboard
**Description:** Custom KPI dashboard and reporting (beyond standard KPIs)

**Entity Types:** All

**Market Data:** Often bundled with management accounts

**Pricing Model:** Fixed add-on or setup fee + monthly

**Pricing:** TBD

**Notes:**
- Add-on to MGMT_ACCTS or standalone
- Custom KPIs beyond standard reporting in MGMT_ACCTS

---

### 5.4 MGMT_BUDGET - Budget vs Actual Reporting
**Description:** Budget creation and variance analysis

**Entity Types:** All

**Market Data:** Often bundled with management accounts

**Pricing Model:** Project fee for budget creation + monthly reporting add-on

**Pricing:** TBD

**Notes:**
- Add-on to MGMT_ACCTS or standalone
- Budget creation is one-time project
- Variance reporting is ongoing monthly add-on

---

### 5.5 MGMT_PROFIT_CENTER - Profit/Cost Center Reporting
**Description:** Departmental P&Ls, cost center reporting

**Entity Types:** All (primarily medium-large businesses)

**Market Data:** Not in research

**Pricing Model:** Per center/department or fixed add-on

**Pricing:** TBD (likely per center tracked)

**Notes:**
- Add-on to MGMT_ACCTS
- For businesses tracking performance by department/division

---

### 5.6 MGMT_PRODUCT - Product Profitability Analysis
**Description:** Product/service line profitability analysis

**Entity Types:** All (primarily product businesses)

**Market Data:** Not in research

**Pricing Model:** Per product line or fixed add-on

**Pricing:** TBD (likely per product line tracked)

**Notes:**
- Add-on to MGMT_ACCTS
- For businesses tracking profitability by product/service

---

## CATEGORY 6: PAYROLL (11 services)

### 6.1 PAYROLL_DIRECTOR - Director-Only Payroll
**Description:** Minimal payroll for directors only

**Frequency:** Monthly only

**Entity Types:** Ltd (directors)

**Market Data:** Not in research

**Current Pricing:** £18/month (from Practice Hub pricing file)

**Typical Inclusions:**
- Payslips
- RTI submissions
- P60s
- SSP/SMP handling

**Notes:**
- Simplest payroll service
- Directors only
- Monthly frequency only (no weekly/bi-weekly options)

---

### 6.2 PAYROLL - Standard Payroll
**Description:** Standard payroll processing

**Employee Tiers:** 0-20 employees, 20+ employees (per employee)

**Frequency Modifier:** Weekly, Bi-Weekly, 4-Weekly, Monthly

**Entity Types:** All employers

**Market Data:** 42 observations, £42.15 avg

**Current Pricing:**

**0-20 Employees (Base Fee):**
- Monthly: £36
- 4-Weekly: £39
- Bi-Weekly: £78
- Weekly: £156

**20+ Employees (Per Employee):**
- Monthly: £1.80/employee
- 4-Weekly: £1.95/employee
- Bi-Weekly: £3.90/employee
- Weekly: £7.80/employee

**Typical Inclusions:**
- Payslips generation
- RTI submissions
- P60s annual
- SSP/SMP handling

**Notes:**
- 0-20 employees: Base fee covers up to 20 employees
- 20+ employees: Per-employee pricing (much cheaper per head)
- Frequency affects base pricing: Weekly ~4.3x monthly, Bi-Weekly ~2.2x monthly

---

### 6.3 PAYROLL_CIS - CIS Payroll
**Description:** Construction Industry Scheme payroll

**Frequency Modifier:** Weekly, Monthly (most common for construction)

**Entity Types:** Ltd, Sole Trader (construction contractors)

**Market Data:** 7 observations, £45 avg

**Pricing Model:** Base fee + per subcontractor

**Typical Inclusions:**
- CIS deductions
- RTI submissions
- Subcontractor verification

**Pricing:** TBD (market data shows £45 avg)

**Tiers:**
- 1-5 subcontractors: £37-45/month
- 6-10 subcontractors: £45-53/month
- 11+ subcontractors: £53+/month

**Notes:**
- Separate from standard payroll
- Runs through payroll software
- CIS specific compliance

---

### 6.4 PAYROLL_PENSION - Pension Submissions
**Description:** Pension scheme submissions

**Frequency Modifier:** Weekly, Bi-Weekly, 4-Weekly, Monthly

**Entity Types:** All employers with pensions

**Market Data:** Not in research

**Current Pricing:**
- Monthly: £12
- 4-Weekly: £13
- Bi-Weekly: £19.50
- Weekly: £32.50

**Notes:**
- Separate from payroll (billed separately)
- Similar frequency structure to payroll
- Weekly is 2.7x monthly cost

---

### 6.5 PAYROLL_PENSION_SETUP - Auto-Enrollment Setup
**Description:** One-time auto-enrollment pension setup

**Entity Types:** All employers

**Market Data:** Not in research

**Pricing Model:** One-time setup fee

**Pricing:** £200-400 one-time (placeholder)

**Notes:** One-time service when setting up auto-enrollment

---

### 6.6 PAYROLL_PAYE_SETUP - PAYE Setup
**Description:** PAYE scheme registration and setup for new businesses

**Entity Types:** All employers

**Market Data:** Add-ons file shows £5

**Pricing Model:** One-time setup fee

**Current Pricing:** £5 one-time (from Practice Hub add-ons file)

**Notes:**
- One-time service
- Setup when business first hires employees

---

### 6.7 PAYROLL_MODULR - Modulr Payment Service
**Description:** Payroll payment handling through Modulr client account

**Frequency Modifier:** Weekly, Bi-Weekly, Monthly

**Entity Types:** All employers

**Market Data:** Not in research

**Current Pricing:**
- Monthly: £10
- Bi-Weekly: £30
- Weekly: £60

**Notes:**
- Optional add-on service
- Inverse relationship: Weekly is 6x monthly (reflects more payment transactions)

---

### 6.8 PAYROLL_P11D - P11D Benefits Reporting
**Description:** Annual P11D benefits and expenses reporting

**Entity Types:** Ltd and employers with benefits

**Market Data:** Not in research

**Pricing Model:** Per P11D annually

**Pricing:** £50-100 per P11D (placeholder from market research)

**Notes:**
- Annual service
- Per director/employee receiving benefits

---

### 6.9 PAYROLL_HOLIDAY - Holiday Tracking
**Description:** Holiday/leave tracking and accrual

**Entity Types:** All employers

**Market Data:** Not in research

**Pricing Model:** Currently included in payroll software

**Pricing:** £0 (currently part of software), scaffolded for future add-on pricing

**Notes:**
- Currently part of payroll software (no charge)
- May start charging as add-on in future
- Scaffolded in catalog for future implementation

---

### 6.10 PAYROLL_YEAREND - Payroll Year-End
**Description:** Payroll year-end processing and final submissions

**Entity Types:** All employers

**Market Data:** Not in research

**Pricing Model:** Annual fee

**Pricing:** TBD

**Notes:**
- Annual service
- Year-end processing and final submissions

---

### 6.11 PAYROLL_CLOSURE - PAYE Scheme Closure
**Description:** Closing down PAYE scheme when business ceases payroll

**Entity Types:** All employers

**Market Data:** Not in research

**Pricing Model:** One-time project fee

**Pricing:** TBD

**Notes:**
- One-time service
- When business stops employing or ceases trading

---

## CATEGORY 7: BUSINESS ADMIN (9 services)

### 7.1 ADMIN_CONFIRM - Confirmation Statement
**Description:** Annual Companies House confirmation statement

**Entity Types:** Ltd, LLP

**Market Data:** 4 observations, £9 avg

**Pricing Model:** Fixed annual fee (normalized to monthly)

**Pricing:** £9/month (from market data)

**Notes:**
- Billed separately (not bundled with secretary service)
- Annual compliance requirement

---

### 7.2 ADMIN_REGOFFICE - Registered Office Address
**Description:** Registered office address service

**Entity Types:** Ltd, LLP

**Market Data:** 2 observations, £10 avg (annual)

**Pricing Model:** Fixed monthly

**Pricing:** £10/month (from market data)

**Notes:**
- Billed separately (not bundled with secretary service)
- Ongoing monthly service

---

### 7.3 ADMIN_SECRETARY - Company Secretary Service
**Description:** Full company secretary services

**Entity Types:** Ltd, LLP

**Market Data:** 1 observation, £15/month

**Pricing Model:** Fixed monthly

**Pricing:** £15-30/month (market data shows £15)

**Includes:**
- Statutory books/registers maintenance
- Board minutes preparation
- Shareholder resolutions
- PSC register maintenance
- Compliance monitoring

**Notes:**
- Comprehensive secretarial service
- Does NOT include registered office or confirmation statement (billed separately)

---

### 7.4 ADMIN_FORMATION - Limited Company Formation
**Description:** Ltd company incorporation and registration

**Entity Types:** Ltd (new formations only)

**Market Data:** Not in research

**Pricing Model:** Fixed one-time fee

**Pricing:** £100-300 one-time (placeholder)

**Includes:**
- Companies House registration
- Memorandum and Articles
- Initial shares allocation
- First director appointment

**Notes:**
- One-time service
- Ltd formations only (not LLP, Partnership)

---

### 7.5 ADMIN_DISSOLUTION - Company Dissolution
**Description:** Voluntary company dissolution and final filings

**Entity Types:** Ltd

**Market Data:** 1 observation (GoForma), £485 one-time

**Pricing Model:** Fixed project fee

**Pricing:** £400-600 one-time (market data shows £485)

**Includes:**
- Final accounts
- Final tax returns
- Dissolution application
- Members' voluntary liquidation (if needed)

**Notes:**
- One-time service
- Full dissolution process

---

### 7.6 ADMIN_STRIKING_OFF - Company Striking Off
**Description:** Striking off company from Companies House register

**Entity Types:** Ltd

**Market Data:** Not in research

**Pricing Model:** Fixed one-time fee

**Pricing:** £200-400 one-time (placeholder)

**Notes:**
- One-time service
- Simpler/cheaper than full dissolution
- Different process from ADMIN_DISSOLUTION

---

### 7.7 ADMIN_DIRECTOR - Director Appointments/Resignations
**Description:** Director appointment or resignation filings

**Entity Types:** Ltd, LLP

**Market Data:** Not in research

**Pricing Model:** Fixed per filing

**Pricing:** £50-100 per filing (placeholder)

**Notes:** One-time per appointment/resignation

---

### 7.8 ADMIN_SHARES - Share Allotments/Transfers
**Description:** Share allotment or transfer documentation

**Entity Types:** Ltd

**Market Data:** Not in research

**Pricing Model:** Fixed per transaction

**Pricing:** £100-200 per transaction (placeholder)

**Notes:** One-time per share transaction

---

### 7.9 ADMIN_MAIL - Mail Forwarding
**Description:** Mail handling and forwarding service

**Entity Types:** All

**Market Data:** Not in research

**Pricing Model:** Fixed monthly

**Pricing:** £10-20/month (placeholder)

**Notes:** Ongoing monthly service

---

## CATEGORY 8: ADVISORY (8 services)

**All advisory services priced hourly with rate tiers:**
- **Junior:** £100/hour
- **Senior:** £150/hour
- **Partner:** £200/hour
- **VIP:** £300/hour

**All advisory services sold à la carte only (no bundling)**

---

### 8.1 ADV_TAX_PLAN - Tax Planning
**Description:** Proactive tax planning and optimization

**Includes:**
- IHT (Inheritance Tax) planning
- Restructuring advice
- Group structures
- Demergers

**Entity Types:** All

**Market Data:** Often bundled in premium packages

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.2 ADV_DIVIDEND - Dividend Planning
**Description:** Dividend optimization and planning

**Entity Types:** Ltd

**Market Data:** Not in research

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.3 ADV_BIZ_PLAN - Business Planning
**Description:** Business plan creation and review

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.4 ADV_FORECAST - Financial Forecasting (One-Off)
**Description:** Strategic financial forecasting

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

**Notes:**
- One-off projects (NOT regular)
- Different from MGMT_CASHFLOW (which is recurring)
- Strategic forecasting vs operational cash flow tracking

---

### 8.5 ADV_STRATEGIC - Strategic Reviews
**Description:** Annual strategic business review

**Entity Types:** All

**Market Data:** Bundled in premium packages

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.6 ADV_EXIT - Exit Planning
**Description:** Business exit planning

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.7 ADV_MA - Mergers & Acquisitions Advisory
**Description:** M&A advisory services

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate (£100-£300 by seniority/VIP)

---

### 8.8 ADV_VCFO - Virtual CFO Services
**Description:** Virtual CFO / outsourced finance director services

**Pricing Modifier:** Hourly rate OR Monthly retainer

**Entity Types:** All

**Market Data:** Not in research

**Pricing:**
- Hourly: £100-£300 by seniority/VIP
- OR Monthly retainer: TBD

**Notes:**
- Can be priced hourly OR as monthly retainer
- Retainer option for ongoing CFO services

---

## CATEGORY 9: SOFTWARE (5 services - Xero Focused)

**Practice Hub is a Xero partner - all software services Xero-focused**

---

### 9.1 SOFT_XERO_SETUP - Xero Setup
**Description:** Xero accounting software setup and configuration

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** £300 one-time (placeholder)

**Notes:**
- One-time setup service
- Primary software platform for Practice Hub

---

### 9.2 SOFT_TRAINING - Software Training
**Description:** Xero software training sessions

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** £25/hour

**Notes:**
- Hourly rate for training
- Lower than advisory hourly rate

---

### 9.3 SOFT_MIGRATION - Cloud Migration to Xero
**Description:** Migration from legacy software to Xero

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Project-based (depends on complexity)

**Pricing Range:** £500-£2000 (placeholder depending on complexity)

**Notes:**
- Project-based pricing
- Complexity depends on data volume, legacy system, cleanup required

---

### 9.4 SOFT_INTEGRATIONS - Xero App Integrations
**Description:** Third-party app integrations via Xero marketplace

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Depends on complexity

**Pricing Range:** £150-£500 per integration (placeholder)

**Notes:**
- Per integration setup
- Xero marketplace apps (inventory, e-commerce, payroll, etc.)

---

### 9.5 SOFT_AUDIT - Software Audit
**Description:** Xero software audit and health check

**Includes:**
- Setup review
- Chart of accounts review
- Process review
- Integration review

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Depends on complexity

**Pricing Range:** £300-£800 per audit (placeholder)

**Notes:**
- One-time audit service
- Comprehensive Xero health check

---

## CATEGORY 10: AD-HOC (12 services)

### 10.1 ADHOC_DD - Due Diligence
**Description:** Financial due diligence for acquisitions/investments

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Project-based or hourly (depends on complexity)

**Pricing Range:** £1000-£10000+ (placeholder)

---

### 10.2 ADHOC_VALUATION - Business Valuations
**Description:** Business valuation for sale, divorce, disputes

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Project-based

**Pricing Range:** £1000-£5000+ (placeholder)

---

### 10.3 ADHOC_FORENSIC - Forensic Accounting
**Description:** Forensic accounting for fraud investigations, disputes

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate

**Pricing Range:** £150-£300/hour (placeholder)

---

### 10.4 ADHOC_HMRC_DISPUTE - HMRC Investigations/Disputes
**Description:** HMRC investigation support and dispute resolution

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate

**Pricing Range:** £150-£300/hour (placeholder)

**Notes:**
- Moved from Advisory category
- Hourly billing for HMRC support

---

### 10.5 ADHOC_VAT_APPEAL - VAT Penalty Appeals
**Description:** VAT penalty appeals

**Entity Types:** All VAT-registered

**Market Data:** Not in research

**Pricing:** Fixed fee

**Pricing Range:** £500-£2000 per appeal (placeholder)

**Notes:**
- Fixed fee per appeal
- Not hourly

---

### 10.6 ADHOC_TAX_APPEAL - Tax Penalty Appeals
**Description:** Tax penalty appeals (all types)

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Fixed fee

**Pricing Range:** £500-£2000 per appeal (placeholder)

**Notes:**
- Fixed fee per appeal
- Not hourly

---

### 10.7 ADHOC_SDLT - SDLT for Share Transfers
**Description:** Stamp Duty Land Tax for share transfers

**Entity Types:** Ltd

**Market Data:** Not in research

**Pricing:** Fixed fee per filing

**Pricing Range:** £200-£500 per filing (placeholder)

**Notes:**
- Rare service
- One-time per transaction

---

### 10.8 ADHOC_GRANTS - Grant Applications
**Description:** Grant application support (innovation grants, regional grants, etc.)

**Entity Types:** All

**Market Data:** Not in research (was popular during COVID)

**Pricing:** Fixed fee or % of grant value

**Pricing Range:** £500-£2000 or 5-10% of grant (placeholder)

**Notes:**
- COVID grants ended, but other grants still available
- Can be fixed fee or success-based

---

### 10.9 ADHOC_LOAN_SUPPORT - Loan Applications Support
**Description:** Business loan application support

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Fixed fee or hourly

**Pricing Range:** £500-£1500 per application (placeholder)

---

### 10.10 ADHOC_MORTGAGE_SUPPORT - Mortgage Applications Support
**Description:** Mortgage application support (accounts for mortgage, landlord certificates)

**Entity Types:** Individual, Sole Trader

**Market Data:** Not in research

**Pricing:** Fixed fee

**Pricing Range:** £200-£500 per application (placeholder)

---

### 10.11 ADHOC_BOOK_CATCHUP - Bookkeeping Catch-Up
**Description:** Backlog bookkeeping cleanup

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Hourly rate or project-based (depends on backlog size)

**Pricing Range:** £50-£100/hour or £500-£3000 project (placeholder)

**Notes:**
- Pricing depends on backlog size and complexity
- Can be hourly or fixed project fee

---

### 10.12 ADHOC_PROJECT - One-Off Projects
**Description:** Miscellaneous one-off accounting projects

**Entity Types:** All

**Market Data:** Not in research

**Pricing:** Quote on request (hourly or project-based)

**Notes:** Catch-all for projects not covered by other services

---

## Service Pricing Summary

### Services with Market Data (Ready to Price):

| Service | Market Data | Avg Price | Quality |
|---------|-------------|-----------|---------|
| ACC_LTD | 437 obs | £135.50 | High |
| ACC_DORMANT | 5 obs | £18 | Medium |
| TAX_SATR | 174 obs | £42.30 | High |
| TAX_CT | 12 obs | £45 | Medium |
| TAX_LANDLORD | 23 obs | £28.50 | Medium |
| TAX_CGT | 8 obs | £125 | Medium |
| MTD_VAT (Qtr) | 47 obs | £58.50 | High |
| MTD_VAT (Mth) | 6 obs | £75 | Low |
| BOOK (Model A) | 163 obs | £118 | High |
| BOOK (Model B) | 108 obs | £163 | High |
| MGMT_ACCTS | 33 obs | £165 | Medium |
| PAYROLL_BASE | 42 obs | £42.15 | Medium |
| PAYROLL_CIS | 7 obs | £45 | Low |

### Services with Practice Hub Current Pricing:

| Service | Current Price | Source |
|---------|--------------|--------|
| PAYROLL_DIRECTOR | £18/month | Payroll pricing file |
| PAYROLL (0-20) | £36-£156/month | Payroll pricing file |
| PAYROLL (20+) | £1.80-£7.80/employee | Payroll pricing file |
| PAYROLL_PENSION | £12-£32.50/month | Pension pricing file |
| PAYROLL_PAYE_SETUP | £5 one-time | Add-ons file |
| PAYROLL_MODULR | £10-£60/month | Add-ons file |
| MTD_VAT_REG | £5/month | Add-ons file |

### Services Requiring Pricing (No Data):

**High Priority (Common Services):**
- ACC_SOLE (bundled with TAX_SATR, but need separate pricing)
- ACC_PARTNERSHIP (have £300 base + £50/partner placeholder)
- ACC_CLUBS_SOCIETIES (new service, £80-150 placeholder)
- TAX_RND (£2000-5000 placeholder)
- TAX_CAPALLOW (£500-2000 placeholder)
- MTD_ITSA (new service, beta trial pricing needed)
- BOOK_CASHFLOW (new service)
- BOOK_PROJECT_EXPENSE (new service)

**Medium Priority (Add-Ons):**
- MGMT add-ons (MGMT_CASHFLOW, MGMT_KPI, MGMT_BUDGET, MGMT_PROFIT_CENTER, MGMT_PRODUCT)
- PAYROLL add-ons (PAYROLL_PENSION_SETUP, PAYROLL_YEAREND, PAYROLL_CLOSURE, PAYROLL_HOLIDAY)

**Lower Priority (Specialist/Rare):**
- All Advisory services (£100-£300/hour confirmed, just need documentation)
- All Software services (placeholders confirmed)
- All Ad-Hoc services (placeholders confirmed)
- Business Admin services (placeholders from market research)

---

## Key Modifiers Summary

### Frequency Modifiers

**Services with Frequency Modifiers:**
- MTD_VAT: Quarterly, Monthly
- BOOK: Monthly, Quarterly
- BOOK_CASHFLOW: Daily, Weekly, Monthly
- MGMT_ACCTS: Monthly, Quarterly
- PAYROLL: Weekly, Bi-Weekly, 4-Weekly, Monthly
- PAYROLL_CIS: Weekly, Monthly
- PAYROLL_PENSION: Weekly, Bi-Weekly, 4-Weekly, Monthly
- PAYROLL_MODULR: Weekly, Bi-Weekly, Monthly

### Complexity Modifiers

**Services with Complexity Modifiers:**
- MTD_VAT: Simple, Standard, Complex
- MTD_ITSA: Simple, Standard, Complex
- BOOK: Simple, Full
- TAX_SATR: Simple, Standard, Complex (within each entity type)

### Entity Type Modifiers

**Services with Entity Type Modifiers:**
- TAX_SATR: Individual (non-business), Sole Trader, Ltd Director, Partnership (individual partner)

### Pricing Model Modifiers

**Services with Pricing Model Modifiers:**
- ADV_VCFO: Hourly OR Monthly retainer

**Services Where Model A/B is Proposal-Level Decision (Not Customer-Facing):**
- BOOK (Model A turnover-based OR Model B transaction-based)
- MTD_VAT (turnover bands OR transaction-based - proposal decision)

---

## Implementation Notes

### Database Schema Implications

**Service Table Fields Required:**
- `service_code` (unique identifier)
- `service_name`
- `category` (10 categories)
- `description`
- `entity_types` (array: ltd, sole_trader, partnership, llp, cic, individual)
- `pricing_model` (fixed, hourly, project, per_employee, per_transaction, tiered)
- `base_price` (where applicable)
- `has_frequency_modifier` (boolean)
- `has_complexity_modifier` (boolean)
- `has_entity_modifier` (boolean)
- `market_data_observations` (int)
- `market_data_avg_price` (decimal)
- `is_active` (boolean)
- `is_bundled_default` (boolean - e.g., ACC_LTD + TAX_CT)
- `bundled_with_service_code` (nullable, references service_code)

**Modifier Tables:**
- `frequency_modifiers` (weekly, bi-weekly, 4-weekly, monthly, quarterly, daily)
- `complexity_modifiers` (simple, standard, complex, full)
- `entity_modifiers` (individual, sole_trader, ltd_director, partnership_partner)
- `pricing_tiers` (for services with tier-based pricing)

**Pricing Tables:**
- `service_pricing` (service_code, frequency, complexity, entity_type, tier_from, tier_to, price)
- `hourly_rates` (service_code, rate_tier: junior/senior/partner/vip, hourly_rate)

### Bundling Logic

**Default Bundles (No Discount, Separate Pricing for Workflow):**
- ACC_LTD + TAX_CT
- ACC_SOLE + TAX_SATR (Sole Trader)
- TAX_PARTNERSHIP_RETURN + TAX_SATR (per partner)
- MGMT_ACCTS + MGMT add-ons (optional)

**Bundling Rules:**
- Services bundled by default but priced separately
- No package discounts
- Bundling is for workflow/task tracking, not pricing
- Can be unbundled if customer needs only one service

### Model A/B Implementation

**NOT a customer-facing service option:**
- Proposal creator decides Model A or Model B
- Same service code (BOOK) regardless of model
- Pricing calculator shows different tiers based on model selection
- Model A: Turnover-based tiers
- Model B: Transaction-based tiers

**Customer sees:**
- "Bookkeeping - Monthly" (service name)
- Price based on their turnover OR transaction volume (depending on proposal creator's model choice)

**Proposal creator sees:**
- Toggle: "Use Model A (turnover-based)" OR "Use Model B (transaction-based)"
- Pricing calculator adjusts tiers accordingly

---

## Next Steps for Pricing Implementation

### Phase 1: Finalize Core Service Pricing
1. Review and approve all market-data-based pricing
2. Define exact tiers for services with placeholder pricing
3. Create pricing tables for all modifier combinations

### Phase 2: Database Schema
1. Create service catalog tables
2. Create modifier tables
3. Create pricing tables
4. Populate with all 71 services

### Phase 3: Pricing Calculator Logic
1. Implement service selection UI
2. Implement modifier selection (frequency, complexity, entity)
3. Implement Model A/B toggle (proposal creator only)
4. Implement bundling logic
5. Implement pricing calculation engine

### Phase 4: Proposal Generation
1. Service selection from catalog
2. Automatic bundling suggestions
3. Pricing display (itemized, no package discounts)
4. Task/time tracking integration

---

## Appendix A: Service Code Quick Reference

### Accounts (ACC_*)
- ACC_LTD, ACC_SOLE, ACC_PARTNERSHIP, ACC_DORMANT, ACC_CLUBS_SOCIETIES

### Tax (TAX_*)
- TAX_SATR, TAX_CT, TAX_PARTNERSHIP_RETURN, TAX_LANDLORD, TAX_CGT, TAX_RND, TAX_CAPALLOW

### MTD (MTD_*)
- MTD_VAT, MTD_ITSA, MTD_VAT_REG, MTD_VAT_DEREG, MTD_VAT_SCHEME

### Bookkeeping (BOOK_*)
- BOOK, BOOK_CASHFLOW, BOOK_PROJECT_EXPENSE

### Management Accounts (MGMT_*)
- MGMT_ACCTS, MGMT_CASHFLOW, MGMT_KPI, MGMT_BUDGET, MGMT_PROFIT_CENTER, MGMT_PRODUCT

### Payroll (PAYROLL_*)
- PAYROLL_DIRECTOR, PAYROLL, PAYROLL_CIS, PAYROLL_PENSION, PAYROLL_PENSION_SETUP, PAYROLL_PAYE_SETUP, PAYROLL_MODULR, PAYROLL_P11D, PAYROLL_HOLIDAY, PAYROLL_YEAREND, PAYROLL_CLOSURE

### Business Admin (ADMIN_*)
- ADMIN_CONFIRM, ADMIN_REGOFFICE, ADMIN_SECRETARY, ADMIN_FORMATION, ADMIN_DISSOLUTION, ADMIN_STRIKING_OFF, ADMIN_DIRECTOR, ADMIN_SHARES, ADMIN_MAIL

### Advisory (ADV_*)
- ADV_TAX_PLAN, ADV_DIVIDEND, ADV_BIZ_PLAN, ADV_FORECAST, ADV_STRATEGIC, ADV_EXIT, ADV_MA, ADV_VCFO

### Software (SOFT_*)
- SOFT_XERO_SETUP, SOFT_TRAINING, SOFT_MIGRATION, SOFT_INTEGRATIONS, SOFT_AUDIT

### Ad-Hoc (ADHOC_*)
- ADHOC_DD, ADHOC_VALUATION, ADHOC_FORENSIC, ADHOC_HMRC_DISPUTE, ADHOC_VAT_APPEAL, ADHOC_TAX_APPEAL, ADHOC_SDLT, ADHOC_GRANTS, ADHOC_LOAN_SUPPORT, ADHOC_MORTGAGE_SUPPORT, ADHOC_BOOK_CATCHUP, ADHOC_PROJECT

---

**Document Status:** ✅ COMPLETE - Ready for Pricing Finalization and Implementation

**Total Services:** 71 services across 10 categories
**Last Updated:** 2025-01-07
**Version:** 2.0.0 (Final - Post Category Review)
