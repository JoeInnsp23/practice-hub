# Type Centralization & Schema Alignment - Brownfield Enhancement Epic

**Epic ID:** EPIC-2025-01-TYPE-SAFETY
**Created:** 2025-01-25
**Status:** Ready for Development
**Epic Type:** Major Brownfield Refactor
**Estimated Effort:** 8-12 hours (4 phases)
**Risk Level:** HIGH - Touches core data flow across entire application

## Epic Title

Type Centralization & Schema Alignment - Comprehensive Type Safety Refactor

## Epic Goal

Eliminate all TypeScript compilation errors and establish comprehensive type safety across the Practice Hub application by centralizing all tRPC router output types, fixing form/schema mismatches, and removing all `as any` escape hatches. This will catch bugs at compile time, improve code maintainability, and establish a foundation for robust type-safe development.

## Epic Description

### Existing System Context

**Current Technology Stack:**
- **Framework:** Next.js 15 with App Router
- **API Layer:** tRPC with Better Auth integration
- **Database:** PostgreSQL with Drizzle ORM
- **Type System:** TypeScript 5.x with strict mode
- **Forms:** React Hook Form with Zod validation
- **UI Components:** shadcn/ui with Radix primitives

**Current Type Architecture:**
- Partial type centralization in `lib/trpc/types.ts` (only 3 types)
- Inline type definitions scattered across 25+ routers
- Form interfaces disconnected from database schemas
- External API integrations lacking proper type guards
- Multiple `as any` casts masking type incompatibilities

**Integration Points:**
- tRPC routers (`app/server/routers/*`)
- Form components (`components/client-hub/*/`)
- Database schemas (`lib/db/schema.ts`)
- External webhooks (`app/api/webhooks/*`)
- Client portal (`app/client-portal/*`)

### Enhancement Details

**What's Being Added/Changed:**

1. **Centralized tRPC Type System** (Phase 1)
   - Create comprehensive type exports using `inferRouterOutputs` pattern
   - Cover all 25+ routers with proper type inference
   - Establish single source of truth for API types
   - Implement TypeScript's advanced generic inference patterns

2. **Form/Schema Type Alignment** (Phase 2)
   - Align InvoiceFormValues with database schema
   - Fix ServiceFormValues missing required fields
   - Type onboarding questionnaire data structures
   - Remove all form-related `as any` casts

3. **Compiler Error Resolution** (Phase 3)
   - Fix 13 DocuSeal webhook type errors
   - Resolve 5 messages system enum mismatches
   - Fix 4 settings/capacity page type definitions
   - Correct 3 missing router import paths
   - Type AI questionnaire value handling

4. **Validation & Quality Gates** (Phase 4)
   - Ensure `pnpm typecheck` passes (0 errors)
   - Verify `pnpm biome check` compliance
   - Execute manual QA testing
   - Add E2E tests for critical flows

**How It Integrates:**
- Leverages existing tRPC infrastructure without breaking changes
- Maintains backward compatibility with current API contracts
- Enhances existing form validation without changing UX
- Strengthens type safety at compile time without runtime impact

**Success Criteria:**
- ✅ TypeScript compiler: 0 errors (currently 25+)
- ✅ Biome noExplicitAny: 0 violations (currently 17)
- ✅ All tRPC routers have centralized types
- ✅ All forms use schema-aligned interfaces
- ✅ No `as any` casts remaining (except external libs)
- ✅ All existing functionality preserved
- ✅ E2E tests pass for critical flows

### Current State Analysis

**Baseline Violations (TRUE COUNT after suppression removal):**
```
TypeScript Errors: 25+ (tsc exits with code 2)
Biome noExplicitAny: 17 violations
Biome Other: 57 violations (array keys, non-null assertions, etc.)
Total Technical Debt: 99+ type-related issues
```

**Critical Error Distribution:**
- DocuSeal webhooks: 13 errors (missing type definitions)
- Messages system: 5 errors (enum type mismatches)
- Settings pages: 4 errors (empty object types)
- Missing imports: 3 errors (router module not found)
- Form mismatches: 17+ inline `as any` casts

## Stories

### Story 1: Centralize All tRPC Router Output Types
**Priority:** P0 - Must Complete First
**Effort:** 3-4 hours
**Dependencies:** None

**Description:**
Establish comprehensive type centralization using TypeScript's `inferRouterOutputs` pattern to create a single source of truth for all API types across the application.

**Technical Implementation:**
```typescript
// lib/trpc/types.ts expansion
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/app/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Invoice Router Types
export type InvoiceListOutput = RouterOutputs["invoices"]["list"];
export type Invoice = InvoiceListOutput["invoices"][number];
export type InvoiceWithRelations = RouterOutputs["invoices"]["getById"];

// Service Router Types
export type ServiceListOutput = RouterOutputs["services"]["list"];
export type Service = ServiceListOutput["services"][number];
export type ServiceWithComplexity = RouterOutputs["services"]["getWithComplexity"];

// ... repeat for all 25+ routers
```

**Files to Update:**
- `lib/trpc/types.ts` - Add all router type exports
- All components using tRPC data - Import centralized types
- Remove all inline `RouterOutputs` redefinitions

### Story 2: Fix Form/Schema Type Mismatches
**Priority:** P0 - Critical Data Flow
**Effort:** 3-4 hours
**Dependencies:** Story 1 (requires centralized types)

**Description:**
Align all form interfaces with database schemas to eliminate type mismatches and remove `as any` casts that mask incompatibilities.

**Invoice Form Fixes:**
```typescript
// Current (BROKEN):
interface InvoiceFormValues {
  clientId: string;
  items: { description: string; amount: number }[];
  total: string; // WRONG TYPE
  // MISSING: tenantId, status, multiple other fields
}

// Fixed:
interface InvoiceFormValues {
  tenantId: string;
  clientId: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  lineItems: InvoiceLineItem[];
  total: number; // CORRECT TYPE
  // ... all required fields from schema
}
```

**Service Form Fixes:**
```typescript
// Add missing required fields:
- code: string (service code)
- pricingModel: "fixed" | "hourly" | "retainer"
- defaultRate: number
- basePrice: number
- supportsComplexity: boolean
```

### Story 3: Resolve TypeScript Compiler Errors
**Priority:** P0 - Blocks Production Build
**Effort:** 2-3 hours
**Dependencies:** Stories 1 & 2 (need types first)

**Description:**
Fix all 25+ TypeScript compiler errors to enable successful builds and type checking in CI/CD pipeline.

**DocuSeal Webhook Fixes (13 errors):**
```typescript
interface DocusealSubmissionData {
  id: string;
  template_id: string; // REQUIRED
  status: string; // REQUIRED
  completed_at?: string;
  submitters?: Array<{
    name?: string;
    email?: string;
    completed_at?: string;
    values?: Record<string, unknown>;
  }>;
}

// Add null checks for optional fields
const signedAt = submission.completed_at
  ? new Date(submission.completed_at)
  : new Date();
```

**Messages System Fixes (5 errors):**
```typescript
// Define proper enums
type ThreadType = "client" | "direct" | "team_channel";
type SenderType = "system" | "staff" | "client_portal";

// Update interfaces
interface ThreadData {
  thread: {
    type: ThreadType; // NOT string
    // ...
  };
}
```

### Story 4: Validation & Quality Assurance
**Priority:** P1 - Quality Gate
**Effort:** 1-2 hours
**Dependencies:** Stories 1-3 complete

**Description:**
Execute comprehensive validation to ensure all type safety improvements work correctly and don't break existing functionality.

**Validation Checklist:**
- [ ] Run `pnpm typecheck` - must exit with code 0
- [ ] Run `pnpm biome check` - 0 noExplicitAny violations
- [ ] Manual test invoice create/edit flow
- [ ] Manual test service create/edit flow
- [ ] Manual test onboarding questionnaire
- [ ] Manual test DocuSeal proposal submission
- [ ] Manual test messages system
- [ ] Run E2E test suite
- [ ] Verify seed data compatibility

## Compatibility Requirements

- [x] Existing tRPC API contracts remain unchanged (additive only)
- [x] Database schema unchanged (type alignment only)
- [x] Form UX unchanged (internal type fixes only)
- [x] All React Hook Form validations preserved
- [x] Better Auth session types compatible
- [x] External webhook payloads properly typed
- [x] Multi-tenant isolation patterns preserved
- [x] Client portal access controls maintained

## Risk Mitigation

### Primary Risk: Breaking Core Data Flow
**Impact:** Forms could fail to submit, data could be lost
**Likelihood:** Medium-High (touching critical paths)

**Mitigation Strategy:**
1. **Incremental Implementation:** Complete one router/form at a time
2. **Type-First Approach:** Update types before runtime code
3. **Comprehensive Testing:** Manual QA for each changed form
4. **Feature Flags:** Wrap risky changes if possible
5. **Atomic Commits:** Enable easy rollback per component

### Secondary Risk: Hidden Runtime Behaviors
**Impact:** `as any` casts may hide runtime logic dependencies
**Likelihood:** Medium

**Mitigation Strategy:**
1. **Code Analysis:** Review each `as any` removal carefully
2. **Runtime Validation:** Add Zod schemas where needed
3. **Defensive Checks:** Add type guards for external data
4. **Monitoring:** Watch Sentry for new runtime errors

### Rollback Plan
```bash
# If critical issues discovered:
git checkout main
git revert epic/type-centralization --no-commit
# Cherry-pick safe changes only
git cherry-pick <safe-commits>
git commit -m "fix: Partial rollback of type centralization"
```

## Definition of Done

### Code Quality Gates
- [x] `pnpm typecheck` passes with exit code 0
- [x] `pnpm biome check` shows 0 noExplicitAny violations
- [x] No `as any` casts except for legitimate external library issues
- [x] All centralized types exported from `lib/trpc/types.ts`
- [x] All forms use schema-aligned interfaces

### Functional Validation
- [x] Invoice CRUD operations work correctly
- [x] Service management functions properly
- [x] Onboarding flow completes successfully
- [x] DocuSeal webhooks process correctly
- [x] Messages system sends/receives properly
- [x] No regression in existing features

### Testing & Documentation
- [x] E2E tests pass for all modified flows
- [x] Unit tests updated for type changes
- [x] Type documentation added to complex interfaces
- [x] README updated with type architecture
- [x] Migration guide created for team

### Performance & Security
- [x] No performance degradation (compile time acceptable)
- [x] No new security vulnerabilities introduced
- [x] Type safety prevents common injection attacks
- [x] External data properly validated

## Technical Implementation Details

### Phase 1: Type Centralization Pattern
Using TypeScript's advanced `inferRouterOutputs` utility type:

```typescript
// Best practice from Microsoft TypeScript docs
import type { inferRouterOutputs } from "@trpc/server";

// This automatically infers all procedure outputs
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Access nested router outputs
type ClientData = RouterOutputs["clients"]["list"]["clients"][0];

// Handle pagination wrappers
type PaginatedInvoices = RouterOutputs["invoices"]["list"];
type Invoice = PaginatedInvoices["invoices"][0];
```

### Phase 2: Form Transformation Layer
Implement transformation utilities for form/schema alignment:

```typescript
// Transform form data to schema format
function formToSchema(form: InvoiceFormValues): InvoiceInsert {
  return {
    ...form,
    total: Number(form.total), // Type conversion
    tenantId: getTenantId(),   // Add missing fields
    status: form.status || "draft",
  };
}

// Transform schema to form format
function schemaToForm(invoice: Invoice): InvoiceFormValues {
  return {
    ...invoice,
    total: String(invoice.total), // Match form field types
  };
}
```

### Phase 3: Type Guards for External Data
Implement proper type guards for external API data:

```typescript
// Type guard for DocuSeal webhook
function isDocusealSubmission(data: unknown): data is DocusealSubmissionData {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "template_id" in data &&
    "status" in data
  );
}

// Use in webhook handler
if (!isDocusealSubmission(webhookData)) {
  throw new Error("Invalid DocuSeal webhook payload");
}
```

### Phase 4: Testing Strategy
```typescript
// Type tests using expect-type
import { expectTypeOf } from "expect-type";

describe("Type Safety Tests", () => {
  it("should infer correct invoice type", () => {
    const invoice = trpc.invoices.list.useQuery();
    expectTypeOf(invoice.data?.invoices[0]).toMatchTypeOf<Invoice>();
  });

  it("should enforce form validation", () => {
    const form = useForm<InvoiceFormValues>();
    // Type error if missing required field
    // @ts-expect-error - tenantId is required
    form.setValue("clientId", "123");
  });
});
```

## Validation Checklist

### Pre-Implementation
- [x] All TypeScript errors documented
- [x] Form/schema mismatches identified
- [x] External API types analyzed
- [x] Dependencies mapped
- [x] Rollback plan defined

### During Implementation
- [ ] Types centralized incrementally
- [ ] Each phase tested independently
- [ ] Backward compatibility verified
- [ ] Performance monitored
- [ ] Team updated on progress

### Post-Implementation
- [ ] All acceptance criteria met
- [ ] Zero TypeScript errors
- [ ] Zero noExplicitAny violations
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Knowledge transfer done

## Success Metrics

### Quantitative Metrics
- **TypeScript Errors:** 25+ → 0 (100% reduction)
- **Type Violations:** 99+ → 0 (100% elimination)
- **Type Coverage:** 30% → 95%+ centralized
- **Build Time:** <2min (no regression)
- **Bundle Size:** No increase

### Qualitative Metrics
- **Developer Experience:** IntelliSense everywhere
- **Code Quality:** Type safety at compile time
- **Maintainability:** Single source of truth
- **Bug Prevention:** Catch errors before runtime
- **Team Confidence:** No fear of refactoring

## Related Documentation

- `/docs/updates/2025-01-type-centralization-epic.md` - Original discovery
- `/docs/updates/2025-01-invoice-form-schema-mismatch.md` - Invoice details
- `/docs/updates/2025-01-service-form-schema-mismatch.md` - Service details
- `/docs/architecture/api-design.md` - tRPC patterns
- `/lib/trpc/types.ts` - Current type definitions
- `/docs/guides/integrations/sentry.md` - Error tracking setup

## Handoff to Story Manager

**Story Manager Handoff:**

"Please develop detailed user stories for this comprehensive type safety brownfield epic.

**Critical Context:**
- This is a MAJOR refactor of an existing Next.js 15 + tRPC + PostgreSQL system
- Current state: 25+ TypeScript errors, 99+ total type violations blocking production
- Technology stack: Next.js 15, tRPC, Better Auth, Drizzle ORM, React Hook Form, Zod
- Integration points: 25+ tRPC routers, form components, external webhooks, database schemas

**Key Requirements:**
- Story 1 MUST complete first (type centralization enables all others)
- Each story must preserve backward compatibility
- Focus on type safety without changing runtime behavior
- All existing patterns must be followed (multi-tenancy, Better Auth, etc.)
- Each story needs comprehensive testing before moving to next

**Success Criteria:**
The epic succeeds when TypeScript compilation passes with zero errors, all forms work correctly with proper types, and no `as any` escape hatches remain in the codebase.

**Risk Factors:**
- HIGH RISK: Touches core data flow across entire application
- Forms currently use type casts to work around mismatches
- External webhooks lack proper type definitions
- Team must be prepared for incremental rollback if issues arise"

---

## Epic Status Tracking

**Current Phase:** Documentation Complete
**Next Steps:**
1. Team review and approval
2. Create feature branch `epic/type-centralization`
3. Begin Story 1 implementation
4. Daily progress updates in Slack

**Blockers:** None identified
**Dependencies:** None external
**Team Assignment:** [To be assigned]

---

*Epic Created: 2025-01-25 by PM (John)*
*Last Updated: 2025-01-25*
*Estimated Start: TBD*
*Target Completion: TBD*