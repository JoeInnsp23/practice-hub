# Epic: Client-Hub Production Readiness - Testing & Integration Completion

**Created:** 2025-10-21
**Status:** Planning
**Type:** Brownfield Enhancement
**Priority:** HIGH

---

## Epic Goal

Ensure the client-hub module is production-ready by updating documentation to reflect actual state, adding integration-level router tests, implementing Companies House lookup, and adding E2E coverage for critical workflows.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- **11 UI Pages:** Dashboard, Clients (list/detail), Tasks (list/detail), Time tracking, Invoices, Documents, Services, Compliance, Reports, Settings, Workflows
- **8+ tRPC Routers:** clients, tasks, invoices, documents, services, compliance, timesheets, workflows
- **Technology Stack:** Next.js 15 (App Router), tRPC, Vitest, Better Auth, PostgreSQL + Drizzle ORM
- **Multi-Tenancy:** Dual isolation implemented (tenantId + clientId for client portal)
- **31 Router Test Files:** Comprehensive test infrastructure exists
- **Tenant Isolation Tests:** Integration tests exist and pass

**Integration Points:**
- Better Auth session + authContext (tenant scoping)
- Activity logging for audit trail
- Client onboarding validation
- Multi-table transactions (client + contacts + activity logs)
- Xero integration (fully implemented)

### Enhancement Details

**What's Being Added/Changed:**

Based on comprehensive code audit (not documentation), we discovered:

✅ **What's Already Working (Docs Were Wrong):**
- Client portal auth tables HAVE dual isolation (tenantId + clientId)
- 31 router test files exist with infrastructure
- Tenant isolation tests exist and pass
- Xero integration is fully implemented
- Only 2 legitimate console.error statements (not 115)

⚠️ **Actual Gaps Found:**
1. **Documentation Drift:** Technical debt doc claims features are missing that actually exist
2. **Test Quality:** Router tests only validate Zod schemas, don't execute procedures or test database operations
3. **Companies House Integration:** Documented as available but completely unimplemented
4. **E2E Testing:** No Playwright tests for user workflows

**How It Integrates:**
- Documentation validation script prevents future drift
- Integration tests verify multi-tenant isolation and business logic
- Companies House API integrates with client wizard for UK company lookups
- E2E tests validate complete user workflows

**Success Criteria:**
- All documentation matches actual codebase (zero discrepancies)
- Router tests execute actual procedures and verify database state
- Companies House integration works for UK company lookups
- E2E tests cover 5 critical client-hub workflows
- 80%+ code coverage for client-hub routers
- All tests passing with zero regressions

---

## Stories

### Story 1: Update Documentation to Match Actual Implementation

**Priority:** ⚠️ HIGH (Do This FIRST - Establishes Accurate Baseline)

**Description:**
Audit and update all documentation to reflect the actual codebase implementation, removing outdated information and filling gaps.

**Documentation Files to Review/Update:**

**1. Technical Debt Document (`docs/development/technical-debt.md`)**
- ❌ Remove: Claims about missing client portal auth schema (already has dual isolation)
- ❌ Remove: Claims about 115 console statements (only 2 legitimate ones exist)
- ❌ Remove: Claims that Xero is "not implemented" (it's fully implemented)
- ✅ Update: Change status of router tests from "don't exist" to "exist but only validate inputs"
- ✅ Add: Actual gap - Companies House integration documented but not implemented
- ✅ Add: Actual gap - Router tests need upgrade to integration level

**2. Integration Documentation (`docs/reference/integrations.md`)**
- ✅ Verify: Xero integration section matches actual implementation
- ❌ Remove: Companies House section (move to "Planned Integrations" until implemented)
- ✅ Update: Add actual implementation status for each integration
- ✅ Add: Testing status for each integration

**3. Architecture Documentation (`docs/architecture/brownfield-architecture.md`)**
- ✅ Verify: Client portal auth architecture matches actual schema
- ✅ Update: Testing status section with actual test coverage
- ✅ Update: Integration status section with accurate information

**4. Testing Documentation (Create if missing)**
- ✅ Create: `docs/development/testing.md`
  - Document test infrastructure (`__tests__/helpers/trpc.ts`)
  - Document how to write router tests
  - Document integration test patterns
  - Document E2E testing approach
  - Document test coverage requirements

**5. Schema Documentation (`docs/reference/database/schema.md`)**
- ✅ Verify: Client portal auth tables documented with dual isolation
- ✅ Update: Add schema validation status
- ✅ Update: Add seed data status

**Acceptance Criteria:**

1. **Audit Phase:**
   - [ ] Run gap analysis comparing all docs to actual code
   - [ ] Create list of all inaccuracies found
   - [ ] Create list of undocumented features
   - [ ] Create list of documented-but-not-implemented features

2. **Update Phase:**
   - [ ] Update `docs/development/technical-debt.md` with accurate findings
   - [ ] Update `docs/reference/integrations.md` with correct implementation status
   - [ ] Update `docs/architecture/brownfield-architecture.md` with actual state
   - [ ] Create `docs/development/testing.md` with comprehensive testing guide
   - [ ] Update `docs/reference/database/schema.md` with current schema

3. **Verification Phase:**
   - [ ] Create documentation validation script (checks docs vs code)
   - [ ] Add to CI/CD to prevent docs drift
   - [ ] All documentation reviewed by second developer
   - [ ] Documentation follows DOCUMENTATION_ARCHITECTURE.md standards

4. **Maintenance Phase:**
   - [ ] Add "Last Verified" dates to all updated docs
   - [ ] Add "Next Review" dates (recommend 3 months)
   - [ ] Create doc update checklist for future PRs

**Integration Verification:**
- IV1: Technical debt doc accurately reflects actual codebase state
- IV2: Integration docs match actual implementations
- IV3: No conflicting information between docs
- IV4: All documented features actually exist in code
- IV5: All implemented features are documented

---

### Story 2: Add Integration Tests for Client-Hub Routers

**Priority:** 🚨 CRITICAL (Core Testing Infrastructure)

**Description:**
Upgrade router tests from input validation only to full integration tests that execute procedures and verify database operations.

**Current State:** Tests only validate Zod schemas (`.parse()` calls)
**Target State:** Tests execute procedures and verify data persistence, tenant isolation, and business logic

**Routers to Upgrade:**
- `clients.ts` - Create, update, delete, relationships
- `tasks.ts` - Task CRUD with workflow integration
- `invoices.ts` - Invoice generation and calculations
- `documents.ts` - Document uploads and retrieval
- `services.ts` - Service assignments to clients
- `compliance.ts` - Compliance tracking
- `timesheets.ts` - Time entry tracking
- `workflows.ts` - Workflow instances

**Acceptance Criteria:**
1. Each router test file includes integration tests using `caller.procedure()`
2. Tests verify database state after operations (SELECT after INSERT/UPDATE/DELETE)
3. Tests verify tenant isolation (data scoped to correct tenantId)
4. Tests verify activity logging for write operations
5. Tests verify error handling (NOT_FOUND, validation errors)
6. Tests verify transaction rollbacks on errors
7. Minimum 80% code coverage for all client-hub routers
8. All tests pass: `pnpm test __tests__/routers`

**Integration Verification:**
- IV1: Database operations persist correctly
- IV2: Tenant isolation maintained (no cross-tenant access)
- IV3: Activity logs created with correct metadata
- IV4: Error handling returns appropriate TRPC errors

**Documentation Updates (Substory):**
1. **Update `docs/development/testing.md`:**
   - [ ] Add "Integration Test Patterns" section with examples
   - [ ] Document how to use `createCaller` and `createMockContext`
   - [ ] Document database state verification patterns
   - [ ] Add code examples from upgraded router tests
   - [ ] Document test coverage requirements (80% minimum)

2. **Update `docs/development/technical-debt.md`:**
   - [ ] Mark "Router tests need upgrade" as COMPLETED
   - [ ] Update test coverage metrics
   - [ ] Add "Last Updated" date

3. **Run Documentation Validation:**
   - [ ] Run `scripts/validate-docs.sh`
   - [ ] Fix any doc-code mismatches found

---

### Story 3: Implement Companies House API Integration

**Priority:** ⚠️ HIGH (Missing Feature)

**Description:**
Implement the Companies House API integration to allow automatic lookup of UK company information when creating/editing clients.

**Acceptance Criteria:**
1. Create `lib/companies-house/client.ts` API client
2. Implement `getCompany(number)` - Fetch company details
3. Implement `getOfficers(number)` - Fetch company officers/directors
4. Implement `getPSCs(number)` - Fetch persons with significant control
5. Add `clients.lookupCompaniesHouse(companyNumber)` tRPC procedure
6. Add "Lookup Company" button in client wizard UI
7. Handle rate limits (600 requests/5 min)
8. Handle errors (404 not found, 429 rate limit)
9. Write integration tests for API client
10. All Companies House tests pass

**Integration Verification:**
- IV1: Successfully lookup active UK companies
- IV2: Company data maps correctly to client schema
- IV3: Officers populate clientDirectors table
- IV4: PSCs populate clientPSCs table
- IV5: Rate limiting handles gracefully

**Documentation Updates (Substory):**
1. **Create `docs/guides/integrations/companies-house.md`:**
   - [ ] Setup instructions (API key registration)
   - [ ] Environment variable configuration
   - [ ] API usage examples
   - [ ] Rate limiting information
   - [ ] Error handling guide
   - [ ] Testing instructions
   - [ ] Production deployment checklist

2. **Update `docs/reference/integrations.md`:**
   - [ ] Move Companies House from "Planned" to "Implemented"
   - [ ] Add to integration stack table with status ✅
   - [ ] Add environment variables to summary section
   - [ ] Add link to detailed guide

3. **Update `docs/architecture/brownfield-architecture.md`:**
   - [ ] Add Companies House to "Integrations" section
   - [ ] Document integration with client wizard

4. **Update `docs/development/technical-debt.md`:**
   - [ ] Mark "Companies House not implemented" as COMPLETED

---

### Story 4: E2E Tests for Critical Client-Hub Workflows

**Priority:** 📝 MEDIUM (Quality Assurance)

**Description:**
Create end-to-end tests using Playwright (via webapp-testing skill) for critical user journeys.

**User Flows to Test:**
1. **Client Creation Flow** - Create client → Add contact → Verify in list
2. **Client Detail View** - Navigate to client → View all tabs (info, services, tasks, documents, invoices)
3. **Task Management** - Create task for client → Assign → Mark complete
4. **Document Upload** - Upload document → Verify appears in list → Download
5. **Invoice Generation** - Create invoice → Add line items → Preview PDF

**Acceptance Criteria:**
1. Use `webapp-testing` skill for E2E implementation
2. Tests run against local dev server (`pnpm dev`)
3. Tests work in both light and dark mode
4. Tests verify responsive layouts (desktop/mobile)
5. Tests check data persistence across page refreshes
6. All E2E tests pass
7. No JavaScript console errors during test execution

**Integration Verification:**
- IV1: UI renders correctly in all scenarios
- IV2: Forms submit and save data successfully
- IV3: Navigation works between all pages
- IV4: Data loads correctly from backend

**Documentation Updates (Substory):**
1. **Update `docs/development/testing.md`:**
   - [ ] Add "E2E Testing" section
   - [ ] Document Playwright setup and configuration
   - [ ] Document how to run E2E tests locally
   - [ ] Document test data setup for E2E tests
   - [ ] Add example E2E test patterns

2. **Create `docs/development/e2e-testing-guide.md`:**
   - [ ] Comprehensive E2E testing guide
   - [ ] How to write new E2E tests
   - [ ] Best practices for E2E tests
   - [ ] Common pitfalls and solutions

3. **Update `docs/development/technical-debt.md`:**
   - [ ] Mark "E2E tests missing" as COMPLETED
   - [ ] Add E2E test coverage metrics

---

### Story 5: Xero Integration Testing & Validation

**Priority:** 📝 LOW (Already Implemented, Needs Validation)

**Description:**
The Xero integration is fully implemented but needs comprehensive testing to ensure production readiness.

**Acceptance Criteria:**
1. Write integration tests for `lib/xero/client.ts`
2. Test OAuth flow (authorization, callback, token exchange)
3. Test token refresh mechanism
4. Test transaction data fetching
5. Test error handling (expired tokens, API failures)
6. Manual testing with real Xero sandbox account
7. All Xero tests pass

**Integration Verification:**
- IV1: OAuth flow completes successfully
- IV2: Tokens refresh automatically before expiration
- IV3: Transaction data fetches correctly
- IV4: Error states handle gracefully

**Documentation Updates (Substory):**
1. **Update `docs/guides/integrations/xero.md`:**
   - [ ] Verify all setup instructions are accurate
   - [ ] Add troubleshooting section based on test findings
   - [ ] Add testing section with sandbox setup
   - [ ] Update "Implementation Status" to ✅ COMPLETE & TESTED

2. **Update `docs/reference/integrations.md`:**
   - [ ] Update Xero status to ✅ COMPLETE & TESTED
   - [ ] Add test coverage information

3. **Update `docs/development/technical-debt.md`:**
   - [ ] Remove incorrect "Xero not implemented" claim
   - [ ] Mark "Xero needs testing" as COMPLETED

---

## Compatibility Requirements

- [ ] Existing client-hub APIs remain unchanged
- [ ] Database schema changes are backward compatible (none expected)
- [ ] UI changes follow existing Practice Hub design patterns
- [ ] Performance impact is minimal (no regression in existing features)
- [ ] All existing client-hub functionality continues to work
- [ ] Multi-tenant isolation maintained across all changes
- [ ] Better Auth integration remains intact
- [ ] Activity logging continues for all write operations

---

## Risk Mitigation

**Primary Risks:**

1. **Risk:** Documentation updates reveal more gaps than anticipated
   - **Mitigation:** Story 1 establishes accurate baseline before implementation
   - **Rollback:** Documentation can be reverted via git

2. **Risk:** Integration tests reveal bugs in existing router implementations
   - **Mitigation:** Fix bugs as discovered, track separately from epic scope
   - **Rollback:** Tests can be disabled temporarily while bugs are fixed

3. **Risk:** Companies House API rate limits in production
   - **Mitigation:** Implement caching, queue system for bulk lookups
   - **Rollback:** Feature flag to disable Companies House lookup

4. **Risk:** E2E tests are flaky or slow
   - **Mitigation:** Follow Playwright best practices, use proper wait strategies
   - **Rollback:** E2E tests can run separately from CI/CD if needed

5. **Risk:** Xero testing reveals undiscovered issues
   - **Mitigation:** Test in sandbox first, gradual rollout
   - **Rollback:** Xero integration can be disabled via feature flag

---

## Definition of Done

### Code Completion
- [ ] **Story 1:** All documentation updated to match actual codebase
- [ ] **Story 1:** Documentation validation script created and passing
- [ ] **Story 1:** Doc update process added to PR template
- [ ] **Story 2:** All client-hub router tests upgraded to integration level
- [ ] **Story 2:** Minimum 80% code coverage for client-hub routers
- [ ] **Story 3:** Companies House integration fully implemented and tested
- [ ] **Story 4:** E2E tests cover 5 critical user workflows
- [ ] **Story 5:** Xero integration tested and validated
- [ ] All tests passing: `pnpm test`
- [ ] No regression in existing functionality

### Documentation Completion (All Substories)
- [ ] **Story 2:** Testing documentation updated with integration patterns
- [ ] **Story 3:** Companies House integration fully documented
- [ ] **Story 4:** E2E testing guide created
- [ ] **Story 5:** Xero documentation validated and enhanced
- [ ] All doc "Last Updated" dates current
- [ ] `scripts/validate-docs.sh` passes with zero warnings
- [ ] No conflicting information between any docs
- [ ] All code examples in docs tested and working

### Quality Gates
- [ ] Linter passing: `pnpm lint`
- [ ] Type checks passing: `pnpm typecheck`
- [ ] Database can reset successfully: `pnpm db:reset`
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage meets 80% threshold for client-hub
- [ ] Multi-tenant isolation validated with automated tests
- [ ] Activity logging verified for all write operations

---

## Success Metrics

**Testing Coverage:**
- Router integration tests: 80%+ coverage
- E2E test coverage: 5 critical workflows
- Xero integration tests: Full OAuth flow + transaction fetching

**Documentation Quality:**
- Zero discrepancies between docs and code
- All "Last Updated" dates within last 30 days
- Documentation validation script passes

**Feature Completeness:**
- Companies House integration working for UK companies
- All existing features continue to work with no regression
- Multi-tenant isolation maintained throughout

---

## Notes

**Important Discoveries During Epic Planning:**

1. **Documentation Was Significantly Outdated:**
   - Technical debt doc claimed features missing that were actually implemented
   - Client portal auth schema has had dual isolation all along
   - Xero integration is complete, not missing
   - Only 2 console statements exist, not 115

2. **Actual Gaps vs. Documented Gaps:**
   - Router tests exist but only validate Zod schemas (need upgrade)
   - Companies House documented as available but completely unimplemented
   - E2E testing infrastructure missing

3. **Story 1 is Critical First Step:**
   - Establishes accurate baseline
   - Prevents wasting time on non-issues
   - Creates validation script to prevent future drift

**Recommendation:**
Execute stories in order (1 → 2 → 3 → 4 → 5). Do NOT skip Story 1.
