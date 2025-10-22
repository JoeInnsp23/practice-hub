# User Story: Invoice Detail Page & Client Code Generation Fix

**Story ID:** STORY-1.3
**Epic:** Epic 1 - Critical Path & Production Readiness
**Features:** FR3 (Invoice Detail Page) + FR4 (Client Code Generation Fix)
**Priority:** Critical
**Effort:** 1-2 days
**Status:** Ready for Development

---

## User Story

**As a** staff member managing client invoices
**I want** a detailed invoice view page and deterministic client code generation
**So that** I can view complete invoice information and ensure unique client codes without collisions

---

## Business Value

- **Completeness:** Provides missing invoice detail view (currently only list view exists)
- **Efficiency:** Enables quick access to invoice line items and payment history
- **Data Integrity:** Fixes client code generation bug preventing duplicates
- **User Experience:** Matches archived CRM functionality for invoice management

---

## Acceptance Criteria

### Functional Requirements - Invoice Detail Page (FR3)

**AC1: Invoice Detail Route**
- **Given** an invoice exists in the system
- **When** a user navigates to `/client-hub/invoices/[id]`
- **Then** the invoice detail page is displayed

**AC2: Invoice Summary Display**
- **Given** the invoice detail page loads
- **When** the page renders
- **Then** full invoice details are displayed: client name, invoice number, dates (created, due, paid), status, totals (subtotal, VAT, total)

**AC3: Line Items Table**
- **Given** the invoice detail page is displayed
- **When** the user views the line items section
- **Then** a table shows: description, quantity, rate, amount for each line item
- **And** line items are formatted with currency symbols

**AC4: Payment History**
- **Given** payments have been made against the invoice
- **When** the user views the payment history section
- **Then** all payments are listed with: date, amount, payment method
- **And** running balance is calculated

**AC5: PDF Export**
- **Given** the user is viewing an invoice
- **When** the "Export PDF" button is clicked
- **Then** invoice PDF is generated and downloaded
- **And** PDF generation uses existing PDF service

**AC6: Edit Button (Draft Invoices)**
- **Given** an invoice is in "draft" status
- **When** the user views the invoice detail page
- **Then** an "Edit" button is visible and functional
- **And** clicking "Edit" navigates to the invoice edit form

**AC7: Status Change Actions**
- **Given** the user has appropriate permissions
- **When** the user views an invoice
- **Then** status change buttons are available (e.g., "Mark as Sent", "Mark as Paid")
- **And** clicking a status button updates the invoice status

**AC8: Navigation from List**
- **Given** the user is on the invoice list page
- **When** the user clicks an invoice row or "View" button
- **Then** they navigate to the invoice detail page

### Functional Requirements - Client Code Fix (FR4)

**AC9: Remove Math.random()**
- **Given** a lead is being converted to a client
- **When** client code generation logic runs
- **Then** Math.random() at lib/client-portal/auto-convert-lead.ts:281-282 is removed
- **And** deterministic sequential or date-based suffix is used

**AC10: Sequential Suffix Logic**
- **Given** a new client is being created
- **When** client code is generated
- **Then** the system queries for the maximum existing clientCode suffix
- **And** increments the suffix by 1 for the new client

**AC11: Uniqueness Check**
- **Given** a client code is generated
- **When** before assignment
- **Then** the system checks if the code already exists
- **And** retries with a different code if collision detected

**AC12: Unique Constraint**
- **Given** the clients table schema
- **When** the database is updated
- **Then** a unique constraint is added on (tenant_id, client_code)
- **And** duplicate client codes within a tenant are prevented at database level

**AC13: Collision Handling**
- **Given** a race condition causes duplicate code generation attempts
- **When** the database unique constraint is violated
- **Then** the system retries code generation with a new suffix
- **And** collision is handled gracefully within transaction

**AC14: Seed Data Update**
- **Given** seed data is regenerated
- **When** the database is seeded
- **Then** all clients have unique client codes
- **And** client codes follow the new deterministic pattern

**AC15: Concurrent Creation Test**
- **Given** multiple clients are created simultaneously
- **When** concurrent requests generate client codes
- **Then** no duplicate codes are created
- **And** all operations complete successfully

### Integration Requirements

**AC16: Backend Endpoint Exists**
- **Given** the invoice detail page is functional
- **When** tRPC `invoices.getById()` is called
- **Then** full invoice data is returned (backend already exists at invoices.ts:97-122)

**AC17: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** invoices or clients are queried
- **Then** all queries filter by tenantId
- **And** cross-tenant access is prevented

### Quality Requirements

**AC18: Performance**
- **Given** the invoice detail page is loaded
- **When** performance is measured
- **Then** page load time is <2 seconds
- **And** client code generation completes in <100ms

---

## Technical Implementation

### Database Schema Changes

```typescript
// Add unique constraint to clients table
// Migration: Direct schema update (no migration files per CLAUDE.md Rule #12)

// In lib/db/schema.ts
export const clients = pgTable("clients", {
  // ... existing fields
}, (table) => ({
  // Add unique constraint
  tenantClientCodeUnique: unique().on(table.tenantId, table.clientCode),
}));

// SQL equivalent:
// CREATE UNIQUE INDEX clients_tenant_code_unique ON clients(tenant_id, client_code);
```

### File Structure

```
app/client-hub/invoices/
  [id]/
    page.tsx          # Invoice detail page
components/client-hub/
  invoice-detail-card.tsx  # Invoice detail component
lib/client-portal/
  auto-convert-lead.ts     # Fix client code generation logic
```

### Client Code Generation Fix

```typescript
// lib/client-portal/auto-convert-lead.ts

// BEFORE (lines 281-282):
const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
const clientCode = `${prefix}-${suffix}`;

// AFTER:
async function generateClientCode(prefix: string, tenantId: string): Promise<string> {
  // Query max client code for this prefix and tenant
  const maxCode = await db
    .select({ clientCode: clients.clientCode })
    .from(clients)
    .where(
      and(
        eq(clients.tenantId, tenantId),
        like(clients.clientCode, `${prefix}-%`)
      )
    )
    .orderBy(desc(clients.clientCode))
    .limit(1);

  let suffix = 1;
  if (maxCode.length > 0 && maxCode[0].clientCode) {
    const existingSuffix = parseInt(maxCode[0].clientCode.split('-')[1] || '0');
    suffix = existingSuffix + 1;
  }

  return `${prefix}-${suffix.toString().padStart(3, '0')}`;
}

// Use in transaction to handle race conditions
const clientCode = await generateClientCode(prefix, tenantId);

try {
  // Insert with unique code
  await db.insert(clients).values({ ...clientData, clientCode });
} catch (error) {
  if (error.code === '23505') { // Unique constraint violation
    // Retry with new code
    const retryCode = await generateClientCode(prefix, tenantId);
    await db.insert(clients).values({ ...clientData, clientCode: retryCode });
  }
}
```

### Invoice Detail Page Implementation

```typescript
// app/client-hub/invoices/[id]/page.tsx
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await trpc.invoices.getById.query({ id: params.id });

  return (
    <div className="container mx-auto p-6">
      <InvoiceDetailCard invoice={invoice} />
    </div>
  );
}
```

### Technical Notes

- **Invoice Backend:** Existing `invoices.getById()` endpoint at invoices.ts:97-122 - just wire UI
- **Component Pattern:** Follow task detail page pattern (task-details.tsx)
- **Client Code:** Use database transaction to ensure uniqueness
- **Index:** Add index on clients.clientCode for query performance
- **Seed Data:** Update scripts/seed.ts with unique client codes

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] Invoice detail route created at `/client-hub/invoices/[id]/page.tsx`
- [ ] Full invoice details displayed (client, dates, status, totals)
- [ ] Line items table displays descriptions, quantities, rates, amounts
- [ ] Payment history section shows all payments with dates and amounts
- [ ] PDF export button functional (wire to existing PDF service)
- [ ] Edit button visible for draft invoices only
- [ ] Status change action buttons functional
- [ ] Navigation from invoice list to detail page working
- [ ] Math.random() removed from auto-convert-lead.ts:281-282
- [ ] Sequential suffix logic implemented with query for max code
- [ ] Uniqueness check before assignment implemented
- [ ] Unique constraint added to clients(tenant_id, client_code)
- [ ] Collision handling with retry logic implemented
- [ ] Seed data updated with unique client codes
- [ ] Concurrent client creation tested (no duplicates)
- [ ] Multi-tenant isolation verified (invoice/client queries filter by tenantId)
- [ ] Unit tests written for client code generation logic
- [ ] Integration tests for invoice detail page and client code uniqueness
- [ ] E2E tests for invoice detail navigation and client creation
- [ ] Code reviewed with focus on transaction handling and uniqueness
- [ ] Documentation updated: client code generation logic
- [ ] Performance benchmarks met (<2s page load, <100ms code generation)
- [ ] No regressions in existing invoice/client functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- None (independent of other stories)

**Downstream:**
- None

**External:**
- None

---

## Testing Strategy

### Unit Tests
- Test client code generation with sequential suffix
- Test uniqueness check logic
- Test collision retry logic
- Test invoice getById query

### Integration Tests
- Test invoice detail page data loading
- Test client code uniqueness with concurrent inserts
- Test unique constraint enforcement

### E2E Tests
- Test navigation from invoice list to detail page
- Test invoice PDF export
- Test client creation with unique code generation
- Test concurrent client creation (simulate race condition)

---

## Risks & Mitigation

**Risk:** Client code race conditions during concurrent creation
**Mitigation:** Use database transaction with unique constraint; implement retry logic on collision
**Impact:** Low - handled gracefully with retry

**Risk:** Invoice detail page performance with large line items
**Mitigation:** Paginate line items if >50 items; optimize query with proper indexes
**Impact:** Low - most invoices have <20 line items

---

## Notes

- Invoice detail backend already exists (invoices.ts:97-122) - just wire UI route
- Client code bug confirmed at auto-convert-lead.ts:281-282 (Math.random())
- Use InvoiceDetailCard component following task detail pattern
- Add index on clients.clientCode for uniqueness check performance
- Consider adding client code format validation (e.g., "ABC-001" pattern)
- Test with high-concurrency scenario to verify collision handling

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-1 - Critical Path & Production Readiness
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR3 + FR4)
