# Epic 1: Critical Path & Production Readiness - Brownfield Enhancement

**Epic ID:** EPIC-1
**Status:** Draft
**Tier:** 1
**Estimated Effort:** 5-9 days
**Priority:** Critical
**Created:** 2025-10-22

---

## Epic Goal

Complete all production-blocking features including legal pages (GDPR compliance), HMRC VAT validation integration, invoice detail views, and client code generation fix to enable production release candidate for Q1-Q2 tax season.

---

## Epic Description

### Existing System Context

**Current State:**
- Practice Hub multi-tenant platform built on Next.js 15, tRPC, Better Auth, PostgreSQL/Drizzle ORM
- Migrated from archived CRM (React 18 + Vite + Supabase) to modern stack
- 82 features complete (63%), but missing critical regulatory and workflow features
- Companies House API integration exists as reference pattern (clients.ts:490-607)

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy
- Infrastructure: Docker Compose (dev), Coolify + Hetzner (production target)

**Integration Points:**
- tRPC routers: clients.ts, invoices.ts
- Database schema: lib/db/schema.ts (direct updates, no migrations per CLAUDE.md Rule #12)
- Multi-tenant architecture: All queries must filter by tenantId
- External APIs: HMRC API integration (sandbox credentials available)

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 4 critical production blockers:

1. **Legal Pages Implementation (FR1)** - 6 features
   - Privacy Policy, Terms of Service, Cookie Policy pages
   - Footer links and signup flow integration
   - Admin content management UI
   - **Blocker:** GDPR compliance requirement

2. **HMRC VAT Validation Integration (FR2)** - 1 feature
   - OAuth 2.0 flow for HMRC authentication
   - VAT validation in client onboarding/edit forms
   - Sandbox and production credential support
   - **Value:** Eliminates manual verification, ensures data accuracy

3. **Invoice Detail Page (FR3)** - 1 feature
   - Create route at app/client-hub/invoices/[id]/page.tsx
   - Display full invoice details, line items, payment history
   - Wire to existing invoices.getById() tRPC endpoint (line 97-122)
   - **Status:** Backend exists, just needs UI route

4. **Client Code Generation Fix (FR4)** - 1 feature
   - Remove Math.random() bug from auto-convert-lead.ts:281-282
   - Implement deterministic sequential/date-based suffix
   - Add unique constraint to clients.clientCode
   - **Bug:** Current random suffix causes potential duplicates

**How It Integrates:**
- Legal pages: New Next.js routes under app/(legal)/ with footer component updates
- HMRC integration: Follows Companies House pattern (clients.ts:490-607), extends clients tRPC router
- Invoice detail: New route connecting to existing invoices.getById() endpoint
- Client code fix: Updates lib/client-portal/auto-convert-lead.ts logic only

**Success Criteria:**
- [ ] All 3 legal pages accessible with compliant content reviewed by counsel
- [ ] HMRC VAT validation working in sandbox environment with success/failure indicators
- [ ] Invoice detail page displays full invoice data with line items and payment history
- [ ] Client code generation produces unique deterministic codes without collisions
- [ ] Zero regressions in existing client/invoice/onboarding functionality
- [ ] Production deployment unblocked

---

## Stories

### Story 1: Legal Pages Implementation (FR1)
**Effort:** 2-3 days

Create GDPR-compliant legal pages (Privacy Policy, Terms of Service, Cookie Policy) with admin content management, footer links, and signup flow integration to meet regulatory compliance requirements.

**Acceptance Criteria:**
- Privacy Policy page at /privacy with complete GDPR-compliant content
- Terms of Service page at /terms with service agreement details
- Cookie Policy page at /cookie-policy with cookie usage disclosure
- Footer component updated with links to all legal pages
- Signup flow includes legal acceptance checkboxes
- Admin Legal Settings UI at app/admin/settings/legal/page.tsx for content management
- Legal content stored in database (legalPages table: page_type, content, updated_at)
- Legal page versioning (track content changes over time)

**Technical Notes:**
- Use (legal) route group for legal pages: app/(legal)/privacy/page.tsx, etc.
- Store content in WYSIWYG-friendly format (rich text or markdown)
- Follow GlobalHeader/GlobalSidebar patterns for consistency
- Use glass-card styling for content containers

---

### Story 2: HMRC VAT Validation Integration (FR2)
**Effort:** 2-3 days

Integrate HMRC API for real-time VAT number validation during client onboarding and editing, following the Companies House integration pattern to eliminate manual verification and ensure data accuracy.

**Acceptance Criteria:**
- OAuth 2.0 flow implemented for HMRC authentication (follow Companies House pattern)
- VAT validation endpoint added to clients tRPC router (clients.validateVAT mutation)
- VAT validation integrated in client onboarding wizard (ClientWizard component)
- VAT validation integrated in client edit forms
- Validation result displays success/failure with visual indicators (checkmark/X icon)
- Validation status stored in clients.vatValidationStatus field
- Sandbox and production credential support via environment variables
- Error handling for API failures with user-friendly messages
- Rate limiting handled gracefully (HMRC API limits)

**Technical Notes:**
- Reference: clients.ts:490-607 (Companies House integration pattern)
- Use environment variables: HMRC_CLIENT_ID, HMRC_CLIENT_SECRET, HMRC_SANDBOX_MODE
- Store sandbox credentials from .archive/practice-hub/.env
- Create lib/integrations/hmrc.ts service (similar to companiesHouse.ts)
- Add hmrcService field to clients tRPC router

---

### Story 3: Invoice Detail Page & Client Code Fix (FR3 + FR4)
**Effort:** 1-2 days

Create invoice detail page route connecting to existing backend endpoint, and fix client code generation bug to use deterministic codes instead of random suffixes.

**Acceptance Criteria (Invoice Detail):**
- Invoice detail route created at app/client-hub/invoices/[id]/page.tsx
- Full invoice details displayed (client, dates, status, totals)
- Line items table with descriptions, quantities, rates, amounts
- Payment history section with dates and amounts
- PDF export button (wire to existing PDF generation)
- Edit button visible for draft invoices only
- Status change action buttons (mark as sent, paid, etc.)
- Wire to existing invoices.getById() tRPC endpoint (line 97-122)
- Navigation from invoice list to detail page working

**Acceptance Criteria (Client Code Fix):**
- Remove Math.random() from lib/client-portal/auto-convert-lead.ts:281-282
- Implement sequential suffix logic (query max clientCode, increment)
- Add uniqueness check before assignment
- Add unique constraint to clients.clientCode in schema
- Handle collision scenarios with retry logic (if race condition occurs)
- Update seed data with unique client codes
- Test with concurrent client creation (no duplicates)

**Technical Notes:**
- Invoice detail: Use InvoiceDetailCard component, follow task detail pattern
- Client code: Use database transaction to ensure uniqueness
- Add index on clients.clientCode for uniqueness constraint

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: validateVAT, legal pages queries)
- [x] Database schema changes are backward compatible (add fields: vatValidationStatus, clientCode unique constraint, legalPages table)
- [x] UI changes follow existing patterns (GlobalHeader/Sidebar, glass-card, shadcn/ui)
- [x] Performance impact is minimal (HMRC API calls async, no blocking)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId)

**Schema Changes Required:**
```typescript
// Add to clients table
vatValidationStatus: text("vat_validation_status"), // "valid" | "invalid" | "pending" | null
vatValidatedAt: timestamp("vat_validated_at"),

// Add unique constraint
// CREATE UNIQUE INDEX clients_tenant_code_unique ON clients(tenant_id, client_code);

// Create legalPages table
export const legalPages = pgTable("legal_pages", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  pageType: text("page_type").notNull(), // "privacy" | "terms" | "cookie_policy"
  content: text("content").notNull(),
  version: integer("version").default(1).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by").references(() => users.id),
});
```

---

## Risk Mitigation

**Primary Risks:**

1. **HMRC API Production Credentials Delay**
   - **Risk:** Sandbox credentials exist, production credentials pending approval
   - **Mitigation:** Implement with environment-based configuration; test with sandbox; swap credentials when available
   - **Impact:** Production VAT validation delayed but not blocking development
   - **Likelihood:** Medium | **Severity:** Low

2. **Legal Content Review Delay**
   - **Risk:** Legal pages require counsel review before production
   - **Mitigation:** Use placeholder compliant templates; schedule counsel review in parallel; deploy to staging for review
   - **Impact:** Production deployment delayed until legal approval
   - **Likelihood:** Medium | **Severity:** Medium

3. **Client Code Race Conditions**
   - **Risk:** Concurrent client creation could generate duplicate codes
   - **Mitigation:** Use database transactions with unique constraint; retry logic on collision
   - **Impact:** Client creation fails gracefully with retry
   - **Likelihood:** Low | **Severity:** Low

**Rollback Plan:**
- Legal pages: Remove routes, revert footer changes (isolated feature)
- HMRC integration: Remove validateVAT mutation, revert UI changes (validation optional)
- Invoice detail: Remove route (list view still works)
- Client code fix: Revert to random suffix if deterministic logic fails (not recommended)

---

## Definition of Done

- [x] All 3 stories completed with acceptance criteria met
- [x] Legal pages accessible and content compliant (placeholder until counsel review)
- [x] HMRC VAT validation working in sandbox environment
- [x] Invoice detail page displays full invoice data correctly
- [x] Client code generation produces unique deterministic codes
- [x] Unit tests written for new tRPC mutations (validateVAT, legal page queries)
- [x] Integration tests for HMRC API integration (mock sandbox responses)
- [x] E2E tests for invoice detail navigation and client onboarding with VAT validation
- [x] Multi-tenant isolation tests (validate tenantId filtering in all queries)
- [x] Seed data updated with legalPages, unique client codes
- [x] Documentation updated: README environment variables (HMRC credentials)
- [x] Code reviewed with focus on security (API credentials, SQL injection via Drizzle)
- [x] Performance benchmarks met (<3s page loads, <500ms API responses)
- [x] No regressions in existing client/invoice/onboarding functionality
- [x] Feature deployed to staging and tested by QA
- [x] Production deployment unblocked (GDPR compliance achieved)

---

## Dependencies

**Upstream Dependencies:**
- None (this is the critical path)

**Downstream Dependencies:**
- Epic 2 (High-Impact Workflows) depends on production readiness
- All future epics benefit from HMRC integration pattern

**External Dependencies:**
- HMRC API sandbox credentials (available)
- HMRC API production credentials (pending - not blocking)
- Legal counsel review (schedule in parallel)

---

## Success Metrics

**Quantitative:**
- 100% legal page accessibility (3/3 pages live)
- VAT validation success rate >95% (sandbox testing)
- Invoice detail page load time <2 seconds
- Client code collision rate = 0% (with concurrent testing)

**Qualitative:**
- Legal pages meet GDPR compliance requirements
- VAT validation UX provides clear success/failure feedback
- Invoice detail page matches archived CRM functionality
- Client code generation is predictable and debuggable

---

## Notes

- HMRC sandbox credentials available in `.archive/practice-hub/.env`
- Companies House integration pattern at clients.ts:490-607 is reference implementation
- Invoice detail backend already exists (invoices.ts:97-122) - just wire UI
- Client code bug confirmed at auto-convert-lead.ts:281-282 (Math.random())
- This epic is the **production blocker** - all other epics can proceed in parallel once this completes

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 1)
