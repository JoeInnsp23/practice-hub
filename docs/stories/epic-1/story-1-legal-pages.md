# User Story: Legal Pages Implementation

**Story ID:** STORY-1.1
**Epic:** Epic 1 - Critical Path & Production Readiness
**Feature:** FR1 - Legal Pages Implementation
**Priority:** Critical
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** Practice Hub administrator
**I want** GDPR-compliant legal pages (Privacy Policy, Terms of Service, Cookie Policy) with admin content management
**So that** we meet regulatory compliance requirements and can deploy to production legally

---

## Business Value

- **Compliance:** Unblocks production deployment by meeting GDPR legal requirements
- **Legal Protection:** Provides legal protection through clear terms and privacy policies
- **Professional Image:** Demonstrates commitment to data protection and transparency
- **Admin Control:** Enables administrators to update legal content without developer intervention

---

## Acceptance Criteria

### Functional Requirements

**AC1: Privacy Policy Page**
- **Given** a user navigates to `/privacy`
- **When** the page loads
- **Then** a complete GDPR-compliant Privacy Policy is displayed with proper formatting

**AC2: Terms of Service Page**
- **Given** a user navigates to `/terms`
- **When** the page loads
- **Then** complete Terms of Service with service agreement details are displayed

**AC3: Cookie Policy Page**
- **Given** a user navigates to `/cookie-policy`
- **When** the page loads
- **Then** a detailed Cookie Policy explaining cookie usage is displayed

**AC4: Footer Integration**
- **Given** any page in the application
- **When** the user scrolls to the footer
- **Then** links to Privacy Policy, Terms, and Cookie Policy are visible and functional

**AC5: Signup Flow Integration**
- **Given** a user is completing signup
- **When** the signup form is displayed
- **Then** legal acceptance checkboxes are present with links to legal pages
- **And** signup cannot complete without accepting terms

**AC6: Admin Legal Settings UI**
- **Given** an admin user navigates to `/admin/settings/legal`
- **When** the page loads
- **Then** an interface for managing legal page content is displayed
- **And** the admin can edit Privacy Policy, Terms, and Cookie Policy content
- **And** changes are saved with versioning

**AC7: Legal Content Storage**
- **Given** an admin saves legal page content
- **When** the save operation completes
- **Then** content is stored in the `legalPages` table with version tracking
- **And** update timestamp and updatedBy user are recorded

**AC8: Legal Page Versioning**
- **Given** legal content is updated
- **When** the admin views version history
- **Then** all previous versions are displayed with timestamps and authors
- **And** the admin can compare versions

### Integration Requirements

**AC9: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** a user views legal pages
- **Then** they see only their tenant's legal pages
- **And** all queries filter by tenantId

**AC10: Existing Functionality Intact**
- **Given** the legal pages are deployed
- **When** users navigate the application
- **Then** no existing functionality is broken
- **And** all existing routes continue to work

### Quality Requirements

**AC11: Responsive Design**
- **Given** legal pages are viewed on different devices
- **When** the page renders
- **Then** content is readable on mobile, tablet, and desktop
- **And** GlobalHeader/GlobalSidebar patterns are followed

**AC12: Performance**
- **Given** a user loads a legal page
- **When** performance is measured
- **Then** page load time is <2 seconds
- **And** content loads without layout shift

---

## Technical Implementation

### Database Schema Changes

```typescript
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

// Add index for tenant + page type lookups
CREATE INDEX legal_pages_tenant_type_idx ON legal_pages(tenant_id, page_type);
```

### File Structure

```
app/
  (legal)/
    privacy/
      page.tsx          # Privacy Policy page
    terms/
      page.tsx          # Terms of Service page
    cookie-policy/
      page.tsx          # Cookie Policy page
  admin/
    settings/
      legal/
        page.tsx        # Legal Settings admin UI
components/
  legal/
    legal-page-viewer.tsx   # Reusable legal page viewer
    legal-editor.tsx        # Rich text editor for admin
app/server/routers/
  legal.ts            # tRPC router for legal pages
```

### tRPC Procedures

```typescript
// app/server/routers/legal.ts
export const legalRouter = router({
  getByType: protectedProcedure
    .input(z.object({ pageType: z.enum(["privacy", "terms", "cookie_policy"]) }))
    .query(async ({ ctx, input }) => {
      // Get legal page for tenant
    }),

  update: adminProcedure
    .input(z.object({
      pageType: z.enum(["privacy", "terms", "cookie_policy"]),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Update legal page with versioning
    }),

  getVersionHistory: adminProcedure
    .input(z.object({ pageType: z.enum(["privacy", "terms", "cookie_policy"]) }))
    .query(async ({ ctx, input }) => {
      // Get version history
    }),
});
```

### Technical Notes

- **Route Group:** Use `(legal)` route group for legal pages: `app/(legal)/privacy/page.tsx`
- **Content Format:** Store content in markdown or rich text format (WYSIWYG-friendly)
- **Styling:** Follow GlobalHeader/GlobalSidebar patterns, use `glass-card` for content containers
- **Versioning:** Increment version number on each update, maintain history
- **Default Content:** Seed database with placeholder legal content (to be reviewed by counsel)

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] Privacy Policy page accessible at `/privacy` with GDPR-compliant content
- [ ] Terms of Service page accessible at `/terms` with complete service agreement
- [ ] Cookie Policy page accessible at `/cookie-policy` with cookie disclosure
- [ ] Footer links to all legal pages functional
- [ ] Signup flow includes legal acceptance checkboxes
- [ ] Admin Legal Settings UI functional at `/admin/settings/legal`
- [ ] Legal content stored in `legalPages` table with versioning
- [ ] Multi-tenant isolation verified (tenantId filtering tested)
- [ ] Unit tests written for legal tRPC router procedures
- [ ] Integration tests for legal page queries and updates
- [ ] E2E tests for signup flow with legal acceptance
- [ ] Seed data updated with placeholder legal content
- [ ] Code reviewed with focus on multi-tenant isolation
- [ ] Documentation updated: README environment setup
- [ ] Performance benchmarks met (<2s page load)
- [ ] No regressions in existing functionality
- [ ] Feature deployed to staging and tested by QA
- [ ] Legal content ready for counsel review (placeholder deployed)

---

## Dependencies

**Upstream:**
- None (first story in Epic 1)

**Downstream:**
- Production deployment blocked until this story completes

**External:**
- Legal counsel review (schedule in parallel, not blocking development)

---

## Testing Strategy

### Unit Tests
- Test legal page queries filter by tenantId correctly
- Test version increment on update
- Test admin-only update authorization

### Integration Tests
- Test legal page creation and retrieval
- Test version history tracking
- Test multi-tenant isolation (tenant A cannot see tenant B's legal pages)

### E2E Tests
- Test signup flow with legal acceptance required
- Test legal page navigation from footer
- Test admin legal content editing workflow

---

## Risks & Mitigation

**Risk:** Legal content review delay
**Mitigation:** Deploy with placeholder compliant templates; schedule counsel review in parallel; update content post-review
**Impact:** Low - doesn't block development, only production content approval

---

## Notes

- Legal pages are PRODUCTION BLOCKER for GDPR compliance
- Placeholder legal content must be professionally written (use standard templates)
- Legal counsel review must occur before production deployment
- Version history provides audit trail for compliance purposes
- Consider adding "Last Updated" timestamp display on legal pages

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-1 - Critical Path & Production Readiness
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR1)
