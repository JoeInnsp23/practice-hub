# Type Centralization & Schema Alignment Epic

**Date Discovered:** 2025-01-25
**Priority:** High
**Complexity:** High
**Estimated Effort:** 8-12 hours
**Discovered During:** Biome lint cleanup - Phase 6 noExplicitAny violations

## Executive Summary

The Practice Hub codebase has significant type safety debt due to scattered inline type definitions, form/schema mismatches, and missing centralized tRPC output types. This epic documents the comprehensive refactor required to establish proper type safety across the application.

## Current State

### Baseline Violations (Before Suppression Removal)
- **TypeScript Errors**: 25+ (tsc fails completely)
- **Biome noExplicitAny**: 11 violations (with suppressions masking 6 more)
- **Total Known Technical Debt**: 36+ type-related issues

### Critical Issues

#### 1. Form/Schema Mismatches (3 major instances)
Forms using simplified interfaces incompatible with database schemas, requiring `as any` casts:

- **Invoice Form** (`components/client-hub/invoices/invoice-form.tsx`)
  - 8 type mismatches
  - Missing required fields: `tenantId`, `clientId`, `status`
  - Type conflicts: `lineItems`, `total` (string vs number)
  - See: `docs/updates/2025-01-invoice-form-schema-mismatch.md`

- **Service Form** (`components/client-hub/services/service-modal.tsx`)
  - 9 type mismatches
  - Missing required fields: `code`, `pricingModel`
  - Type conflicts: `price` (number vs string), `duration` (string vs number)
  - See: `docs/updates/2025-01-service-form-schema-mismatch.md`

- **Onboarding Questionnaire** (`app/client-portal/onboarding/page.tsx`)
  - Dynamic questionnaire structure needs proper typing
  - Current: `sessionData?.questionnaire as any`
  - Impact: Loss of type safety for AI-extracted data

#### 2. Missing Centralized tRPC Types
Only 3 types currently centralized in `lib/trpc/types.ts`:
- `LeaveRequest` ✅
- `WorkingPattern` ✅
- `StaffMemberComparison` ✅

**Missing types** (need to be added using `inferRouterOutputs` pattern):
- Invoice router outputs
- Service router outputs
- Client router outputs
- Onboarding router outputs
- Proposal router outputs
- Task router outputs
- Workflow router outputs
- And 15+ more routers

#### 3. TypeScript Compiler Errors (25+)

**DocuSeal Webhook Issues** (13 errors):
- `app/api/webhooks/docuseal/route.ts`
- Missing required fields in DocusealSubmissionData
- Undefined handling issues for optional fields
- Type mismatches in database inserts

**Messages System Issues** (5 errors):
- `app/practice-hub/messages/page.tsx`
- thread.type incompatibility (string vs enum)
- senderType incompatibility (string vs enum)
- UserData property mismatches

**Settings Pages Issues** (2 errors):
- `app/admin/settings/work-types/page.tsx`
- Empty object types missing required properties

**Capacity Page Issues** (2 errors):
- `app/admin/staff/capacity/page.tsx`
- Empty object types for capacity records and utilization

**Missing Router Import** (3 errors):
- Cannot find module `@/app/server/routers/_app` in:
  - `app/client-hub/documents/documents-client.tsx`
  - `app/practice-hub/calendar/page.tsx`
  - `app/practice-hub/notifications/page.tsx`

**AI Questionnaire Data** (1 error):
- `lib/ai/save-extracted-data.ts`
- Type 'unknown' not assignable to 'QuestionnaireValue'

## Root Causes

1. **Incremental Development Without Type Governance**
   - Forms created before database schemas finalized
   - No enforcement of centralized type definitions
   - `as any` escape hatches used to "unblock" development

2. **Missing tRPC Type Inference Pattern**
   - Best practice pattern (`inferRouterOutputs`) not consistently applied
   - Only 3 out of 25+ routers have centralized types
   - Components defining their own incompatible types

3. **Form Builder vs Database Schema Disconnect**
   - Forms use simplified interfaces for UX reasons
   - No transformation layer between form data and database inserts
   - Type casts masking underlying incompatibilities

4. **External Integration Type Safety Gaps**
   - DocuSeal webhook payloads not properly typed
   - LEM Verify responses not validated
   - Third-party API responses lack proper type guards

## Proposed Solution

### Phase 1: Centralize All tRPC Types (3-4 hours)

Expand `lib/trpc/types.ts` to include ALL router output types:

```typescript
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/app/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Invoices
export type InvoiceListOutput = RouterOutputs["invoices"]["list"];
export type Invoice = InvoiceListOutput["invoices"][number];

// Services
export type ServiceListOutput = RouterOutputs["services"]["list"];
export type Service = ServiceListOutput["services"][number];

// Clients
export type ClientListOutput = RouterOutputs["clients"]["list"];
export type Client = ClientListOutput["clients"][number];

// Onboarding
export type OnboardingQuestionnaireSession = RouterOutputs["onboarding"]["getQuestionnaireSession"];
export type QuestionnaireData = OnboardingQuestionnaireSession["questionnaire"];

// ... (repeat for all 25+ routers)
```

**Files to Update**:
- All components importing/using tRPC data
- Replace inline type definitions with centralized types
- Remove all `as any` casts related to tRPC data

### Phase 2: Fix Form/Schema Mismatches (3-4 hours)

#### Invoice Form Refactor
- Update `InvoiceFormValues` interface to match database schema
- Add missing fields: `tenantId`, `clientId`, `status`
- Fix type conflicts: `total` (string), `lineItems` (proper structure)
- Remove `as any` casts in `app/client-hub/invoices/page.tsx`
- Add form validation for required fields

#### Service Form Refactor
- Update `Service` interface in modal to match database schema
- Add missing fields: `code`, `pricingModel`, `defaultRate`, `basePrice`, `supportsComplexity`
- Fix type conflicts: `price` (string), `duration` (number), `priceType` (proper enum)
- Remove `features` field (not in database)
- Remove `as any` casts in `app/client-hub/services/page.tsx`
- Add form validation for required fields

#### Onboarding Questionnaire Type
- Create proper `QuestionnaireData` type from router output
- Update `OnboardingReview` component to use typed questionnaire
- Remove `as any` cast in `app/client-portal/onboarding/page.tsx`

### Phase 3: Fix TypeScript Compiler Errors (2-3 hours)

#### DocuSeal Webhook Types
- Create proper `DocusealSubmissionData` interface
- Add required fields with proper nullability
- Add type guards for optional field access
- Fix database insert type mismatches

#### Messages System Types
- Define proper enums for `thread.type`, `senderType`
- Create `ThreadData`, `MessageData`, `UserData` interfaces
- Fix filter/map callbacks to use proper types

#### Settings & Capacity Pages
- Define proper return types for tRPC queries
- Replace empty object types with actual data structures

#### Missing Router Imports
- Fix import paths for `@/app/server/routers/_app`
- Ensure AppRouter is properly exported

#### AI Questionnaire Value Type
- Define proper `QuestionnaireValue` union type
- Add type guards for unknown values

### Phase 4: Testing & Validation (1-2 hours)

1. **Type Check**: `pnpm typecheck` must pass with 0 errors
2. **Lint Check**: `pnpm biome check` must pass with 0 violations
3. **Manual Testing**:
   - Create/edit invoice flow
   - Create/edit service flow
   - Complete onboarding questionnaire
   - Submit DocuSeal proposal
   - Send messages in practice hub
4. **E2E Tests**: Add tests for critical form flows

## True Violation Count

**Updated:** 2025-01-25 after removing all Phase 6 suppressions

### Before Suppression Removal
- Biome noExplicitAny: 11 violations (6 hidden by suppressions)
- Biome other lint issues: 63 violations
- TypeScript errors: 25+ violations
- **Total**: 99+ violations

### After Suppression Removal (TRUE BASELINE)
**Biome Lint**: 74 total violations (50 errors + 24 warnings)

**Error Breakdown** (50 total):
- `suspicious/noExplicitAny`: **17 violations** ⬆️ (+6 from suppression removal)
  - Invoice form: 4 violations (page.tsx:201, 204, 392, 393)
  - Service form: 2 violations (page.tsx:422, 423)
  - Onboarding questionnaire: 2 violations (page.tsx:398, pending/page.tsx:128)
  - Other locations: 9 violations
- `suspicious/noArrayIndexKey`: **24 violations** (React key prop using array index)
- `style/noNonNullAssertion`: **7 violations** (unsafe `!` operator usage)
- `correctness/useExhaustiveDependencies`: **1 violation** (missing React hook dependency)
- Other errors: **1 violation**

**Warning Breakdown** (24 total):
- Accessibility (a11y) violations: **24 warnings**
  - `useSemanticElements`, `noStaticElementInteractions`, `noLabelWithoutControl`, etc.

**TypeScript Compiler Errors**: **25+ violations** (tsc fails)
- DocuSeal webhooks: 13 errors
- Messages system: 5 errors
- Settings/capacity pages: 4 errors
- Missing router imports: 3 errors
- AI questionnaire: 1 error

**TOTAL TECHNICAL DEBT**: **99+ violations**
- 74 Biome lint violations
- 25+ TypeScript compiler errors

## Risks & Mitigations

### High-Impact Changes
**Risk**: Touching core data flow could introduce runtime bugs
**Mitigation**:
- Implement changes incrementally (one form at a time)
- Add comprehensive tests before refactoring
- Manual QA required for each changed form
- Feature flag risky changes if possible

### Breaking Changes to Form Interfaces
**Risk**: Components consuming form data may break
**Mitigation**:
- Audit all form consumers before making changes
- Use TypeScript compiler to find all usages
- Update consumers in same commit as form changes

### Data Migration Concerns
**Risk**: Database schema changes might be required
**Mitigation**:
- Schema analysis shows all required fields already exist
- No migrations needed - only type alignment
- Seed data must be updated after schema validation

### Timeline Pressure
**Risk**: 8-12 hour effort could delay other priorities
**Mitigation**:
- Can be broken into smaller stories if needed
- Invoice form can be done separately from service form
- TypeScript errors can be fixed independently

## Success Criteria

- [ ] TypeScript compiler passes with 0 errors (`pnpm typecheck`)
- [ ] Biome lint passes with 0 noExplicitAny violations
- [ ] All 25+ tRPC router outputs have centralized types in `lib/trpc/types.ts`
- [ ] Invoice form uses schema-aligned interface (no `as any`)
- [ ] Service form uses schema-aligned interface (no `as any`)
- [ ] Onboarding questionnaire properly typed
- [ ] DocuSeal webhook handlers properly typed
- [ ] Messages system uses enum types for thread/sender
- [ ] Settings & capacity pages use proper return types
- [ ] No `as any` casts anywhere in codebase (except legitimate external lib issues)
- [ ] All existing functionality works (manual QA passed)
- [ ] E2E tests pass for invoice/service/onboarding flows

## Acceptance Criteria Checklist

### Phase 1: Type Centralization
- [ ] `lib/trpc/types.ts` contains types for all 25+ routers
- [ ] All components import types from centralized file
- [ ] No inline type definitions duplicating tRPC outputs

### Phase 2: Form Refactors
- [ ] Invoice form collects all required database fields
- [ ] Service form collects all required database fields (code, pricingModel)
- [ ] Onboarding questionnaire uses typed data structure
- [ ] Form validation prevents submission of incomplete data
- [ ] Create/edit flows work end-to-end for all forms

### Phase 3: TypeScript Fixes
- [ ] DocuSeal webhook handlers have proper type definitions
- [ ] Messages system uses enum types consistently
- [ ] Settings pages query proper data structures
- [ ] AI questionnaire value handling is type-safe
- [ ] Router imports resolve correctly

### Phase 4: Validation
- [ ] `pnpm typecheck` exits with code 0
- [ ] `pnpm biome check` exits with code 0
- [ ] Manual QA passed for all changed forms
- [ ] E2E tests added/updated for critical flows
- [ ] Documentation updated (README, ADRs if needed)

## Related Documentation

- `docs/updates/2025-01-invoice-form-schema-mismatch.md` - Invoice form refactor details
- `docs/updates/2025-01-service-form-schema-mismatch.md` - Service form refactor details
- `docs/architecture/api-design.md` - tRPC patterns and conventions
- `lib/trpc/types.ts` - Current centralized type definitions

## Story Creation Template

### Epic Story
```markdown
**Title:** Type Centralization & Schema Alignment Epic

**As a** developer
**I want** comprehensive type safety across the entire application
**So that** we catch bugs at compile time and improve code maintainability

**Description:**
The codebase has significant type safety debt with 25+ TypeScript errors and 11+ Biome violations. This epic centralizes all tRPC types, fixes form/schema mismatches, and eliminates all `as any` escape hatches.

**Technical Details:** See `docs/technical-debt/2025-01-type-centralization-epic.md`

**Estimated Effort:** 8-12 hours
**Priority:** High
**Risk:** Medium-High (touches core data flow)
```

### Sub-Stories

#### Story 1: Centralize tRPC Types
```markdown
**Title:** Centralize All tRPC Router Output Types

**Effort:** 3-4 hours
**Priority:** High
**Dependencies:** None

**Tasks:**
1. Expand `lib/trpc/types.ts` with all 25+ router output types
2. Update components to import centralized types
3. Remove inline type definitions duplicating tRPC outputs
4. Verify TypeScript compilation
```

#### Story 2: Invoice Form Refactor
```markdown
**Title:** Fix Invoice Form Schema Mismatch

**Effort:** 1.5-2 hours
**Priority:** High
**Dependencies:** Story 1 (centralized Invoice type)

**Tasks:**
1. Update InvoiceFormValues interface
2. Add missing required fields
3. Fix type conflicts (total, lineItems)
4. Remove `as any` casts
5. Add form validation
6. Test create/edit flows
```

#### Story 3: Service Form Refactor
```markdown
**Title:** Fix Service Form Schema Mismatch

**Effort:** 1.5-2 hours
**Priority:** High
**Dependencies:** Story 1 (centralized Service type)

**Tasks:**
1. Update Service interface in modal
2. Add missing required fields (code, pricingModel)
3. Fix type conflicts (price, duration)
4. Remove features field
5. Remove `as any` casts
6. Add form validation
7. Test create/edit flows
```

#### Story 4: Fix TypeScript Compiler Errors
```markdown
**Title:** Resolve 25+ TypeScript Compiler Errors

**Effort:** 2-3 hours
**Priority:** High
**Dependencies:** Story 1 (centralized types available)

**Tasks:**
1. Fix DocuSeal webhook type definitions (13 errors)
2. Fix messages system enum types (5 errors)
3. Fix settings/capacity page types (4 errors)
4. Fix router import paths (3 errors)
5. Fix AI questionnaire value type (1 error)
6. Verify `pnpm typecheck` passes
```

## Recommendations

1. **Execute in Order**: Stories must be completed sequentially (centralize types first)
2. **Manual QA Required**: Each form refactor needs thorough testing before merging
3. **Separate Feature Branch**: Create `epic/type-centralization` branch for all work
4. **Incremental Commits**: Commit after each story to enable rollback if needed
5. **Update Seed Data**: After schema validation, ensure seed scripts are updated
6. **Consider Pair Programming**: Complex form refactors benefit from code review during implementation

## Next Steps

1. **Review & Approve Epic**: Team lead reviews scope and approach
2. **Create Sub-Stories**: Break epic into individual stories in project tracker
3. **Assign & Schedule**: Allocate 8-12 hour block for focused work
4. **Create Feature Branch**: `git checkout -b epic/type-centralization`
5. **Execute Phase 1**: Centralize all tRPC types first
6. **Incremental Delivery**: Complete and merge sub-stories one at a time

---

**Last Updated:** 2025-01-25
**Status:** Documented - Awaiting Approval
**Owner:** [To be assigned]
