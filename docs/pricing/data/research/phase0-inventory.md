# Phase 0: Codebase Inventory for UK Pricing Research

**Date:** 2025-11-05  
**Status:** Complete  
**Purpose:** Comprehensive inventory of pricing-related architecture to inform UK pricing data capture and mapping

---

## Executive Summary

Practice Hub has a **robust pricing infrastructure** with dual-model calculations (Model A: turnover-based, Model B: transaction-based), comprehensive service catalog, tRPC routers, and DocuSeal e-signature integration. However, **lead capture is under-instrumented** for pricing drivers, causing manual proposal creation bottlenecks.

**Key Finding:** The pricing engine is production-ready, but the lead-to-proposal data flow is missing 8+ critical fields for automatic pricing.

---

## 1. Existing Pricing Documentation

### Documentation Files (docs/70-research/pricing/)

| File | Purpose | Status | File Reference |
|------|---------|--------|----------------|
| `00-exec-brief.md` | Executive briefing on pricing research | Complete | /docs/70-research/pricing/00-exec-brief.md |
| `10-service-inventory.md` | Service catalog + pricing models | Complete | /docs/70-research/pricing/10-service-inventory.md |
| `15-service-alignment-matrix.md` | Service-to-market mapping | Complete | /docs/70-research/pricing/15-service-alignment-matrix.md |
| `20-market-research.md` | UK market pricing data analysis | Complete | /docs/70-research/pricing/20-market-research.md |
| `21-market-data.csv` | Raw UK pricing data (12,171 bytes) | Complete | /docs/70-research/pricing/21-market-data.csv |
| `22-mappings.json` | Field mappings to pricing drivers | Complete | /docs/70-research/pricing/22-mappings.json |
| `30-pricing-model.md` | Pricing calculation models A & B | Complete | /docs/70-research/pricing/30-pricing-model.md |
| `31-pricing-config.prototype.json` | Prototype config structure | Complete | /docs/70-research/pricing/31-pricing-config.prototype.json |
| `32-pricing-dsl.md` | DSL for pricing rules | Complete | /docs/70-research/pricing/32-pricing-dsl.md |
| `40-quote-workflow.md` | Quote generation workflow | Complete | /docs/70-research/pricing/40-quote-workflow.md |
| `45-readiness-checklist.md` | Implementation readiness | Complete | /docs/70-research/pricing/45-readiness-checklist.md |
| `50-test-plan.md` | Test scenarios for pricing | Complete | /docs/70-research/pricing/50-test-plan.md |
| `55-gaps.md` | Detailed gaps analysis | Complete | /docs/70-research/pricing/55-gaps.md |
| `60-decisions.md` | Architecture decisions log | Complete | /docs/70-research/pricing/60-decisions.md |
| `70-rollout-plan.md` | Rollout strategy | Complete | /docs/70-research/pricing/70-rollout-plan.md |
| `service-codes.json` | Service code definitions | Complete | /docs/70-research/pricing/service-codes.json |

**Total:** 16 pricing documentation files (research-only, no production impact)

---

## 2. tRPC Pricing & Proposal Routers

### 2.1 Pricing Routers

| Router | File | Lines | Key Procedures |
|--------|------|-------|----------------|
| `pricingRouter` | `/app/server/routers/pricing.ts` | 690 | `calculate`, `getComponents`, `getRules`, `estimateTransactions` |
| `pricingConfigRouter` | `/app/server/routers/pricingConfig.ts` | 446 | `getConfig`, `updateComplexityMultipliers`, `updateIndustryMultipliers`, `updateDiscountRules` |
| `pricingAdminRouter` | `/app/server/routers/pricingAdmin.ts` | 769 | `getAllComponents`, `createComponent`, `updateComponent`, `deleteComponent`, `getAllRules`, `validatePricingIntegrity` |

**Key Procedures:**

#### `pricing.calculate` (pricing.ts:627-643)
```typescript
input: {
  turnover: string,
  industry: enum(simple|standard|complex|regulated),
  services: array<{ serviceCode, quantity, config }>,
  transactionData?: { monthlyTransactions, source },
  modifiers?: { isRush, newClient, customDiscount }
}
output: {
  modelA: PricingModel,
  modelB: PricingModel | null,
  recommendation: { model: 'A' | 'B', reason, savings }
}
```

**Evidence:** `app/server/routers/pricing.ts:27-44` (input schema), `app/server/routers/pricing.ts:627-643` (calculate procedure)

#### Complexity Multipliers (pricing.ts:81-110)

**Model A (Turnover-Based):**
- `clean`: 0.95x
- `average`: 1.0x
- `complex`: 1.15x
- `disaster`: 1.4x

**Model B (Transaction-Based):**
- `clean`: 0.98x
- `average`: 1.0x
- `complex`: 1.08x
- `disaster`: 1.2x

**Industry Multipliers:**
- `simple`: 0.95x
- `standard`: 1.0x
- `complex`: 1.15x
- `regulated`: 1.3x

**Evidence:** `app/server/routers/pricing.ts:81-110`

---

### 2.2 Proposals Router

| Router | File | Lines | Key Procedures |
|--------|------|-------|----------------|
| `proposalsRouter` | `/app/server/routers/proposals.ts` | 2021 | `list`, `getById`, `create`, `createFromLead`, `update`, `send`, `submitSignature`, `generatePdf` |

**Critical Procedures:**

#### `proposals.createFromLead` (proposals.ts:440-541)
**Gap Identified:** Creates proposals with **empty services array** and defaults to Model B
```typescript
values: {
  pricingModelUsed: "model_b", // Default
  turnover: lead.estimatedTurnover || null,
  industry: lead.industry || null,
  monthlyTotal: "0",
  annualTotal: "0",
  // NO services pre-populated
}
```

**Evidence:** `app/server/routers/proposals.ts:488`

#### `proposals.send` (proposals.ts:792-970)
**Integrations:** 
- Generates PDF via `generateProposalPdf()` (line 840)
- Creates DocuSeal template (line 853)
- Creates DocuSeal submission (line 887)
- Sends Resend email (line 934)

**Evidence:** `app/server/routers/proposals.ts:792-970`

---

### 2.3 Leads Router

| Router | File | Lines | Key Procedures |
|--------|------|-------|----------------|
| `leadsRouter` | `/app/server/routers/leads.ts` | 885 | `createPublic`, `list`, `getById`, `create`, `update`, `convertToClient` |

**Lead Capture Fields (Public Form):**

From `leadsRouter.createPublic` input schema (leads.ts:203-223):
```typescript
{
  companyName: string,
  businessType: string,  // ❌ NOT entity_type enum
  industry: string,
  estimatedTurnover: number,
  estimatedEmployees: number,
  firstName: string,
  lastName: string,
  email: string,
  phone?: string,
  position?: string,
  interestedServices: string[],
  notes?: string
}
```

**Evidence:** `app/server/routers/leads.ts:203-223`

---

### 2.4 Services Router

| Router | File | Lines | Key Procedures |
|--------|------|-------|----------------|
| `servicesRouter` | `/app/server/routers/services.ts` | 235 | `list`, `getById`, `create`, `update`, `delete` |

**Service Categories:** compliance, vat, bookkeeping, payroll, management, secretarial, tax_planning, addon

**Evidence:** `app/server/routers/services.ts:21-75`

---

## 3. Database Schema (Pricing-Relevant Tables)

### 3.1 Core Pricing Tables

| Table | Location | Purpose | Pricing Driver Fields |
|-------|----------|---------|----------------------|
| `leads` | schema.ts:1705-1773 | Lead capture data | `estimatedTurnover`, `estimatedEmployees`, `industry`, `interestedServices` |
| `clients` | schema.ts:601-658 | Client master data | `type` (entity_type enum), `vatRegistered`, `registrationNumber`, `incorporationDate`, `yearEnd` |
| `proposals` | schema.ts:1796-1859 | Proposal records | `turnover`, `industry`, `monthlyTransactions`, `pricingModelUsed`, `monthlyTotal`, `annualTotal` |
| `proposal_services` | schema.ts:1864-1897 | Proposal line items | `componentCode`, `componentName`, `calculation`, `price`, `config` (JSONB) |
| `services` | schema.ts:806-850 | Service catalog | `code`, `name`, `category`, `pricingModel`, `supportsComplexity`, `basePrice` |
| `pricing_rules` | schema.ts:1667-1697 | Turnover/transaction bands | `ruleType`, `minValue`, `maxValue`, `price`, `complexityLevel` |

---

### 3.2 Lead Schema Analysis

**Table:** `leads` (schema.ts:1705-1773)

**Existing Fields for Pricing:**
```typescript
estimatedTurnover: decimal(15,2),
estimatedEmployees: integer,
industry: varchar(100),
interestedServices: jsonb
```

**Missing Fields (High Priority):**
```typescript
monthlyTransactions?: integer,          // GAP-001: Required for Model B
vatRegistered?: boolean,                // GAP-002: Affects transaction estimation
booksCondition?: enum,                  // GAP-003: clean|average|complex|disaster
bankAccountsCount?: integer,            // GAP-007: Bookkeeping complexity
propertyCount?: integer,                // GAP-006: Rental addon pricing
currentSoftware?: varchar(100),         // GAP-008: Integration eligibility
hasMultipleCurrencies?: boolean,        // GAP-009: Complexity surcharge
hasMultipleEntities?: boolean,          // GAP-010: Group structure
entityCount?: integer,                  // GAP-010: Group surcharge
payrollFrequency?: enum,                // GAP-011: Weekly|fortnightly|monthly
cisRegistered?: boolean,                // GAP-013: CIS addon
incomeStreamsCount?: integer            // GAP-012: SA complexity
```

**Evidence:** `lib/db/schema.ts:1705-1773` (leads table definition)

**Note:** `businessType` field exists but is **freeform varchar**, NOT an enum. Client table has proper `client_type` enum (schema.ts:508-517).

---

### 3.3 Client Schema Analysis

**Table:** `clients` (schema.ts:601-658)

**Entity Type Enum (Properly Defined):**
```typescript
clientTypeEnum = pgEnum("client_type", [
  "individual",
  "company",
  "limited_company",
  "sole_trader",      // ✅ For UK sole traders
  "partnership",       // ✅ For UK partnerships
  "llp",              // ✅ For UK LLPs
  "trust",
  "charity",
  "other"
])
```

**Evidence:** `lib/db/schema.ts:508-517`

**Pricing-Relevant Client Fields:**
```typescript
clientCode: varchar(50).notNull(),
type: clientTypeEnum.notNull(),
vatRegistered: boolean,           // ✅ VAT flag (NOT in leads)
vatNumber: varchar(50),
registrationNumber: varchar(50),  // Companies House number
incorporationDate: date,          // For new vs. established
yearEnd: varchar(10),             // FY end for compliance
```

**Gap:** These fields exist in clients but **NOT in leads**, causing manual data entry during lead-to-client conversion.

---

### 3.4 Proposal Schema Analysis

**Table:** `proposals` (schema.ts:1796-1859)

**Pricing Context Fields:**
```typescript
turnover: varchar(100),                // Band label (e.g., "£90k-£149k")
industry: varchar(100),                // simple|standard|complex|regulated
monthlyTransactions: integer,          // For Model B
pricingModelUsed: enum("model_a"|"model_b")
monthlyTotal: decimal(10,2),
annualTotal: decimal(10,2)
```

**Evidence:** `lib/db/schema.ts:1800-1809`

**Service Configuration (proposal_services):**
```typescript
componentCode: varchar(50),            // Service code (e.g., "COMP_ACCOUNTS")
componentName: varchar(255),
calculation: text,                     // Human-readable breakdown
price: varchar(50),                    // Stored as string for flexibility
config: jsonb                          // complexity, employees, frequency, etc.
```

**Evidence:** `lib/db/schema.ts:1888-1890`

---

### 3.5 Pricing Rules Schema

**Table:** `pricing_rules` (schema.ts:1667-1697)

**Structure:**
```typescript
{
  componentId: uuid,                   // References services.id
  ruleType: enum(turnover_band | transaction_band | per_unit | fixed),
  minValue: decimal(15,2),             // Band minimum (e.g., 90000)
  maxValue: decimal(15,2),             // Band maximum (e.g., 149999)
  price: decimal(10,2),                // Price for this band
  complexityLevel: varchar(50),        // clean|average|complex|disaster
  isActive: boolean
}
```

**Evidence:** `lib/db/schema.ts:1667-1697`

**Example Rule (Conceptual):**
```json
{
  "componentId": "COMP_ACCOUNTS",
  "ruleType": "turnover_band",
  "minValue": 90000,
  "maxValue": 149999,
  "price": 295.00,
  "complexityLevel": "average"
}
```

---

## 4. Lead Capture Forms & UI

### 4.1 Public Lead Capture Form

**File:** `/app/(public)/lead-capture/page.tsx` (lines 1-150+)

**Form Structure:**
- **Step 1:** Company details (companyName, businessType, industry, turnover, employees)
- **Step 2:** Contact details (firstName, lastName, email, phone, position)
- **Step 3:** Services (interestedServices, addOns, notes)

**businessType Options (page.tsx NOT SHOWN but inferred from router):**
- Freeform string field (NOT an enum)
- No entity_type dropdown

**Industry Options:**
```typescript
{ value: "hospitality", label: "Hospitality (Pubs, Hotels, Restaurants)" },
{ value: "retail", label: "Retail" },
{ value: "professional_services", label: "Professional Services" },
{ value: "construction", label: "Construction" },
{ value: "technology", label: "Technology" },
{ value: "e-commerce", label: "E-commerce" },
{ value: "healthcare", label: "Healthcare" },
{ value: "other", label: "Other" }
```

**Evidence:** `/app/(public)/lead-capture/page.tsx:63-72`

**Missing Pricing Driver Fields:**
- ❌ `monthlyTransactions` (GAP-001)
- ❌ `vatRegistered` (GAP-002)
- ❌ `booksCondition` (GAP-003)
- ❌ `propertyCount` (GAP-006)
- ❌ `bankAccountsCount` (GAP-007)
- ❌ Entity type dropdown (businessType is freeform)

---

### 4.2 Client Wizard Modal

**File:** `/components/client-hub/clients/client-wizard-modal.tsx`

**Steps:**
1. Basic Info (name, type dropdown, email, phone)
2. Registration Details (clientCode, registrationNumber, vatNumber, incorporationDate, yearEnd)
3. Service Selection (checkboxes for service catalog)

**Evidence:** Wizard exists at `/components/client-hub/clients/client-wizard-modal.tsx`

**Entity Type Dropdown (Basic Info Step):**
```typescript
// Inferred from schema
<Select name="type">
  <SelectItem value="individual">Individual</SelectItem>
  <SelectItem value="company">Company</SelectItem>
  <SelectItem value="limited_company">Limited Company</SelectItem>
  <SelectItem value="sole_trader">Sole Trader</SelectItem>
  <SelectItem value="partnership">Partnership</SelectItem>
  <SelectItem value="llp">LLP</SelectItem>
  <SelectItem value="trust">Trust</SelectItem>
  <SelectItem value="charity">Charity</SelectItem>
  <SelectItem value="other">Other</SelectItem>
</Select>
```

**Gap:** Lead capture form should have **same entity_type dropdown** for consistency.

---

## 5. DocuSeal Integration Touchpoints

### 5.1 DocuSeal Client

**File:** `/lib/docuseal/client.ts`

**Exports:**
```typescript
docusealClient.createTemplate(...)
docusealClient.createSubmission(...)
docusealClient.getSubmission(...)
```

**Used in:** `app/server/routers/proposals.ts` (lines 18, 853, 887)

---

### 5.2 UK Compliance Fields

**File:** `/lib/docuseal/uk-compliance-fields.ts`

**Purpose:** Generates signature fields for UK compliance (Companies Act, director signatures)

**Function:** `getProposalSignatureFields({ companyName, clientName })`

**Evidence:** `lib/docuseal/uk-compliance-fields.ts:20`

---

### 5.3 DocuSeal Webhook Handler

**File:** `/app/api/webhooks/docuseal/route.ts` (lines 1-899)

**Handles:**
- `submission.completed` event
- Updates `proposals.status = "signed"`
- Updates `proposals.signedPdfUrl`
- Logs to `activityLogs`

**Evidence:** `app/api/webhooks/docuseal/route.ts:326-405`

---

### 5.4 Email Handler (Resend Integration)

**File:** `/lib/docuseal/email-handler.ts`

**Functions:**
```typescript
sendSigningInvitation({ proposalId, proposalNumber, recipientEmail, recipientName, embeddedSigningUrl })
```

**Evidence:** `lib/docuseal/email-handler.ts`

---

## 6. Current Gaps in Service/Pricing Driver Capture

### Priority Gaps (From 55-gaps.md)

| Gap ID | Description | Evidence | Priority | Impact on Pricing |
|--------|-------------|----------|----------|-------------------|
| **GAP-001** | Transaction data not captured in leads | `schema.ts:1705-1773` (no `monthlyTransactions` field) | **HIGH** | Model B unavailable for new leads |
| **GAP-002** | VAT registration flag missing | `schema.ts:1705-1773` (no `vatRegistered`) | **HIGH** | Transaction estimation ±20% error |
| **GAP-003** | No complexity indicators | `lead-capture/page.tsx` (no booksCondition field) | **HIGH** | Complexity multipliers (0.95x to 1.4x) not applied |
| **GAP-004** | No auto-service configuration | `proposals.ts:488` (services array empty) | **CRITICAL** | Manual proposal creation (5-10 min vs. <1 min) |
| **GAP-005** | No pricing preview in lead form | `lead-capture/page.tsx` (no pricing display) | **HIGH** | Lost conversion opportunity |
| **GAP-006** | No rental property count | No `propertyCount` field | MEDIUM | Rental addon (£12/property) not auto-added |
| **GAP-007** | No bank account count | No `bankAccountsCount` field | MEDIUM | Bookkeeping complexity under-estimated |
| **GAP-008** | No accounting software field | No `currentSoftware` field | MEDIUM | Integration eligibility unknown |

**Evidence:** `/docs/70-research/pricing/55-gaps.md` (lines 1-410)

---

### Lead Schema Missing Fields Summary

**From mappings.json and gaps analysis:**

```typescript
// HIGH PRIORITY (Required for accurate pricing)
monthlyTransactions?: integer,        // GAP-001: Model B pricing
vatRegistered?: boolean,              // GAP-002: Transaction estimation
booksCondition?: enum,                // GAP-003: Complexity multiplier
bankAccountsCount?: integer,          // GAP-007: Bookkeeping complexity
propertyCount?: integer,              // GAP-006: Rental addon

// MEDIUM PRIORITY (Improves estimation accuracy)
currentSoftware?: varchar(100),       // GAP-008: Xero/QuickBooks
hasMultipleCurrencies?: boolean,      // GAP-009: Complexity surcharge
hasMultipleEntities?: boolean,        // GAP-010: Group structures
entityCount?: integer,                // GAP-010: Group surcharge

// LOW PRIORITY (Service-specific config)
payrollFrequency?: enum,              // GAP-011: Weekly/monthly
cisRegistered?: boolean,              // GAP-013: CIS addon
incomeStreamsCount?: integer          // GAP-012: SA complexity
```

---

## 7. Service Catalog Mapping

### Services Defined in Schema

**From `/docs/70-research/pricing/10-service-inventory.md`:**

| Code | Name | Category | Pricing Model | Complexity Support |
|------|------|----------|---------------|-------------------|
| `COMP_ACCOUNTS` | Annual Accounts & Corporation Tax | compliance | both | Yes |
| `COMP_CONFIRMATION` | Confirmation Statement | compliance | fixed | No |
| `COMP_SATR` | Self-Assessment Tax Return | compliance | fixed | No |
| `VAT_RETURNS` | Quarterly VAT Returns | vat | both | No |
| `BOOK_BASIC` | Basic Bookkeeping | bookkeeping | both | No |
| `BOOK_FULL` | Full Bookkeeping | bookkeeping | both | Yes |
| `PAYROLL_STANDARD` | Standard Payroll Processing | payroll | fixed | No |
| `PAYROLL_PENSION` | Auto-Enrolment Pension | payroll | fixed | No |
| `MGMT_MONTHLY` | Monthly Management Accounts | management | both | No |
| `SEC_BASIC` | Basic Secretarial | secretarial | fixed | No |
| `TAX_ANNUAL` | Annual Tax Planning Review | tax_planning | fixed | No |
| `TAX_RD` | R&D Tax Claims | tax_planning | percentage | No |
| `ADDON_CIS` | CIS Returns | addon | fixed | No |
| `ADDON_RENTAL` | Additional Rental Properties | addon | fixed | No |
| `ADDON_VAT_REG` | VAT Registration | addon | fixed | No |

**Total:** 15 service components defined

**Evidence:** `/docs/70-research/pricing/10-service-inventory.md:17-36`

---

### Service Auto-Configuration Logic (Missing)

**From mappings.json (serviceAutoConfiguration):**

**Design Phase Rules:**
```typescript
// If lead.interestedServices includes "COMP_ACCOUNTS"
→ Add COMP_ACCOUNTS with estimateComplexity(lead)

// If lead.estimatedEmployees > 0
→ Add PAYROLL_STANDARD with { employees: N, frequency: M }

// If lead.propertyCount > 0
→ Add ADDON_RENTAL with { properties: N }

// If lead.vatRegistered === true
→ Add VAT_RETURNS

// If lead.cisRegistered === true
→ Add ADDON_CIS
```

**Status:** Design phase only (GAP-004)

**Evidence:** `/docs/70-research/pricing/22-mappings.json:213-276`

---

## 8. Pricing Model Configuration

### Transaction Estimation Formula

**Function:** `estimateMonthlyTransactions(turnover, industry, vatRegistered)` (pricing.ts:589-622)

**Base Estimates by Turnover:**
| Turnover Band | Base Transactions/Month |
|---------------|-------------------------|
| £0-£89k | 35 |
| £90k-£149k | 55 |
| £150k-£249k | 80 |
| £250k-£499k | 120 |
| £500k-£749k | 180 |
| £750k-£999k | 250 |
| £1m+ | 350 |

**Industry Multipliers:**
- `simple`: 0.7x
- `standard`: 1.0x
- `complex`: 1.4x
- `regulated`: 1.2x

**VAT Adjustment:**
- If `vatRegistered === true`: estimate × 1.2

**Evidence:** `app/server/routers/pricing.ts:589-622`

---

### Payroll Pricing Tiers

**Function:** `calculatePayroll(employees, frequency)` (pricing.ts:112-132)

| Employee Range | Base Monthly Price (GBP) |
|----------------|---------------------------|
| 0-1 (Director only) | £18 |
| 1-5 | £50 |
| 6-10 | £70 |
| 11-15 | £90 |
| 16-20 | £110 |
| 20+ | £130 + ((employees - 20) × £2) |

**Frequency Multipliers:**
- Weekly: base × 3
- Fortnightly: base × 2
- 4-weekly: base × 2
- Monthly: base × 1

**Evidence:** `app/server/routers/pricing.ts:112-132`

---

## 9. Summary & Recommendations

### Architecture Strengths
✅ Dual pricing model (Model A & B) fully implemented  
✅ Comprehensive service catalog with 15+ service codes  
✅ Tenant-isolated pricing rules table with banded structure  
✅ tRPC routers for pricing, proposals, leads  
✅ DocuSeal e-signature integration (template, submission, webhook)  
✅ Transaction estimation fallback logic  
✅ Complexity and industry multipliers  

### Critical Gaps
❌ Lead capture missing 8+ pricing driver fields (GAP-001 to GAP-013)  
❌ No auto-service configuration from lead data (GAP-004)  
❌ No pricing preview in lead capture form (GAP-005)  
❌ `businessType` freeform string (should be entity_type enum)  
❌ `proposals.createFromLead` produces empty services array  

### Recommended Next Steps (Research Phase)
1. **Map UK pricing data to pricing_rules table structure** (turnover bands, transaction bands)
2. **Define service-to-market-data mappings** (which CSV rows → which service codes)
3. **Create lead field enhancement specification** (schema changes for GAP-001, GAP-002, GAP-003)
4. **Design auto-service configuration algorithm** (lead data → service selection logic)

**No app code changes in this phase.**

---

**End of Phase 0 Inventory**
