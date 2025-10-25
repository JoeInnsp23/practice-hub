# Service Form Schema Mismatch - Refactor Required

**Date Discovered:** 2025-01-25
**Priority:** Medium
**Complexity:** Medium
**Estimated Effort:** 2-3 hours
**Discovered During:** Biome lint cleanup - Phase 6 File 7

## Problem Summary

The `ServiceModal` component uses a simplified `Service` interface that is incompatible with the database schema, currently masked by `as any` casts. This prevents proper type safety and creates a maintenance risk.

## Current State

### Database Schema (`lib/db/schema.ts` - services table)
```typescript
{
  id: string (UUID)
  tenantId: string (UUID)
  code: string                    // ← Required, missing in modal
  name: string
  description: string | null
  category: enum("compliance" | "vat" | "bookkeeping" | "payroll" | "management" | "secretarial" | "tax_planning" | "addon")
  pricingModel: enum("turnover" | "transaction" | "both" | "fixed")  // ← Required, missing in modal
  defaultRate: string | null       // ← Missing in modal
  basePrice: string | null         // ← Missing in modal
  price: string | null             // ← Modal has number
  priceType: enum("hourly" | "fixed" | "retainer" | "project" | "percentage") | null
  duration: number | null          // ← Modal has string
  supportsComplexity: boolean      // ← Missing in modal
  tags: string[] | null
  isActive: boolean
  metadata: jsonb | null           // ← Missing in modal
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Current Modal Interface (`components/client-hub/services/service-modal.tsx:50-60`)
```typescript
interface Service {
  name: string                    // ✅ Matches
  description: string             // ⚠️ Not nullable in modal
  category: string                // ⚠️ Generic string, not enum
  price: number                   // ❌ Database has string | null
  priceType: "fixed" | "hourly" | "monthly" | "project"  // ❌ Missing "retainer", "percentage"; has "monthly" not in DB
  duration?: string               // ❌ Database has number | null
  isActive: boolean               // ✅ Matches
  features?: string[]             // ❌ Not in database schema
  tags?: string[]                 // ✅ Matches
}
```

### Current Page Type (`app/client-hub/services/page.tsx:34-61`)
```typescript
type Service = {
  // ✅ Matches database schema exactly
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  category: "compliance" | "vat" | "bookkeeping" | "payroll" | "management" | "secretarial" | "tax_planning" | "addon";
  pricingModel: "turnover" | "transaction" | "both" | "fixed";
  defaultRate: string | null;
  basePrice: string | null;
  price: string | null;
  priceType: "hourly" | "fixed" | "retainer" | "project" | "percentage" | null;
  duration: number | null;
  supportsComplexity: boolean;
  tags: string[] | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Type Mismatches

| Field | Modal | Database | Issue |
|-------|------|----------|-------|
| `code` | Missing | `string` (required) | Modal doesn't collect required field |
| `pricingModel` | Missing | `enum` (required) | Modal doesn't collect required field |
| `price` | `number` | `string \| null` | Type mismatch |
| `priceType` | `"fixed" \| "hourly" \| "monthly" \| "project"` | `"hourly" \| "fixed" \| "retainer" \| "project" \| "percentage" \| null` | Incomplete enum + extra "monthly" |
| `duration` | `string \| undefined` | `number \| null` | Type mismatch (string vs number) |
| `description` | `string` (required) | `string \| null` | Nullability mismatch |
| `category` | `string` | Specific enum | Lacks type safety |
| `features` | `string[]` | Not in schema | Extra field not persisted |
| Missing fields | - | `defaultRate`, `basePrice`, `supportsComplexity`, `metadata` | Modal doesn't collect database fields |

## Files Affected

1. **`app/client-hub/services/page.tsx`** (422-425)
   - Lines 422-425: `as any` casts masking type mismatch
   - Line 199: `handleSaveService` function accepts `Partial<Service>` but modal expects different type

2. **`components/client-hub/services/service-modal.tsx`** (50-66)
   - Lines 50-60: `Service` interface incompatible with schema
   - Line 65: `onSave` callback signature mismatch

3. **`app/server/routers/services.ts`** (10-18)
   - Line 10: `insertServiceSchema` expects database-compatible fields
   - Line 13-18: Required fields include `code` and `pricingModel`

## Router Contract

The tRPC router expects (from `insertServiceSchema`):

**Create/Update Input:**
```typescript
{
  code: string              // ← Required
  name: string
  description?: string | null
  category: "compliance" | "vat" | "bookkeeping" | "payroll" | "management" | "secretarial" | "tax_planning" | "addon"
  pricingModel: "turnover" | "transaction" | "both" | "fixed"  // ← Required
  defaultRate?: string | null
  basePrice?: string | null
  price?: string | null      // ← String, not number
  priceType?: "hourly" | "fixed" | "retainer" | "project" | "percentage" | null
  duration?: number | null   // ← Number, not string
  supportsComplexity?: boolean
  tags?: string[] | null
  isActive: boolean
  metadata?: unknown
}
```

## Required Changes

### 1. Update ServiceModal Interface

```typescript
interface Service {
  code: string                   // Added
  name: string
  description?: string | null    // Made nullable
  category: "compliance" | "vat" | "bookkeeping" | "payroll" | "management" | "secretarial" | "tax_planning" | "addon"  // Specific enum
  pricingModel: "turnover" | "transaction" | "both" | "fixed"  // Added
  price?: string | null          // Changed from number
  priceType?: "hourly" | "fixed" | "retainer" | "project" | "percentage" | null  // Fixed enum
  duration?: number | null       // Changed from string
  defaultRate?: string | null    // Added
  basePrice?: string | null      // Added
  supportsComplexity?: boolean   // Added
  tags?: string[] | null
  isActive: boolean
  metadata?: unknown             // Added
  // Remove: features (not in database schema)
}
```

### 2. Update Form Fields

**Add Fields:**
- Service code input (required, unique identifier)
- Pricing model selector (turnover/transaction/both/fixed)
- Default rate input (optional)
- Base price input (optional)
- Supports complexity toggle
- Metadata JSON editor (optional, advanced)

**Modify Fields:**
- Price: Change input type to accept string
- Price type: Add "retainer" and "percentage" options, remove "monthly"
- Duration: Change to number input (minutes)
- Category: Use specific enum options
- Description: Allow null

**Remove Fields:**
- Features array (not in database schema)

### 3. Update Form Submission

```typescript
const onSubmit = (data: ServiceFormValues) => {
  onSave({
    code: data.code,
    name: data.name,
    description: data.description || null,
    category: data.category,
    pricingModel: data.pricingModel,
    price: data.price || null,
    priceType: data.priceType || null,
    duration: data.duration ? Number.parseInt(data.duration) : null,
    defaultRate: data.defaultRate || null,
    basePrice: data.basePrice || null,
    supportsComplexity: data.supportsComplexity || false,
    tags: tags.length > 0 ? tags : null,
    isActive: data.isActive,
    metadata: null,  // Can add advanced editor later
  });
};
```

### 4. Update Page Integration

**`app/client-hub/services/page.tsx`:**
- Remove `as any` casts (lines 422-425)
- Update `handleSaveService` to pass data directly without transformation

```typescript
const handleSaveService = (data: Partial<Service>) => {
  if (editingService) {
    updateMutation.mutate({
      id: editingService.id,
      data  // No cast needed
    });
  } else {
    // Ensure required fields present
    if (data.code && data.name && data.category && data.pricingModel) {
      createMutation.mutate(data);  // No cast needed
    }
  }
};
```

## Testing Requirements

1. **Create Service Flow:**
   - Enter all required fields (code, name, category, pricingModel)
   - Add optional fields (price, duration, tags)
   - Save and verify database record created correctly

2. **Edit Service Flow:**
   - Load existing service with all fields
   - Modify fields
   - Update and verify changes persist

3. **Field Validation:**
   - Verify code is required and unique
   - Verify pricing model is required
   - Verify duration accepts numbers only
   - Verify category uses specific enum values

## Temporary Workaround

For immediate lint cleanup, add biome-ignore comments with reference to this document:

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Service form/schema mismatch - see docs/updates/2025-01-service-form-schema-mismatch.md
onSave={handleSaveService as any}
// biome-ignore lint/suspicious/noExplicitAny: Service form/schema mismatch - see docs/updates/2025-01-service-form-schema-mismatch.md
service={(editingService || undefined) as any}
```

## Acceptance Criteria

- [ ] Form collects all required database fields (code, pricingModel)
- [ ] Form uses correct types (price: string, duration: number)
- [ ] Price type enum matches database (includes "retainer", "percentage")
- [ ] Category uses specific enum values
- [ ] Features field removed (not in database)
- [ ] No `as any` casts in page or modal
- [ ] TypeScript compiles with no errors
- [ ] Biome lint passes with no violations
- [ ] Create service flow works end-to-end
- [ ] Edit service flow works end-to-end

## Risks

- **Medium Impact Change:** This touches core service management functionality
- **Data Integrity:** Missing required fields (code, pricingModel) could cause database errors
- **User Workflow Disruption:** Form fields will change

## Recommendations

1. **Create separate feature branch** for this work
2. **Add validation tests** before making changes
3. **Manual QA required** before merging
4. **Update service documentation** after changes

## Related Files to Review

- `lib/db/schema.ts` - services table definition
- `app/server/routers/services.ts` - tRPC router contract
- `components/client-hub/services/service-card.tsx` - Display component

## Story Creation Template

```markdown
**Title:** Refactor Service Form to Match Database Schema

**As a** developer
**I want** the service form to use proper type-safe schema alignment
**So that** we eliminate type safety issues and ensure data integrity

**Description:**
The current service form component uses a simplified interface incompatible with the database schema, requiring `as any` casts that bypass type safety. This refactor aligns the form with the actual database structure.

**Technical Details:** See `docs/updates/2025-01-service-form-schema-mismatch.md`

**Subtasks:**
1. Update ServiceModal interface to match database schema
2. Add missing required fields (code, pricingModel)
3. Fix type mismatches (price: string, duration: number)
4. Update price type enum (add retainer/percentage, remove monthly)
5. Remove features field (not in database)
6. Update form validation and submission logic
7. Remove `as any` casts from page
8. Add tests for create/edit flows

**Effort:** 3 story points
**Priority:** Medium
**Labels:** technical-debt, type-safety, refactor
```
