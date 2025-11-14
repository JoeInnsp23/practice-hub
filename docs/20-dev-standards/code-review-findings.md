# Code Review: Biome Ignore, TODO, and Placeholder Instances

**Last Updated:** 2025-11-14  
**Review Scope:** Complete codebase scan for biome-ignore comments, TODO markers, and placeholder content

---

## Summary Statistics

- **Total Biome Ignore Comments:** 32
- **Total TODO Comments:** 50+ (excluding test files and documentation)
- **Placeholder Content:** 7 instances (3 legal document placeholders require review)
- **Type Suppressions:** 6 instances

---

## Biome Ignore Comments (32 instances)

### Accessibility (a11y) - 6 instances

These instances use `div` elements with role attributes to avoid nested interactive button structures, which is a valid accessibility pattern.

1. **`components/employee-hub/timesheets/monthly-timesheet.tsx:285`**
   - Reason: Div avoids nested interactive button structure
   - Status: ✅ Justified

2. **`components/employee-hub/timesheets/hourly-timesheet.tsx:341`**
   - Reason: Div container avoids nested button semantics
   - Status: ✅ Justified

3. **`components/employee-hub/timesheets/hourly-timesheet.tsx:380`**
   - Reason: Div avoids nested interactive button structure
   - Status: ✅ Justified

4. **`components/employee-hub/timesheets/hourly-timesheet.tsx:446`**
   - Reason: Div avoids nested interactive button structure
   - Status: ✅ Justified

5. **`app/admin-hub/portal-links/icon-picker.tsx:85`**
   - Reason: Cannot use `<button>` here as it's inside another Button component
   - Status: ✅ Justified

6. **`components/client-hub/tasks/task-board.tsx:131`**
   - Reason: Cannot use `<button>` as it would nest with Button inside TaskCard (DropdownMenu trigger)
   - Status: ✅ Justified

### Security - 3 instances

These instances use `dangerouslySetInnerHTML` for specific, controlled use cases.

7. **`app/admin-hub/settings/email-templates/page.tsx:694`**
   - Reason: Preview needs to render HTML
   - Status: ✅ Justified (email template preview)

8. **`components/proposal-hub/proposal-notes-section.tsx:300`**
   - Reason: Only injecting styled spans for @mentions
   - Status: ✅ Justified (controlled content injection)

9. **`components/client-hub/task-notes-section.tsx:298`**
   - Reason: Only injecting styled spans for @mentions
   - Status: ✅ Justified (controlled content injection)

### Type Safety (suspicious/noExplicitAny) - 12 instances

These instances use `any` types due to complex third-party library types (Drizzle, tRPC, Zod).

10-15. **`scripts/seed.ts`** (6 instances)
   - Lines: 1600, 1614, 4081, 4083, 4147, 4149, 4243
   - Reason: Seed data enum casts and workflow mapping
   - Status: ✅ Justified (seed data only)

16-19. **`lib/api-docs/schema-docs.ts`** (4 instances)
   - Lines: 46, 58, 62, 89
   - Reason: Drizzle column/reference types are complex
   - Status: ✅ Justified (Drizzle type system limitations)

20-27. **`lib/api-docs/generate-docs.ts`** (8 instances)
   - Lines: 47, 61, 93, 105, 140, 159, 171, 220
   - Reason: tRPC/Zod schema types are complex
   - Status: ✅ Justified (tRPC/Zod type system limitations)

28. **`__tests__/routers/users.test.ts:958`**
   - Reason: Testing invalid role value
   - Status: ✅ Justified (test file)

### Style - 2 instances

29. **`scripts/seed.ts:1600`**
   - Reason: seed data - services guaranteed to exist
   - Status: ✅ Justified

30. **`scripts/migrate.ts:42`**
   - Reason: DATABASE_URL required for migrations
   - Status: ✅ Justified

### Correctness - 1 instance

31. **`contexts/client-portal-context.tsx:52`**
   - Reason: setCurrentClientId is stable and defined in parent scope
   - Status: ✅ Justified

### Array Index Key - 1 instance

32. **`components/proposal-hub/charts/lead-sources-chart.tsx:117`**
   - Reason: recharts requires index as key
   - Status: ✅ Justified (library requirement)

---

## TODO Comments (Active Development Items)

### Production Features - 3 instances

1. **`app/server/routers/invoices.ts:533`**
   ```typescript
   // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
   ```
   - Priority: 🔴 High
   - Impact: Email functionality incomplete
   - Recommendation: Implement email service integration before production

2. **`app/server/routers/timesheets.ts:573`**
   ```typescript
   const minimumHours = 37.5; // TODO: Make configurable in settings
   ```
   - Priority: 🟡 Medium
   - Impact: Hard-coded business rule
   - Recommendation: Move to settings configuration

3. **`docs/10-system/architecture-detailed/authentication.md:138`**
   ```typescript
   requireEmailVerification: false, // TODO: Enable in production
   ```
   - Priority: 🔴 High
   - Impact: Security feature disabled
   - Recommendation: Enable before production deployment

### Xero Integration - 4 instances

4. **`lib/xero/webhook-processor.ts:148`**
   ```typescript
   // TODO: Implement invoice sync logic
   ```
   - Priority: 🟡 Medium
   - Impact: Xero invoice webhooks not processed
   - Status: Stub implementation with console.log

5. **`lib/xero/webhook-processor.ts:167`**
   ```typescript
   // TODO: Implement contact sync logic
   ```
   - Priority: 🟡 Medium
   - Impact: Xero contact webhooks not processed
   - Status: Stub implementation with console.log

6. **`lib/xero/webhook-processor.ts:185`**
   ```typescript
   // TODO: Implement payment sync logic
   ```
   - Priority: 🟡 Medium
   - Impact: Xero payment webhooks not processed
   - Status: Stub implementation with console.log

7. **`lib/xero/webhook-processor.ts:205`**
   ```typescript
   // TODO: Implement bank transaction sync logic
   ```
   - Priority: 🟡 Medium
   - Impact: Xero bank transaction webhooks not processed
   - Status: Stub implementation with console.log

### LEM Verify Integration - 2 instances

8. **`lib/kyc/lemverify-client.ts:22-23`**
   ```typescript
   * - TODO: Contact LEM Verify support for complete "Upload a Document" API docs
   * - TODO: Add uploadDocument(), uploadSelfie(), uploadLivenessVideo() methods
   ```
   - Priority: 🟡 Medium
   - Impact: Incomplete KYC integration
   - Recommendation: Contact LEM Verify for API documentation

### Client Hub Reports - 3 instances

9. **`app/client-hub/reports/page.tsx:127`**
   ```typescript
   yoyGrowth: 0, // TODO: Calculate YoY growth
   ```
   - Priority: 🟢 Low
   - Impact: Reports show placeholder values
   - Status: Feature incomplete

10. **`app/client-hub/reports/page.tsx:441`**
    ```typescript
    change: 0, // TODO: Calculate month-over-month change
    ```
    - Priority: 🟢 Low
    - Impact: Reports show placeholder values
    - Status: Feature incomplete

11. **`app/client-hub/reports/page.tsx:442`**
    ```typescript
    services: 0, // TODO: Get service count from client_services
    ```
    - Priority: 🟢 Low
    - Impact: Reports show placeholder values
    - Status: Feature incomplete

### Employee Hub - 1 instance

12. **`app/employee-hub/approvals/leave/page.tsx:91`**
    ```typescript
    // TODO: Conflicts feature not yet implemented in backend
    ```
    - Priority: 🟡 Medium
    - Impact: Leave conflict detection unavailable
    - Status: Backend feature pending

### Test Files - 30+ instances

13-42. **`tests/e2e/regression/client-hub.spec.ts`**
    - 12 instances of `// TODO: Implement test`
    - Priority: 🟢 Low
    - Impact: Missing E2E test coverage
    - Status: Test suite incomplete

43-55. **`tests/e2e/regression/proposal-hub.spec.ts`**
    - 13 instances of `// TODO: Implement test`
    - Priority: 🟢 Low
    - Impact: Missing E2E test coverage
    - Status: Test suite incomplete

56. **`tests/e2e/regression/pipeline.spec.ts:20`**
    ```typescript
    // TODO: Set up Playwright and authentication flow
    ```
    - Priority: 🟢 Low
    - Impact: Missing E2E test infrastructure
    - Status: Test setup incomplete

---

## Placeholder Content

### Legal Documents (Production Risk) - 3 instances ⚠️

**CRITICAL:** These placeholders must be replaced with actual legal documents before production deployment.

1. **`scripts/seed.ts:812`**
   ```typescript
   *This is a placeholder Privacy Policy. It must be reviewed and approved by legal counsel before production deployment.*
   ```
   - Priority: 🔴 **CRITICAL**
   - Impact: Legal compliance risk
   - Action Required: Replace with actual Privacy Policy reviewed by legal counsel

2. **`scripts/seed.ts:891`**
   ```typescript
   *This is a placeholder Terms of Service. It must be reviewed and approved by legal counsel before production deployment.*
   ```
   - Priority: 🔴 **CRITICAL**
   - Impact: Legal compliance risk
   - Action Required: Replace with actual Terms of Service reviewed by legal counsel

3. **`scripts/seed.ts:960`**
   ```typescript
   *This is a placeholder Cookie Policy. It must be reviewed and approved by legal counsel before production deployment.*
   ```
   - Priority: 🔴 **CRITICAL**
   - Impact: Legal compliance risk
   - Action Required: Replace with actual Cookie Policy reviewed by legal counsel

### Template Placeholders (Intentional) - Multiple instances ✅

These are intentional features for template variable replacement, not placeholders requiring replacement.

4. **`lib/db/schema.ts:1064`**
   - Template pattern fields (with placeholder support)
   - Status: ✅ Intentional feature

5. **`components/client-hub/task-template-preview-dialog.tsx`**
   - Placeholder replacement system
   - Status: ✅ Intentional feature

6. **`components/client-hub/task-template-form-dialog.tsx`**
   - SUPPORTED_PLACEHOLDERS system
   - Status: ✅ Intentional feature

7. **`app/admin-hub/settings/email-templates/page.tsx`**
   - Email template variable placeholders
   - Status: ✅ Intentional feature

---

## Other Type Suppressions

### TypeScript Ignores - 3 instances

1. **`app/proposal-hub/leads/[id]/page.tsx:230`**
   ```typescript
   {/* @ts-ignore TypeScript incorrectly infers type for sibling Cards in grid */}
   ```
   - Status: ⚠️ Review recommended
   - Recommendation: Consider fixing type inference issue

2. **`app/portal/proposals/[id]/sign/page.tsx:54-56`**
   ```typescript
   // @ts-expect-error - DocuSeal global
   ```
   - Status: ✅ Justified (third-party library types)

3. **`fix-types.sh:7`**
   - Script file for fixing TRPC type issues
   - Status: ✅ Tooling file

### ESLint Disables - 3 instances

4. **`components/employee-hub/timesheets/time-entry-modal.tsx:236`**
   ```typescript
   ]); // eslint-disable-line react-hooks/exhaustive-deps
   ```
   - Status: ⚠️ Review recommended
   - Recommendation: Review dependency array

5. **`components/error-boundary.tsx:45`**
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-var-requires
   ```
   - Status: ✅ Justified (error boundary requires dynamic import)

6. **`bmad/bmb/workflows/create-module/installer-templates/installer.js:1`**
   ```javascript
   /* eslint-disable unicorn/prefer-module, unicorn/prefer-node-protocol */
   ```
   - Status: ✅ Justified (template file)

---

## Recommendations

### High Priority Actions

1. **🔴 Replace Legal Document Placeholders**
   - Files: `scripts/seed.ts` (lines 812, 891, 960)
   - Action: Replace with actual legal documents reviewed by legal counsel
   - Deadline: Before production deployment

2. **🔴 Enable Email Verification**
   - File: `docs/10-system/architecture-detailed/authentication.md:138`
   - Action: Enable `requireEmailVerification: true` in production
   - Impact: Security enhancement

3. **🔴 Complete Email Service Integration**
   - File: `app/server/routers/invoices.ts:533`
   - Action: Integrate with SendGrid, Resend, or similar service
   - Impact: Critical functionality

### Medium Priority Actions

4. **🟡 Complete Xero Webhook Handlers**
   - Files: `lib/xero/webhook-processor.ts` (4 handlers)
   - Action: Implement invoice, contact, payment, and bank transaction sync
   - Impact: Integration completeness

5. **🟡 Make Minimum Hours Configurable**
   - File: `app/server/routers/timesheets.ts:573`
   - Action: Move hard-coded value to settings
   - Impact: Business rule flexibility

6. **🟡 Complete LEM Verify Integration**
   - File: `lib/kyc/lemverify-client.ts:22-23`
   - Action: Contact LEM Verify for API docs, implement upload methods
   - Impact: KYC feature completeness

### Low Priority Actions

7. **🟢 Complete Client Hub Reports**
   - File: `app/client-hub/reports/page.tsx` (3 TODOs)
   - Action: Implement YoY growth, MoM change, and service count calculations
   - Impact: Report accuracy

8. **🟢 Implement Leave Conflicts Feature**
   - File: `app/employee-hub/approvals/leave/page.tsx:91`
   - Action: Implement backend conflict detection
   - Impact: Feature completeness

9. **🟢 Complete E2E Test Suite**
   - Files: `tests/e2e/regression/*.spec.ts` (30+ TODOs)
   - Action: Implement missing E2E tests
   - Impact: Test coverage

---

## Conclusion

**Overall Assessment:** ✅ **Good**

- **Biome Ignore Comments:** All 32 instances are justified and well-documented
- **Type Suppressions:** Most are justified; 1-2 may benefit from review
- **TODO Comments:** 12 production-related TODOs identified, with clear priorities
- **Placeholder Content:** 3 critical legal document placeholders require immediate attention before production

**Key Takeaway:** The codebase is well-maintained with appropriate use of linter suppressions. The main concerns are:
1. Legal document placeholders (must be replaced before production)
2. Incomplete integrations (Xero, email service, LEM Verify)
3. Missing E2E test coverage (low priority)

---

**Next Review Date:** Recommended quarterly or before major releases

