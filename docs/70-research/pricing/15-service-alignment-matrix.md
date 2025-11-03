# Service Alignment Matrix

**Purpose:** Map each Practice Hub service to pricing drivers, quote line items, and calculation logic
**Date:** 2025-10-28
**Status:** Production-Ready Reference

---

## Overview

This matrix serves as the **"Rosetta Stone"** between the service catalog, pricing engine, and proposal/quote system. It ensures that:
- Every service has clear pricing inputs
- Quote line items match service configurations
- Pricing calculations are traceable to formulas

---

## Matrix Structure

| Column | Description |
|--------|-------------|
| **Service Code** | Unique identifier from `services` table |
| **Service Name** | Human-readable name |
| **Category** | Service category (compliance, vat, bookkeeping, etc.) |
| **Pricing Drivers** | Input variables affecting price (quantity-based, complexity-based, time-based) |
| **Quote Line Item** | Template for proposal line items (name, unit, default rate) |
| **Calculation Logic** | Formula reference from `30-pricing-model.md` |
| **Dependencies** | Required/recommended services |
| **Frequency** | Billing cycle (monthly, quarterly, annual, one-off) |

---

## Service Alignment Table

### COMPLIANCE SERVICES

#### COMP_ACCOUNTS: Annual Accounts & Corporation Tax

| Attribute | Value |
|-----------|-------|
| **Service Code** | `COMP_ACCOUNTS` |
| **Category** | compliance |
| **Pricing Drivers** | • `turnover` (primary driver - banded)<br>• `complexity` (multiplier: 0.95-1.4x)<br>• `industry` (multiplier: 0.95-1.3x) |
| **Quote Line Item** | "Annual Accounts & Corporation Tax Filing"<br>Unit: Per business<br>Default Rate: £300-£7,500 (turnover-dependent) |
| **Calculation Logic** | Model A: `BASE_PRICE[turnoverBand] × complexityMultiplier × industryMultiplier`<br>See `30-pricing-model.md` Turnover Bands Table |
| **Dependencies** | None (standalone service) |
| **Frequency** | Annual |
| **Schema Reference** | `lib/db/schema.ts:806-850` services table |
| **Router Logic** | `app/server/routers/pricing.ts:256-397` Model A calculation |

---

#### COMP_CONFIRMATION: Confirmation Statement

| Attribute | Value |
|-----------|-------|
| **Service Code** | `COMP_CONFIRMATION` |
| **Category** | compliance |
| **Pricing Drivers** | • Fixed price (no variables) |
| **Quote Line Item** | "Companies House Confirmation Statement"<br>Unit: Per filing<br>Default Rate: £50 (£34 CH fee + £16-50 admin) |
| **Calculation Logic** | Fixed: `£50` |
| **Dependencies** | Required for all active UK limited companies |
| **Frequency** | Annual |
| **Market Benchmark** | £34 (Companies House) + £17-£50 (accountant admin) = £51-£84<br>Source: src003, src019 |

---

#### COMP_SATR: Self-Assessment Tax Return

| Attribute | Value |
|-----------|-------|
| **Service Code** | `COMP_SATR` |
| **Category** | compliance |
| **Pricing Drivers** | • `complexity` (basic/director/with property)<br>• `propertyCount` (addon: £30/property)<br>• `incomeStreamsCount` (affects complexity tier) |
| **Quote Line Item** | "Self-Assessment Tax Return (Director)"<br>Unit: Per director<br>Default Rate: £150-£350 |
| **Calculation Logic** | Base: £179-£350 (complexity tier)<br>Add: `propertyCount × £30` |
| **Dependencies** | Per director/shareholder |
| **Frequency** | Annual |
| **Market Benchmark** | Basic: £150-£250, Director: £250-£350, +Property: +£30/property<br>Sources: src012, src003, src002 |

---

### VAT SERVICES

#### VAT_RETURNS: Quarterly VAT Returns

| Attribute | Value |
|-----------|-------|
| **Service Code** | `VAT_RETURNS` |
| **Category** | vat |
| **Pricing Drivers** | • `turnover` (banded: £0-£100k, £100k-£200k, £200k-£400k)<br>• `transactionCount` (optional Model B driver) |
| **Quote Line Item** | "VAT Returns (Quarterly)"<br>Unit: Per quarter<br>Default Rate: £120-£240/quarter (£480-£960/year) |
| **Calculation Logic** | Model A: `TURNOVER_BAND_PRICE[turnover]`<br>  • £0-£100k: £120/qtr<br>  • £100k-£200k: £180/qtr<br>  • £200k-£400k: £240/qtr |
| **Dependencies** | Bookkeeping (recommended for accuracy) |
| **Frequency** | Quarterly (4x per year) |
| **Schema Reference** | Pricing rule type: `turnover_band` |
| **Market Benchmark** | £100-£500/return, typically £120-£240/qtr<br>Sources: src011, src003 |

---

### BOOKKEEPING SERVICES

#### BOOK_BASIC: Basic Bookkeeping

| Attribute | Value |
|-----------|-------|
| **Service Code** | `BOOK_BASIC` |
| **Category** | bookkeeping |
| **Pricing Drivers** | • `monthlyTransactions` (Model B primary)<br>• `turnover` (Model A fallback)<br>• `bankAccountsCount` (complexity factor)<br>• `complexity` (multiplier: 0.95-1.4x) |
| **Quote Line Item** | "Basic Bookkeeping"<br>Unit: Per month<br>Default Rate: £100-£300/month |
| **Calculation Logic** | **Model A:** `BASE_PRICE[turnoverBand] × complexityMultiplier`<br>**Model B:** `BASE_PRICE[txnBand] + (transactions × ratePerTxn) × complexityMultiplier`<br>  • 0-100 txn: £100 base + £0.50/txn<br>  • 101-300 txn: £150 base + £0.75/txn<br>  • 301+ txn: £250 base + £1.00/txn |
| **Dependencies** | None |
| **Frequency** | Monthly |
| **Market Benchmark** | £100-£300/month or £0.50-£2.00/transaction<br>Sources: src007, src008 |

---

#### BOOK_FULL: Full Bookkeeping

| Attribute | Value |
|-----------|-------|
| **Service Code** | `BOOK_FULL` |
| **Category** | bookkeeping |
| **Pricing Drivers** | • Same as BOOK_BASIC but higher base rates<br>• `complexity` (required - typically "complex" or "disaster")<br>• `accountingSoftware` (integration complexity) |
| **Quote Line Item** | "Full Bookkeeping Service"<br>Unit: Per month<br>Default Rate: £200-£500/month |
| **Calculation Logic** | Model B preferred:<br>`BASE_PRICE[txnBand] × 1.5 + (transactions × £1.25) × complexityMultiplier` |
| **Dependencies** | Recommended: VAT Returns, Management Accounts |
| **Frequency** | Monthly |

---

### PAYROLL SERVICES

#### PAYROLL_STANDARD: Standard Payroll Processing

| Attribute | Value |
|-----------|-------|
| **Service Code** | `PAYROLL_STANDARD` |
| **Category** | payroll |
| **Pricing Drivers** | • `employeeCount` (tiered pricing)<br>• `payrollFrequency` (multiplier: weekly 3x, fortnightly 2x, monthly 1x) |
| **Quote Line Item** | "Payroll Processing (Monthly)"<br>Unit: Per employee<br>Default Rate: £18-£130+ base/month |
| **Calculation Logic** | Tiered (from `30-pricing-model.md`):<br>  • Director only (0-2): £18/month<br>  • 1-5 employees: £50/month<br>  • 6-10 employees: £70/month<br>  • 11-15 employees: £90/month<br>  • 16-20 employees: £110/month<br>  • 20+ employees: £130 + ((count - 20) × £2)<br>Then: `base × frequencyMultiplier` |
| **Dependencies** | None |
| **Frequency** | Monthly/Weekly/Fortnightly/4-weekly |
| **Schema Reference** | `app/server/routers/pricing.ts:112-132` |
| **Market Benchmark** | £4-£10/employee/month (our £7-£18 competitive)<br>Sources: src009, src010 |

---

#### PAYROLL_PENSION: Auto-Enrolment Pension

| Attribute | Value |
|-----------|-------|
| **Service Code** | `PAYROLL_PENSION` |
| **Category** | payroll |
| **Pricing Drivers** | • `employeeCount` (per employee addon) |
| **Quote Line Item** | "Auto-Enrolment Pension Administration"<br>Unit: Per employee<br>Default Rate: £30/year or £2.50/month |
| **Calculation Logic** | Fixed: `employeeCount × £2.50/month` or `× £30/year` |
| **Dependencies** | Requires PAYROLL_STANDARD |
| **Frequency** | Monthly (billed with payroll) |
| **Market Benchmark** | £1.50-£2.00/employee/month<br>Sources: src009, src024 |

---

### MANAGEMENT SERVICES

#### MGMT_MONTHLY: Monthly Management Accounts

| Attribute | Value |
|-----------|-------|
| **Service Code** | `MGMT_MONTHLY` |
| **Category** | management |
| **Pricing Drivers** | • `turnover` (complexity factor)<br>• `complexity` (reporting depth) |
| **Quote Line Item** | "Monthly Management Accounts"<br>Unit: Per month<br>Default Rate: £38-£500/month |
| **Calculation Logic** | Tiered packages:<br>  • Basic: £38-£100/month (P&L, balance sheet)<br>  • Standard: £100-£250/month (+ cash flow)<br>  • Premium: £250-£500/month (+ forecasting, KPIs) |
| **Dependencies** | Recommended: BOOK_FULL |
| **Frequency** | Monthly |
| **Market Benchmark** | £38-£500/month (Mazuma £38, Heights £250-£500)<br>Sources: src014, src005 |

---

### SECRETARIAL SERVICES

#### SEC_BASIC / SEC_FULL / SEC_COMPLEX: Company Secretarial

| Attribute | Value |
|-----------|-------|
| **Service Code** | `SEC_BASIC`, `SEC_FULL`, `SEC_COMPLEX` |
| **Category** | secretarial |
| **Pricing Drivers** | • `entityCount` (multi-entity surcharge)<br>• `complexity` (filing frequency, governance complexity) |
| **Quote Line Item** | "Company Secretarial Services"<br>Unit: Per business<br>Default Rate: £89-£300/year |
| **Calculation Logic** | Fixed tier pricing:<br>  • Basic: £89/year (statutory filings)<br>  • Full: £150-£200/year (+ minutes, resolutions)<br>  • Complex: £250-£300/year (+ governance, multi-entity) |
| **Dependencies** | None |
| **Frequency** | Annual |
| **Market Benchmark** | £89-£300/year<br>Sources: src002 (Penney's £89) |

---

### TAX PLANNING SERVICES

#### TAX_ANNUAL: Annual Tax Planning Review

| Attribute | Value |
|-----------|-------|
| **Service Code** | `TAX_ANNUAL` |
| **Category** | tax_planning |
| **Pricing Drivers** | • `turnover` (client complexity proxy)<br>• `entityCount` (group structures) |
| **Quote Line Item** | "Annual Tax Planning Review"<br>Unit: Per review<br>Default Rate: £500-£1,500 |
| **Calculation Logic** | Fixed tier by client size:<br>  • Small (£0-£500k turnover): £500<br>  • Medium (£500k-£2m turnover): £1,000<br>  • Large (£2m+ turnover): £1,500+ |
| **Dependencies** | None |
| **Frequency** | Annual |

---

#### TAX_RD: R&D Tax Credits

| Attribute | Value |
|-----------|-------|
| **Service Code** | `TAX_RD` |
| **Category** | tax_planning |
| **Pricing Drivers** | • `savingsAchieved` (percentage-based fee) |
| **Quote Line Item** | "R&D Tax Credit Claim"<br>Unit: Per claim<br>Default Rate: 5% of savings (2.5% above £200k) |
| **Calculation Logic** | Tiered percentage:<br>  • <£55k savings: £2,750 fixed<br>  • £55k-£200k: 5% of savings<br>  • >£200k: (£200k × 5%) + ((savings - £200k) × 2.5%) |
| **Dependencies** | None |
| **Frequency** | Per claim (annual typically) |
| **Market Benchmark** | 5% up to £200k, 2.5% above<br>Source: src017 (Tax Cloud) |

---

### ADD-ON SERVICES

#### ADDON_CIS: CIS Returns

| Attribute | Value |
|-----------|-------|
| **Service Code** | `ADDON_CIS` |
| **Category** | addon |
| **Pricing Drivers** | • `subcontractorCount` (£6/subcontractor) |
| **Quote Line Item** | "CIS Monthly Returns"<br>Unit: Per month<br>Default Rate: £30 base + £6/subcontractor |
| **Calculation Logic** | `£30 + (subcontractorCount × £6)` |
| **Dependencies** | Construction industry businesses only |
| **Frequency** | Monthly |
| **Market Benchmark** | £30 minimum, £36 for 6 subcontractors<br>Source: src022 |

---

#### ADDON_RENTAL: Additional Rental Properties

| Attribute | Value |
|-----------|-------|
| **Service Code** | `ADDON_RENTAL` |
| **Category** | addon |
| **Pricing Drivers** | • `propertyCount` (per property) |
| **Quote Line Item** | "Rental Property Accounting"<br>Unit: Per property<br>Default Rate: £12-£30/property/year |
| **Calculation Logic** | `propertyCount × £30/year` |
| **Dependencies** | COMP_SATR (landlord self-assessment) |
| **Frequency** | Annual |
| **Market Benchmark** | £12-£30/property<br>Sources: src003 (RJ £30), market research £12-£30 |

---

#### ADDON_VAT_REG / ADDON_PAYE_REG: Registrations

| Attribute | Value |
|-----------|-------|
| **Service Code** | `ADDON_VAT_REG`, `ADDON_PAYE_REG` |
| **Category** | addon |
| **Pricing Drivers** | • None (fixed one-off) |
| **Quote Line Item** | "VAT Registration" or "PAYE Registration"<br>Unit: One-off<br>Default Rate: £156 (VAT), £100-£200 (PAYE) |
| **Calculation Logic** | Fixed pricing |
| **Dependencies** | None |
| **Frequency** | One-off |

---

## Cross-Reference Index

### By Pricing Driver

| Pricing Driver | Services Using This Driver |
|----------------|----------------------------|
| `turnover` | COMP_ACCOUNTS, VAT_RETURNS, BOOK_BASIC, BOOK_FULL, MGMT_MONTHLY, TAX_ANNUAL |
| `monthlyTransactions` | BOOK_BASIC, BOOK_FULL (Model B) |
| `employeeCount` | PAYROLL_STANDARD, PAYROLL_PENSION |
| `complexity` | COMP_ACCOUNTS, BOOK_BASIC, BOOK_FULL, MGMT_MONTHLY |
| `industry` | COMP_ACCOUNTS (all turnover-based services) |
| `propertyCount` | COMP_SATR, ADDON_RENTAL |
| `bankAccountsCount` | BOOK_BASIC, BOOK_FULL (complexity factor) |
| `subcontractorCount` | ADDON_CIS |
| `payrollFrequency` | PAYROLL_STANDARD |
| `entityCount` | SEC_COMPLEX (multi-entity surcharge) |
| `savingsAchieved` | TAX_RD |

### By Calculation Method

| Calculation Method | Services |
|--------------------|----------|
| **Turnover-Banded** | COMP_ACCOUNTS, VAT_RETURNS |
| **Transaction-Based** | BOOK_BASIC, BOOK_FULL (Model B) |
| **Employee-Tiered** | PAYROLL_STANDARD |
| **Per-Unit** | PAYROLL_PENSION, ADDON_RENTAL, ADDON_CIS |
| **Fixed** | COMP_CONFIRMATION, ADDON_VAT_REG, ADDON_PAYE_REG |
| **Percentage** | TAX_RD |
| **Package-Tiered** | MGMT_MONTHLY, SEC_* |

### By Frequency

| Frequency | Services |
|-----------|----------|
| **Monthly** | BOOK_BASIC, BOOK_FULL, PAYROLL_STANDARD, MGMT_MONTHLY, ADDON_CIS |
| **Quarterly** | VAT_RETURNS |
| **Annual** | COMP_ACCOUNTS, COMP_CONFIRMATION, COMP_SATR, SEC_*, TAX_ANNUAL, ADDON_RENTAL |
| **One-Off** | ADDON_VAT_REG, ADDON_PAYE_REG, TAX_RD |

---

## Validation Rules

### Ensuring Alignment Stays Current

1. **Schema Sync Check:**
   ```sql
   -- Verify all service codes in alignment matrix exist in services table
   SELECT code FROM services WHERE tenantId = 'system'
   AND code NOT IN ('COMP_ACCOUNTS', 'COMP_CONFIRMATION', ...);
   ```

2. **Pricing Driver Check:**
   - Every driver in this matrix must have a corresponding field in:
     - Lead schema (`lib/db/schema.ts:1705-1773`)
     - Proposal schema (`lib/db/schema.ts:1775-1873`)
     - Or be calculable from existing fields

3. **Quote Line Item Validation:**
   ```typescript
   // Verify line item template matches proposal_services schema
   // lib/db/schema.ts:1874-1904
   interface ProposalService {
     componentCode: string;    // Must match service code
     componentName: string;    // Must match quote line item name
     calculation: string;      // Must reference formula from 30-pricing-model.md
     price: string;            // Calculated using driver values
   }
   ```

4. **Formula Reference Check:**
   - Every "Calculation Logic" entry must reference a formula in `30-pricing-model.md`
   - If formula changes, update both docs simultaneously

5. **Market Benchmark Validation:**
   - Compare service rates against `21-market-data.csv`
   - Flag if our pricing deviates >20% from market median
   - Require justification for outliers

---

## Usage Guidelines

### For Developers:
- **Before adding a new service:** Add a row to this matrix first
- **Before modifying pricing logic:** Check which services are affected
- **When creating quote line items:** Use templates from this matrix

### For Product Managers:
- **Service definition:** Use this matrix to spec new services
- **Pricing validation:** Cross-check proposed rates with market benchmarks
- **Bundling decisions:** Identify services with shared drivers

### For Finance:
- **Revenue modeling:** Use frequency and default rates for forecasts
- **Pricing reviews:** Check market benchmarks for annual adjustments

---

## Related Documentation

- **Service Catalog:** `10-service-inventory.md`
- **Pricing Formulas:** `30-pricing-model.md`
- **Field Mappings:** `22-mappings.json`
- **Market Benchmarks:** `20-market-research.md`, `21-market-data.csv`
- **Database Schema:** `/lib/db/schema.ts` (services: 806-850, pricing_rules: 1667-1697)
- **Pricing Router:** `/app/server/routers/pricing.ts`

---

**Last Updated:** 2025-10-28
**Maintained By:** Product & Engineering Teams
**Review Frequency:** Quarterly (or when schema/pricing changes)
