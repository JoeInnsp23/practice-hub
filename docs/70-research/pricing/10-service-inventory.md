# Service Inventory

**Source:** Practice Hub codebase exploration
**Date:** 2025-10-28
**Location:** `/root/projects/practice-hub/lib/db/schema.ts` (lines 806-850), `/root/projects/practice-hub/docs/reference/business-logic/proposals/SERVICE_COMPONENTS.md`

---

## Overview

The Client Hub services catalog is defined in the `services` table with **tenant isolation** (`tenantId` required). Services support multiple pricing models (turnover, transaction, both, fixed) and complexity multipliers.

---

## Service Catalog

| Code | Name | Category | Unit | Frequency | Pricing Model | Base Price | Complexity Support | File Reference |
|------|------|----------|------|-----------|---------------|------------|-------------------|----------------|
| `COMP_ACCOUNTS` | Annual Accounts & Corporation Tax | compliance | Per business | Annual | both | Variable | Yes | SERVICE_COMPONENTS.md:26 |
| `COMP_CONFIRMATION` | Confirmation Statement | compliance | Per business | Annual | fixed | £50 | No | SERVICE_COMPONENTS.md:107 |
| `COMP_SATR` | Self-Assessment Tax Return | compliance | Per director | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:145 |
| `VAT_RETURNS` | Quarterly VAT Returns | vat | Per business | Quarterly | both | Variable | No | SERVICE_COMPONENTS.md:198 |
| `BOOK_BASIC` | Basic Bookkeeping | bookkeeping | Per business | Monthly | both | Variable | No | SERVICE_COMPONENTS.md:254 |
| `BOOK_FULL` | Full Bookkeeping | bookkeeping | Per business | Monthly | both | Variable | Yes | SERVICE_COMPONENTS.md:332 |
| `PAYROLL_STANDARD` | Standard Payroll Processing | payroll | Per employee | Monthly/Weekly | fixed | Variable | No | SERVICE_COMPONENTS.md:442 |
| `PAYROLL_PENSION` | Auto-Enrolment Pension | payroll | Per employee | Monthly | fixed | Variable | No | SERVICE_COMPONENTS.md:522 |
| `MGMT_MONTHLY` | Monthly Management Accounts | management | Per business | Monthly | both | Variable | No | SERVICE_COMPONENTS.md:556 |
| `SEC_BASIC` | Basic Secretarial | secretarial | Per business | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:612 |
| `SEC_FULL` | Full Secretarial | secretarial | Per business | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:612 |
| `SEC_COMPLEX` | Complex Secretarial | secretarial | Per business | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:612 |
| `TAX_ANNUAL` | Annual Tax Planning Review | tax_planning | Per business | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:648 |
| `TAX_RD` | R&D Tax Claims | tax_planning | Per claim | One-off | percentage | % of savings | No | SERVICE_COMPONENTS.md:676 |
| `ADDON_CIS` | CIS Returns | addon | Per business | Monthly | fixed | Variable | No | SERVICE_COMPONENTS.md:705 |
| `ADDON_RENTAL` | Additional Rental Properties | addon | Per property | Annual | fixed | Variable | No | SERVICE_COMPONENTS.md:714 |
| `ADDON_VAT_REG` | VAT Registration | addon | One-off | One-off | fixed | £156 | No | SERVICE_COMPONENTS.md:723 |
| `ADDON_PAYE_REG` | PAYE Registration | addon | One-off | One-off | fixed | Variable | No | SERVICE_COMPONENTS.md:723 |

---

## Service Categories (Enum)

From `lib/db/schema.ts` lines 782-793:

- `compliance` - Statutory compliance services
- `vat` - VAT-related services
- `bookkeeping` - Bookkeeping and record-keeping
- `payroll` - Payroll processing
- `management` - Management accounting and reporting
- `secretarial` - Company secretarial duties
- `tax_planning` - Tax planning and advisory
- `addon` - Additional bolt-on services

---

## Pricing Models (Enum)

From `lib/db/schema.ts` lines 797-802:

- `turnover` - Priced based on annual turnover bands
- `transaction` - Priced based on monthly transaction volume
- `both` - Supports both turnover and transaction-based pricing
- `fixed` - Fixed price regardless of volume

---

## Price Types (Enum)

From `lib/db/schema.ts` lines 773-779:

- `hourly` - Hourly rate
- `fixed` - Fixed price per service
- `retainer` - Monthly/annual retainer
- `project` - Project-based pricing
- `percentage` - Percentage of value (e.g., R&D claims)

---

## Pricing Rules Table

**Location:** `lib/db/schema.ts` lines 1667-1697

The `pricing_rules` table stores banded pricing logic:

### Fields:
- `id` - UUID primary key
- `tenantId` - Tenant isolation
- `componentId` - References `services.id`
- **`ruleType`** - Enum: `turnover_band`, `transaction_band`, `per_unit`, `fixed`
- **`minValue`** - Decimal(15,2) for band minimum (e.g., 0, 90000, 500000)
- **`maxValue`** - Decimal(15,2) for band maximum (e.g., 89999, 499999, null for unbounded)
- **`price`** - Decimal(10,2) price for this rule
- **`complexityLevel`** - Varchar(50): `clean`, `average`, `complex`, `disaster`
- `metadata` - JSONB for additional config
- `isActive` - Boolean

### Example Rules (Conceptual):

```json
{
  "componentId": "COMP_ACCOUNTS",
  "ruleType": "turnover_band",
  "minValue": 0,
  "maxValue": 89999,
  "price": 95.00,
  "complexityLevel": "average"
}
```

---

## Complexity Multipliers

**Source:** `app/server/routers/pricing.ts` lines 81-110

### Model A (Turnover-Based):
- `clean`: 0.95x
- `average`: 1.0x (baseline)
- `complex`: 1.15x
- `disaster`: 1.4x

### Model B (Transaction-Based):
- `clean`: 0.98x
- `average`: 1.0x (baseline)
- `complex`: 1.08x
- `disaster`: 1.2x

### Industry Multipliers:
- `simple`: 0.95x
- `standard`: 1.0x
- `complex`: 1.15x
- `regulated`: 1.3x

---

## Payroll Pricing Logic

**Source:** `app/server/routers/pricing.ts` lines 112-132

Payroll pricing follows a tiered model based on employee count:

| Employee Range | Base Monthly Price (GBP) |
|----------------|---------------------------|
| Director only (0-2) | £18 |
| 1-5 employees | £50 |
| 6-10 employees | £70 |
| 11-15 employees | £90 |
| 16-20 employees | £110 |
| 20+ employees | £130 + ((employees - 20) × £2) |

**Frequency Multipliers:**
- **Weekly**: base × 3
- **Fortnightly**: base × 2
- **4-weekly**: base × 2
- **Monthly**: base × 1

---

## Transaction Estimation Formula

**Source:** `app/server/routers/pricing.ts` lines 589-622

For leads/proposals without actual transaction data, the system estimates monthly transactions:

### Base Estimates by Turnover Band:

| Turnover Band | Base Transactions/Month |
|---------------|-------------------------|
| £0-£89k | 35 |
| £90k-£149k | 55 |
| £150k-£249k | 80 |
| £250k-£499k | 120 |
| £500k-£749k | 180 |
| £750k-£999k | 250 |
| £1m+ | 350 |

### Adjustments:
- **Industry multiplier**: Applied based on industry type
- **VAT registered**: estimate × 1.2

---

## Service Router (tRPC)

**Location:** `app/server/routers/services.ts`

### Procedures:
- `list` (lines 21-75) - Filter by search, category, isActive
- `getById` (lines 77-96) - Get single service
- `create` (lines 98-140) - Create new service (admin)
- `update` (lines 142-190) - Update service (admin)
- `delete` (lines 192-233) - Soft delete (mark inactive)

---

## UI Entry Points

### Service Management Components:
- **Modal:** `/root/projects/practice-hub/components/client-hub/services/service-modal.tsx`
- **Card:** `/root/projects/practice-hub/components/client-hub/services/service-card.tsx`
- **Wizard (Selection):** `/root/projects/practice-hub/components/client-hub/clients/wizard/service-selection-step.tsx`
- **Wizard (Configuration):** `/root/projects/practice-hub/components/client-hub/clients/wizard/service-configuration-step.tsx`

---

## Current Limitations

1. **No multi-currency support** - GBP hardcoded throughout
2. **No multi-entity flags** - Group structures mentioned in docs but not in schema
3. **No rental property counter** - ADDON_RENTAL exists but no automatic count field
4. **No CIS registration flag** - ADDON_CIS exists but no boolean flag for auto-detection
5. **No accounting software field** - Cannot detect Xero/QuickBooks integration eligibility

---

## Evidence File Paths

- Schema definition: `lib/db/schema.ts:806-850` (services table)
- Pricing rules: `lib/db/schema.ts:1667-1697`
- Service categories enum: `lib/db/schema.ts:782-793`
- Pricing router: `app/server/routers/pricing.ts`
- Service router: `app/server/routers/services.ts`
- Documentation: `docs/reference/business-logic/proposals/SERVICE_COMPONENTS.md`

---

**End of Service Inventory**
