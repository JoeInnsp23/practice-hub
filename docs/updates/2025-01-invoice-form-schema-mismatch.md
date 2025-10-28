# Invoice Form Schema Mismatch - Refactor Required

**Date Discovered:** 2025-01-25
**Priority:** Medium
**Complexity:** High
**Estimated Effort:** 4-6 hours
**Discovered During:** Biome lint cleanup - Phase 6 File 5

## Problem Summary

The `InvoiceForm` component and the database schema have **incompatible type definitions**, currently masked by `as any` casts. This prevents proper type safety and creates a maintenance risk.

## Current State

### Database Schema (`lib/db/schema.ts` - invoices table)
```typescript
{
  id: string (UUID)
  tenantId: string (UUID)
  invoiceNumber: string
  clientId: string (UUID)          // ← Foreign key to clients table
  issueDate: date
  dueDate: date
  paidDate: date | null
  subtotal: decimal(10,2)          // ← Calculated from items
  taxRate: decimal(5,2) | null     // ← Invoice-level tax %
  taxAmount: decimal(10,2) | null  // ← Calculated tax amount
  discount: decimal(10,2) | null
  total: decimal(10,2)             // ← Final total
  amountPaid: decimal(10,2) | null
  status: enum("draft" | "sent" | "paid" | "overdue" | "cancelled")
  currency: string | null
  notes: text | null
  terms: text | null               // ← Payment terms
  purchaseOrderNumber: string | null
  metadata: jsonb | null
  createdAt: timestamp
  updatedAt: timestamp
  createdById: string | null
}
```

### Invoice Items Schema (`lib/db/schema.ts` - invoiceItems table)
```typescript
{
  id: string (UUID)
  invoiceId: string (UUID)         // ← Foreign key to invoices
  description: text
  quantity: decimal(10,2)
  rate: decimal(10,2)
  amount: decimal(10,2)            // ← quantity * rate
  createdAt: timestamp
}
```

### Current Form Interface (`components/client-hub/invoices/invoice-form.tsx:51-60`)
```typescript
interface Invoice {
  client: string                    // ❌ Should be clientId: string (UUID)
  invoiceNumber: string            // ✅ Matches
  issueDate: string                // ✅ Matches (date string)
  dueDate: string                  // ✅ Matches (date string)
  status: "draft" | "sent" | "paid" | "overdue"  // ⚠️ Missing "cancelled"
  paymentTerms: string             // ❌ Database uses "terms"
  notes?: string                   // ✅ Matches
  lineItems?: LineItem[]           // ⚠️ Structure mismatch
}

interface LineItem {
  id: string
  description: string              // ✅ Matches invoiceItems
  quantity: number                 // ✅ Matches invoiceItems
  rate: number                     // ✅ Matches invoiceItems
  tax: number                      // ❌ Database has invoice-level taxRate, not per-item
  total: number                    // ⚠️ Calculated differently
}
```

### Current Page Type (`app/client-hub/invoices/page.tsx:37-60`)
```typescript
type Invoice = {
  id: string
  tenantId: string
  invoiceNumber: string
  clientId: string                 // ✅ Correct
  issueDate: string | Date
  dueDate: string | Date
  paidDate: string | Date | null
  subtotal: string
  taxRate: string | null
  taxAmount: string | null
  discount: string | null
  total: string
  amountPaid: string | null
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  currency: string | null
  notes: string | null
  terms: string | null             // ✅ Correct
  purchaseOrderNumber: string | null
  metadata: unknown
  createdAt: Date
  updatedAt: Date
  createdById: string | null
}
```

## Type Mismatches

| Field | Form | Database | Issue |
|-------|------|----------|-------|
| `client` vs `clientId` | `client: string` | `clientId: UUID` | Field name and semantic mismatch |
| `paymentTerms` vs `terms` | `paymentTerms: string` | `terms: text` | Field name mismatch |
| `status` enum | Missing "cancelled" | Includes "cancelled" | Incomplete enum |
| Tax calculation | Per-line `tax: number` | Invoice-level `taxRate` | Calculation model mismatch |
| `lineItems` structure | Custom `LineItem[]` | Separate `invoiceItems` table | Relational mapping needed |
| Missing fields | - | `subtotal`, `taxAmount`, `discount`, `total`, `amountPaid`, `currency`, `purchaseOrderNumber`, `metadata` | Form doesn't collect required data |

## Files Affected

1. **`app/client-hub/invoices/page.tsx`** (394-395)
   - Lines 394-395: `as any` casts masking type mismatch
   - Line 171: `handleSaveInvoice` function transforms data incorrectly

2. **`components/client-hub/invoices/invoice-form.tsx`** (51-68)
   - Lines 51-60: `Invoice` interface incompatible with schema
   - Lines 42-49: `LineItem` interface incompatible with `invoiceItems` schema
   - Line 64-66: `onSave` callback signature mismatch

3. **`app/server/routers/invoices.ts`** (34-44)
   - Line 34-44: `invoiceSchema` expects database-compatible fields
   - Line 43: `items` array expects `invoiceItemSchema` structure

## Router Contract

The tRPC router expects:

**Create/Update Input:**
```typescript
{
  invoiceNumber: string
  clientId: string              // ← UUID required
  issueDate: string
  dueDate: string
  paidDate?: string
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: string              // ← Required
  taxRate?: string
  taxAmount?: string
  discount?: string
  total: string                 // ← Required
  amountPaid?: string
  currency?: string
  notes?: string
  terms?: string                // ← Not "paymentTerms"
  purchaseOrderNumber?: string
  metadata?: unknown
  items?: Array<{               // ← invoiceItemSchema
    description: string
    quantity: string            // ← decimal as string
    rate: string                // ← decimal as string
    amount: string              // ← quantity * rate
  }>
}
```

## Required Changes

### 1. Update InvoiceForm Interface
```typescript
// components/client-hub/invoices/invoice-form.tsx
interface Invoice {
  clientId: string               // Changed from "client"
  invoiceNumber: string
  issueDate: string
  dueDate: string
  paidDate?: string | null
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  subtotal: string               // Added
  taxRate?: string | null        // Added
  taxAmount?: string | null      // Added
  discount?: string | null       // Added
  total: string                  // Added
  amountPaid?: string | null     // Added
  currency?: string | null       // Added
  terms?: string | null          // Changed from "paymentTerms"
  notes?: string | null
  purchaseOrderNumber?: string | null  // Added
  metadata?: unknown             // Added
  items?: InvoiceItem[]          // Renamed from "lineItems"
}

interface InvoiceItem {          // Renamed from "LineItem"
  description: string
  quantity: string               // Changed from number (decimal as string)
  rate: string                   // Changed from number (decimal as string)
  amount: string                 // Changed from total, removed tax
}
```

### 2. Update Form Fields

**Add Fields:**
- Client selector (dropdown fetching from `trpc.clients.list`)
- Currency input (dropdown with common currencies)
- Discount input (optional)
- Tax rate input (invoice-level, percentage)
- Purchase order number input (optional)

**Modify Fields:**
- Rename "Payment Terms" → "Terms"
- Remove per-line-item tax calculation
- Add invoice-level tax calculation
- Update line item total: `amount = quantity * rate`

**Update Calculations:**
```typescript
const calculateInvoiceTotals = () => {
  // Sum all line items
  const subtotal = items.reduce((sum, item) =>
    sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0
  )

  // Apply invoice-level tax
  const taxAmount = taxRate ? (subtotal * parseFloat(taxRate) / 100) : 0

  // Apply discount
  const discountAmount = discount ? parseFloat(discount) : 0

  // Calculate final total
  const total = subtotal + taxAmount - discountAmount

  return { subtotal, taxAmount, total }
}
```

### 3. Update Form Submission

```typescript
const onSubmit = (data: InvoiceFormValues) => {
  const { subtotal, taxAmount, total } = calculateInvoiceTotals()

  onSave({
    ...data,
    subtotal: subtotal.toFixed(2),
    taxAmount: taxRate ? taxAmount.toFixed(2) : null,
    total: total.toFixed(2),
    amountPaid: "0.00",  // Default for new invoices
    items: lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: (parseFloat(item.quantity) * parseFloat(item.rate)).toFixed(2)
    }))
  })
}
```

### 4. Update Page Integration

**`app/client-hub/invoices/page.tsx`:**
- Remove `handleSaveInvoice` transformation logic (lines 171-208)
- Pass data directly to tRPC mutations (remove `as any` casts)
- Update duplicate invoice logic to match new schema

```typescript
const handleSaveInvoice = (data: InvoiceFormData) => {
  if (editingInvoice) {
    updateMutation.mutate({
      id: editingInvoice.id,
      data  // No transformation needed
    })
  } else {
    createMutation.mutate(data)  // No transformation needed
  }
}
```

## Testing Requirements

1. **Create Invoice Flow:**
   - Select client from dropdown
   - Add multiple line items
   - Apply invoice-level tax rate
   - Apply discount
   - Save as draft
   - Verify database records created correctly

2. **Edit Invoice Flow:**
   - Load existing invoice with items
   - Modify line items
   - Change tax rate
   - Update and verify changes persist

3. **Calculation Verification:**
   - Verify subtotal = sum of (quantity × rate) for all items
   - Verify taxAmount = subtotal × (taxRate / 100)
   - Verify total = subtotal + taxAmount - discount

4. **Client Integration:**
   - Verify client dropdown populates correctly
   - Verify client selection saves `clientId` (UUID)

## Migration Considerations

**Data Migration:** Not required - database schema is correct

**Backward Compatibility:** This is a UI-only change. Existing invoices in database remain valid.

**Feature Flags:** Consider adding feature flag for testing:
```typescript
const USE_NEW_INVOICE_FORM = process.env.NEXT_PUBLIC_FEATURE_NEW_INVOICE_FORM === "true"
```

## Acceptance Criteria

- [ ] Form uses `clientId` (UUID) instead of `client` (string)
- [ ] Form uses `terms` instead of `paymentTerms`
- [ ] Form collects all required database fields
- [ ] Tax calculation moved to invoice-level (not per-item)
- [ ] Line items match `invoiceItems` schema
- [ ] No `as any` casts in page or form
- [ ] TypeScript compiles with no errors
- [ ] Biome lint passes with no violations
- [ ] Create invoice flow works end-to-end
- [ ] Edit invoice flow works end-to-end
- [ ] Calculations verified correct

## Dependencies

- `trpc.clients.list` query (for client dropdown)
- Currency list (consider adding to shared constants)
- Updated Zod validation schema

## Risks

- **High Impact Change:** This touches core invoice functionality
- **User Workflow Disruption:** Form fields will change significantly
- **Data Loss Risk:** If not properly tested, could corrupt invoice data
- **Testing Gap:** No existing E2E tests for invoice creation

## Recommendations

1. **Create separate feature branch** for this work
2. **Add E2E tests** before making changes (baseline current behavior)
3. **Implement behind feature flag** to allow gradual rollout
4. **Manual QA required** before merging to main
5. **Consider pair programming** due to complexity
6. **Update documentation** for invoice creation flow

## Related Files to Review

- `lib/db/schema.ts` - invoices and invoiceItems tables
- `app/server/routers/invoices.ts` - tRPC router contract
- `components/client-hub/invoices/invoice-list.tsx` - Display component (may need updates)

## Temporary Workaround

For immediate lint cleanup, add biome-ignore comments with reference to this document:

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Invoice form/schema mismatch - see docs/updates/2025-01-invoice-form-schema-mismatch.md
invoice={(editingInvoice || undefined) as any}
// biome-ignore lint/suspicious/noExplicitAny: Invoice form/schema mismatch - see docs/updates/2025-01-invoice-form-schema-mismatch.md
onSave={handleSaveInvoice as any}
```

## Story Creation Template

```markdown
**Title:** Refactor Invoice Form to Match Database Schema

**As a** developer
**I want** the invoice form to use proper type-safe schema alignment
**So that** we eliminate type safety issues and prevent data corruption

**Description:**
The current invoice form component uses a custom interface incompatible with the database schema, requiring `as any` casts that bypass type safety. This refactor aligns the form with the actual database structure.

**Technical Details:** See `docs/updates/2025-01-invoice-form-schema-mismatch.md`

**Subtasks:**
1. Update InvoiceForm interface to match database schema
2. Add client selector dropdown (clientId instead of client string)
3. Move tax calculation from per-item to invoice-level
4. Add missing fields (subtotal, taxAmount, discount, total, etc.)
5. Update line items to match invoiceItems schema
6. Remove data transformation logic from page
7. Add E2E tests for create/edit flows
8. Remove `as any` casts

**Acceptance Criteria:** See document

**Effort:** 6 story points
**Priority:** Medium
**Labels:** technical-debt, type-safety, refactor
```
