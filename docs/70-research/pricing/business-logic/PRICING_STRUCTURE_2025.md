# Practice Hub Pricing Structure 2025

**Version:** 1.0
**Last Updated:** September 30, 2025
**Status:** Reference Document

> **⚠️ PRICE DISCLAIMER:** Prices shown in this document are examples from the 2025-09-30 snapshot and may not reflect current pricing. All pricing is now database-driven via the `pricingRules` table and configurable through the admin interface. **Use the proposal calculator for current, accurate pricing.**

---

## Table of Contents

1. [Overview](#overview)
2. [Philosophy](#philosophy)
3. [Pricing Models](#pricing-models)
4. [Service Components](#service-components)
5. [Pricing Tables](#pricing-tables)
6. [Calculation Logic](#calculation-logic)
7. [Common Scenarios](#common-scenarios)
8. [Implementation Notes](#implementation-notes)

---

## Overview

This document defines our complete modular, component-based pricing system. We've moved away from rigid package tiers to a flexible system where clients pay only for the services they need, priced accurately based on either their turnover or transaction volume.

### Key Features

- **Modular Services**: Pick and choose individual services
- **Dual Pricing Models**: Choose turnover-based or transaction-based pricing
- **Transparent Pricing**: Clients see exactly what they're paying for
- **Data-Driven**: Use actual Xero data for accurate quotes
- **Scalable**: Works for micro-businesses to £5M+ turnover companies

---

## Philosophy

### Why Modular Pricing?

1. **Fairness**: Low-transaction clients don't subsidize high-transaction clients
2. **Flexibility**: Add/remove services as business needs change
3. **Competitiveness**: Can undercut package-based competitors
4. **Transparency**: No hidden costs or surprise fees
5. **Accuracy**: Transaction data = precise pricing

### When to Use Each Model

**Model A (Turnover-Based):**
- New clients without transaction data
- Quick quotes needed
- Industry-standard pricing
- Client prefers simplicity

**Model B (Transaction-Based):**
- Existing Xero users
- Historical data available
- More accurate pricing required
- High or low transaction volumes relative to turnover

---

## Pricing Models

### Model A: Turnover-Based Pricing

Traditional approach using turnover bands as the primary pricing factor.

**Formula:**
```
Service Price = Base Price [turnover band] × Complexity Multiplier × Industry Multiplier
```

**Complexity Multipliers:**
- Clean books: 0.95
- Average: 1.0
- Complex/Poor records: 1.15
- Disaster zone: 1.4

**Industry Multipliers:**
- Simple (consultancy, freelance): 0.95
- Standard (most businesses): 1.0
- Complex (retail, hospitality, construction): 1.15
- Regulated (financial services): 1.3

---

### Model B: Transaction-Based Pricing

Data-driven approach using actual monthly transaction volumes.

**Formula:**
```
Service Price = Base Price + (Transactions × Rate [transaction band]) × Complexity Multiplier
```

**Transaction Definition:**
Any bank movement including:
- Income/sales
- Expenses/purchases
- Transfers (counted once)
- Bank fees
- Refunds
- Adjustments

**Complexity Multipliers (Lower Impact):**
- Clean books: 0.95
- Average: 1.0
- Complex/Poor records: 1.1
- Disaster zone: 1.25

---

## Service Components

### 1. COMPLIANCE SERVICES

Core statutory compliance requirements.

#### 1.1 Annual Accounts & Corporation Tax

**Description:** Year-end accounts preparation and Corporation Tax return filing.

**Includes:**
- Financial statements (P&L, Balance Sheet)
- Director's report (if required)
- Corporation Tax computation
- CT600 filing with HMRC
- Companies House filing

**Model A Pricing:**

| Turnover | Price/month | Annual |
|----------|-------------|--------|
| £0-£89k | £49 | £588 |
| £90k-£149k | £59 | £708 |
| £150k-£249k | £79 | £948 |
| £250k-£499k | £99 | £1,188 |
| £500k-£749k | £119 | £1,428 |
| £750k-£999k | £139 | £1,668 |
| £1M+ | £159 | £1,908 |

**Model B Pricing:**

Base: £30/month + £0.15 per transaction

| Transactions | Example Price |
|--------------|---------------|
| 30 | £30 + £4.50 = £34.50 |
| 60 | £30 + £9 = £39 |
| 100 | £30 + £15 = £45 |
| 200 | £30 + £30 = £60 |
| 300 | £30 + £45 = £75 |

---

#### 1.2 Confirmation Statement

**Description:** Annual Companies House confirmation statement filing.

**Flat Rate:** £5/month (£60/year)

---

#### 1.3 Self-Assessment Tax Returns

**Description:** Personal tax return for directors/shareholders.

**Per Director:** £16.67/month (£200/year)

**Includes:**
- Income from all sources
- Dividends
- Rental income (up to 2 properties, see add-ons)
- Capital gains
- HMRC filing

---

### 2. VAT SERVICES

#### 2.1 Quarterly VAT Returns

**Description:** Preparation and filing of quarterly VAT returns to HMRC.

**Model A Pricing:**

| Turnover | Price/month | Quarterly Cost |
|----------|-------------|----------------|
| £85k-£149k | £25 | £75/quarter |
| £150k-£249k | £35 | £105/quarter |
| £250k-£499k | £45 | £135/quarter |
| £500k+ | £55 | £165/quarter |

**Model B Pricing:**

£0.10 per transaction/month (minimum £20)

| Transactions | Example Price |
|--------------|---------------|
| 100 | £20 (minimum) |
| 300 | £30 |
| 500 | £50 |
| 800 | £80 |

---

### 3. BOOKKEEPING SERVICES

#### 3.1 Basic Bookkeeping (Cash Coding/Categorization)

**Description:** Transaction categorization and basic reconciliation in Xero.

**Includes:**
- Bank transaction categorization
- Basic bank reconciliation (matching only)
- Receipt/invoice upload & filing
- Monthly financial reports (P&L, Balance Sheet)

**Excludes:**
- Invoice/bill creation
- Supplier payment processing
- Debtor chasing
- Month-end journals
- Stock tracking

**Model A Pricing:**

| Turnover | Price/month |
|----------|-------------|
| £0-£89k | £80 |
| £90k-£149k | £100 |
| £150k-£249k | £130 |
| £250k-£499k | £160 |
| £500k+ | £200 |

**Model B Pricing (Per Transaction Band):**

| Transactions/month | Price/month |
|-------------------|-------------|
| 0-25 | £40 |
| 26-50 | £60 |
| 51-75 | £80 |
| 76-100 | £100 |
| 101-150 | £130 |
| 151-200 | £160 |
| 201-300 | £200 |
| 301-400 | £250 |
| 401-500 | £300 |
| 500+ | £0.60/transaction |

---

#### 3.2 Full Bookkeeping (Comprehensive Service)

**Description:** Complete bookkeeping service with proactive financial management.

**Includes:**
- Everything in Basic Bookkeeping PLUS:
- Full bank reconciliation (not just matching)
- Invoice creation & sending
- Bill recording & payment scheduling
- Accounts payable/receivable management
- Supplier payment processing
- Debtor chasing & reminders
- Stock/inventory tracking (if applicable)
- Month-end journals & accruals
- Inter-company transactions (if applicable)

**Model A Pricing (With Complexity Factor):**

| Turnover | Clean Books | Average | Complex | Disaster |
|----------|------------|---------|---------|----------|
| £0-£89k | £150 | £180 | £220 | £280 |
| £90k-£149k | £200 | £240 | £290 | £370 |
| £150k-£249k | £250 | £300 | £360 | £460 |
| £250k-£499k | £320 | £380 | £460 | £590 |
| £500k-£749k | £400 | £480 | £580 | £740 |
| £750k-£999k | £480 | £580 | £700 | £900 |
| £1M+ | £560 | £680 | £820 | £1,050 |

**Model B Pricing (With Complexity Factor):**

| Transactions | Clean | Average | Complex | Disaster |
|-------------|-------|---------|---------|----------|
| 0-25 | £120 | £140 | £170 | £210 |
| 26-50 | £180 | £210 | £250 | £310 |
| 51-75 | £240 | £280 | £340 | £420 |
| 76-100 | £300 | £350 | £420 | £520 |
| 101-150 | £380 | £440 | £530 | £660 |
| 151-200 | £460 | £530 | £640 | £800 |
| 201-300 | £580 | £670 | £810 | £1,010 |
| 301-400 | £700 | £810 | £980 | £1,220 |
| 401-500 | £820 | £950 | £1,150 | £1,430 |
| 500+ | +£1.50 | +£1.75 | +£2.10 | +£2.60 |

**Complexity Definitions:**

- **Clean:** Up-to-date Xero, well-categorized, minimal corrections needed
- **Average:** Some catch-up needed, occasional mispostings, standard complexity
- **Complex:** Significant backlog, many corrections, poor record-keeping, multiple entities
- **Disaster:** Major cleanup required, forensic work, missing data, compliance at risk

---

### 4. PAYROLL SERVICES

#### 4.1 Standard Payroll Processing

**Description:** Full payroll processing including RTI submissions to HMRC.

**Includes:**
- Payslip generation
- PAYE/NIC calculations
- RTI submissions (FPS/EPS)
- P60s (annual)
- P45s (leavers)
- P11D preparation (if needed)
- Payroll summary reports

**Pricing by Employee Count and Frequency:**

| Employees | Monthly | Weekly | Fortnightly | 4-Weekly |
|-----------|---------|--------|-------------|----------|
| Director only | £18 | £60 | £36 | £30 |
| 1-2 | £35 | £100 | £60 | £50 |
| 3-5 | £50 | £125 | £80 | £65 |
| 6-10 | £70 | £175 | £110 | £90 |
| 11-15 | £90 | £220 | £140 | £115 |
| 16-20 | £110 | £265 | £170 | £140 |
| 21-30 | £130 + £2/emp | £300 + £5/emp | £200 + £3/emp | £165 + £2.50/emp |
| 31-50 | £150 + £1.50/emp | £350 + £4/emp | £250 + £2.50/emp | £210 + £2/emp |
| 50+ | Custom quote | Custom quote | Custom quote | Custom quote |

---

#### 4.2 Auto-Enrolment Pension Administration

**Description:** Pension scheme administration and compliance.

**Additional:** £2/employee/month

**Includes:**
- Assessment of employees
- Enrollment processing
- Pension contribution calculations
- Provider submissions
- Annual re-enrollment
- Opt-out processing

---

### 5. MANAGEMENT REPORTING

#### 5.1 Monthly Management Accounts

**Description:** Comprehensive management reporting package.

**Includes:**
- Monthly P&L
- Balance Sheet
- Cash flow statement
- KPI dashboard
- Budget vs actual (if budget provided)
- Management commentary
- Action recommendations

**Model A Pricing:**

| Turnover | Price/month |
|----------|-------------|
| £0-£249k | £150 |
| £250k-£499k | £200 |
| £500k-£999k | £250 |
| £1M-£2M | £350 |
| £2M+ | £450 |

**Model B (Modular Add-Ons):**

| Component | Price |
|-----------|-------|
| Basic P&L + Balance Sheet | £120 |
| + Cash flow forecast | +£50 |
| + KPI dashboard (custom) | +£40 |
| + Budget variance analysis | +£40 |
| + Department breakdown | +£50 |

---

#### 5.2 Quarterly Management Accounts

**Pricing:** 50% of monthly management accounts price

---

### 6. COMPANY SECRETARIAL

**Description:** Company secretarial services and compliance.

| Service Level | Price/month | Includes |
|--------------|-------------|----------|
| Basic | £15 | Annual return, share changes, basic filings |
| Full | £35 | Minutes, resolutions, register maintenance, all filings |
| Complex | £60 | Group structures, multiple entities, complex changes |

---

### 7. TAX PLANNING & ADVISORY

| Service | Price | Frequency |
|---------|-------|-----------|
| Annual tax planning review | £50/month (£600/year) | Annual |
| Quarterly tax planning | £100/month (£1,200/year) | Quarterly |
| Ad-hoc tax advice | £125/hour | As needed |
| R&D tax claims | 18% of claim (min £1,500) | Per claim |
| Capital gains calculation | £300-500 | Per calculation |
| Share schemes (EMI/etc) | £150/month (setup) + £50/month (ongoing) | Ongoing |

---

### 8. SPECIALIST ADD-ONS

| Service | Monthly | One-Off | Notes |
|---------|---------|---------|-------|
| CIS returns | £40 | - | Per month |
| Rental property (additional) | £4 | - | Per property, per month |
| VAT registration (admin) | £5 | £75 | Monthly admin + one-off setup |
| PAYE registration (admin) | £5 | £75 | Monthly admin + one-off setup |
| Making Tax Digital setup | - | £200 | One-off |
| Xero setup & training | - | £300 | One-off, 3 hours |
| Bookkeeping cleanup | - | £85/hour | As needed |
| Late filing catch-up | - | £125/hour | Rush rate |
| Forensic accounting | - | £150/hour | Complex investigations |

---

## Calculation Logic

### Step 1: Service Selection

1. Client selects required services
2. System identifies if service supports Model B pricing
3. If transaction data available, calculate both models
4. If no data, use Model A only

### Step 2: Model A Calculation

```
For each service:
  base_price = SERVICE_PRICES[turnover_band][service]

  If service has complexity factor:
    base_price = base_price × COMPLEXITY_MULTIPLIER[complexity]

  base_price = base_price × INDUSTRY_MULTIPLIER[industry]

total = sum(all service prices)
```

### Step 3: Model B Calculation

```
For each service that supports Model B:
  If per-transaction pricing:
    price = BASE_PRICE + (transactions × RATE[transaction_band])

  If service has complexity factor:
    price = price × COMPLEXITY_MULTIPLIER[complexity]

total = sum(all service prices)
```

### Step 4: Apply Global Modifiers

```
If subtotal > £500:
  total = total × 0.95  // 5% volume discount

If subtotal > £1000:
  total = total × 0.92  // 8% volume discount

If rush_job:
  total = total × 1.25  // 25% rush fee

If first_year_discount_approved:
  total = total × 0.9  // 10% new client discount
```

### Step 5: Compare & Recommend

```
If only Model A calculated:
  recommend Model A

If both models calculated:
  difference = abs(modelA - modelB)
  percent_diff = (difference / modelA) × 100

  If percent_diff < 10%:
    recommend Model A (simpler)
  Else:
    recommend cheaper model
```

---

## Common Scenarios

### Scenario 1: Micro Business - Solo Director

**Client Profile:**
- Turnover: £85k
- Transactions: 25/month
- Services: Accounts, Confirmation, 1x SATR, Director payroll

**Model A:**
- Accounts: £49
- Confirmation: £5
- SATR: £16.67
- Payroll: £18
- **Total: £88.67/month (£1,064/year)**

**Model B:**
- Accounts: £30 + (25 × £0.15) = £33.75
- Confirmation: £5
- SATR: £16.67
- Payroll: £18
- **Total: £73.42/month (£881/year)**

**Recommendation:** Model B saves £15.25/month (£183/year)

---

### Scenario 2: Small Ltd Company with VAT

**Client Profile:**
- Turnover: £175k
- Transactions: 90/month
- Services: Accounts, Confirmation, VAT, Basic bookkeeping, Payroll (4 employees monthly)

**Model A:**
- Accounts: £79
- Confirmation: £5
- VAT: £35
- Basic bookkeeping: £130
- Payroll: £50
- **Total: £299/month (£3,588/year)**

**Model B:**
- Accounts: £30 + (90 × £0.15) = £43.50
- Confirmation: £5
- VAT: £20 (minimum, as 90 × £0.10 = £9)
- Basic bookkeeping: £100 (76-100 band)
- Payroll: £50
- **Total: £218.50/month (£2,622/year)**

**Recommendation:** Model B saves £80.50/month (£966/year)

---

### Scenario 3: Growing Business - Full Service

**Client Profile:**
- Turnover: £450k
- Transactions: 180/month
- Services: Accounts, Confirmation, VAT, Full bookkeeping (average complexity), Payroll (12 employees monthly), Monthly management accounts

**Model A:**
- Accounts: £99
- Confirmation: £5
- VAT: £45
- Full bookkeeping: £380
- Payroll: £90
- Management accounts: £200
- **Total: £819/month (£9,828/year)**

**Model B:**
- Accounts: £30 + (180 × £0.15) = £57
- Confirmation: £5
- VAT: 180 × £0.10 = £18
- Full bookkeeping: £530 (151-200 band, average)
- Payroll: £90
- Management accounts: £200
- **Total: £900/month (£10,800/year)**

**Recommendation:** Model A saves £81/month (£972/year)

---

### Scenario 4: High-Volume Retailer

**Client Profile:**
- Turnover: £600k
- Transactions: 420/month
- Services: Accounts, VAT, Full bookkeeping (complex - lots of products)

**Model A:**
- Accounts: £119
- VAT: £55
- Full bookkeeping: £580 (complex)
- **Total: £754/month (£9,048/year)**

**Model B:**
- Accounts: £30 + (420 × £0.15) = £93
- VAT: 420 × £0.10 = £42
- Full bookkeeping: £950 + ((420-400) × £1.75) = £985
- **Total: £1,120/month (£13,440/year)**

**Recommendation:** Model A saves £366/month (£4,392/year)

*This demonstrates Model A is better for high-transaction businesses*

---

## Implementation Notes

### For Staff/Sales Team

1. **Always collect transaction data if possible** - More accurate quotes
2. **Calculate both models when data available** - Show client the savings
3. **Document complexity clearly** - Use photos, notes, screenshots
4. **Get approval for discounts** - First-year discounts need sign-off
5. **Build quote in stages** - Start with core services, add extras

### For Developers

1. **Service components are modular** - Each can be toggled independently
2. **Pricing rules stored in database** - Easy to update without code changes
3. **Both models must be calculated** - Even if one is obviously better
4. **Cache Xero data** - Don't fetch every time, refresh monthly
5. **Audit trail required** - Log all pricing calculations

### For Management

1. **Review pricing quarterly** - Market rates change
2. **Monitor Model A vs B usage** - Which is more common?
3. **Track win/loss by pricing model** - Does transparency help?
4. **Service profitability analysis** - Which services are most profitable?
5. **Discount policy enforcement** - Ensure discounts are approved

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-09-30 | Initial modular pricing structure | System |

---

## Questions & Support

For questions about this pricing structure, contact:
- **Technical Implementation:** Development Team
- **Pricing Policy:** Management Team
- **Sales Training:** Sales Manager

---

*End of Document*
