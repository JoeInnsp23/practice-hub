# User Story: HMRC VAT Validation Integration

**Story ID:** STORY-1.2
**Epic:** Epic 1 - Critical Path & Production Readiness
**Feature:** FR2 - HMRC VAT Validation Integration
**Priority:** Critical
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** staff member onboarding clients
**I want** real-time HMRC VAT number validation integrated into client forms
**So that** I can eliminate manual verification and ensure VAT number accuracy automatically

---

## Business Value

- **Accuracy:** Eliminates manual VAT number verification errors
- **Efficiency:** Reduces client onboarding time by automating VAT validation
- **Compliance:** Ensures VAT numbers are valid with HMRC before storing
- **User Experience:** Provides immediate validation feedback during data entry

---

## Acceptance Criteria

### Functional Requirements

**AC1: HMRC OAuth 2.0 Authentication**
- **Given** the HMRC integration is configured
- **When** VAT validation is initiated
- **Then** OAuth 2.0 flow authenticates with HMRC API
- **And** authentication follows Companies House pattern (clients.ts:490-607)

**AC2: VAT Validation tRPC Endpoint**
- **Given** a VAT number is submitted for validation
- **When** `clients.validateVAT` mutation is called
- **Then** the HMRC API is queried with the VAT number
- **And** validation result is returned (valid/invalid/error)

**AC3: Client Onboarding Wizard Integration**
- **Given** a user is creating a client in the onboarding wizard
- **When** a VAT number is entered
- **Then** real-time validation is triggered on blur or button click
- **And** visual indicators show validation status (checkmark/X icon)

**AC4: Client Edit Form Integration**
- **Given** a user is editing an existing client
- **When** the VAT number field is modified
- **Then** re-validation is triggered
- **And** updated validation status is displayed

**AC5: Validation Status Storage**
- **Given** VAT validation completes
- **When** the result is received
- **Then** validation status is stored in `clients.vatValidationStatus` field
- **And** validation timestamp is stored in `clients.vatValidatedAt`

**AC6: Sandbox and Production Support**
- **Given** environment variables are configured
- **When** the application runs
- **Then** HMRC_SANDBOX_MODE determines API endpoint (sandbox vs production)
- **And** correct credentials are used per environment

**AC7: Error Handling**
- **Given** HMRC API validation fails (network, rate limit, server error)
- **When** the error occurs
- **Then** user-friendly error message is displayed
- **And** validation can be retried
- **And** form submission is not blocked (validation is advisory)

**AC8: Rate Limiting Handling**
- **Given** HMRC API rate limits are exceeded
- **When** rate limit error is received
- **Then** graceful error message indicates rate limiting
- **And** retry-after information is displayed if available

### Integration Requirements

**AC9: Multi-tenant Isolation**
- **Given** multiple tenants use VAT validation
- **When** validation is performed
- **Then** results are scoped to the tenant
- **And** validation credentials respect tenant configuration

**AC10: Existing Functionality Intact**
- **Given** VAT validation is deployed
- **When** client onboarding/editing workflows are used
- **Then** existing functionality continues to work
- **And** validation is an enhancement, not a blocker

### Quality Requirements

**AC11: Performance**
- **Given** VAT validation is triggered
- **When** the HMRC API is called
- **Then** response time is <2 seconds for 95% of requests
- **And** slow API responses don't block UI

**AC12: Visual Feedback**
- **Given** VAT validation is in progress
- **When** the user views the form
- **Then** loading spinner is displayed
- **And** clear success (green checkmark) or failure (red X) icons show result

---

## Technical Implementation

### Database Schema Changes

```typescript
// Add to clients table
export const clients = pgTable("clients", {
  // ... existing fields
  vatValidationStatus: text("vat_validation_status"), // "valid" | "invalid" | "pending" | null
  vatValidatedAt: timestamp("vat_validated_at"),
});
```

### File Structure

```
lib/
  integrations/
    hmrc.ts           # HMRC service (similar to companiesHouse.ts)
app/server/routers/
  clients.ts          # Extend with validateVAT mutation
components/
  client-hub/
    client-wizard.tsx # Add VAT validation to onboarding
    vat-validation-indicator.tsx # Visual validation status component
```

### tRPC Procedures

```typescript
// app/server/routers/clients.ts
export const clientsRouter = router({
  // ... existing procedures

  validateVAT: protectedProcedure
    .input(z.object({
      vatNumber: z.string(),
      clientId: z.string().optional(), // for existing client updates
    }))
    .mutation(async ({ ctx, input }) => {
      // Call HMRC API via hmrcService
      // Store validation result
      // Return validation status
    }),
});
```

### HMRC Service Implementation

```typescript
// lib/integrations/hmrc.ts
export class HMRCService {
  private apiEndpoint: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.apiEndpoint = process.env.HMRC_SANDBOX_MODE === 'true'
      ? 'https://test-api.service.hmrc.gov.uk'
      : 'https://api.service.hmrc.gov.uk';
    this.clientId = process.env.HMRC_CLIENT_ID!;
    this.clientSecret = process.env.HMRC_CLIENT_SECRET!;
  }

  async validateVAT(vatNumber: string): Promise<{
    isValid: boolean;
    businessName?: string;
    error?: string;
  }> {
    // OAuth 2.0 flow
    // VAT validation API call
    // Return validation result
  }
}
```

### Environment Variables

```bash
# .env.local
HMRC_CLIENT_ID="your-client-id"
HMRC_CLIENT_SECRET="your-client-secret"
HMRC_SANDBOX_MODE="true"  # false for production
```

### Technical Notes

- **Reference Pattern:** Follow Companies House integration (clients.ts:490-607)
- **Sandbox Credentials:** Available in `.archive/practice-hub/.env`
- **OAuth Flow:** Implement server-to-server OAuth 2.0 (client credentials grant)
- **API Endpoint:** Use HMRC VAT API (test: test-api.service.hmrc.gov.uk)
- **Error Handling:** Graceful degradation - validation failure doesn't block form submission
- **Caching:** Consider caching validation results (15-minute TTL) to reduce API calls

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] OAuth 2.0 flow implemented for HMRC authentication
- [ ] `clients.validateVAT` tRPC mutation created and functional
- [ ] VAT validation integrated in client onboarding wizard
- [ ] VAT validation integrated in client edit forms
- [ ] Validation status stored in `clients.vatValidationStatus` and `vatValidatedAt`
- [ ] Sandbox and production credential support via environment variables
- [ ] Error handling for API failures with user-friendly messages
- [ ] Rate limiting handled gracefully with retry information
- [ ] Visual validation indicators (checkmark/X icon) functional
- [ ] Multi-tenant isolation verified (credentials scoped to tenant if needed)
- [ ] Unit tests written for HMRC service and validateVAT mutation
- [ ] Integration tests with mocked HMRC API responses
- [ ] E2E tests for VAT validation in client onboarding flow
- [ ] Seed data includes clients with validated VAT numbers
- [ ] Code reviewed with focus on API security (credentials, error handling)
- [ ] Documentation updated: README with HMRC environment variables
- [ ] Performance benchmarks met (<2s API response time)
- [ ] No regressions in existing client onboarding/editing workflows
- [ ] Feature deployed to staging and tested with HMRC sandbox

---

## Dependencies

**Upstream:**
- None (independent of other stories)

**Downstream:**
- Epic 2 Client CSV Import (FR11) may optionally reuse VAT validation

**External:**
- HMRC API sandbox credentials (available in `.archive/practice-hub/.env`)
- HMRC API production credentials (pending, not blocking)
- HMRC developer account (for OAuth app registration)

---

## Testing Strategy

### Unit Tests
- Test HMRC service OAuth flow (mocked)
- Test VAT validation with valid/invalid numbers (mocked API)
- Test error handling for API failures
- Test multi-tenant scoping of validation results

### Integration Tests
- Test validateVAT mutation with sandbox API
- Test validation status storage in database
- Test rate limiting handling

### E2E Tests
- Test client onboarding with VAT validation
- Test client edit form VAT re-validation
- Test validation failure handling (network error simulation)

---

## Risks & Mitigation

**Risk:** HMRC production credentials delay
**Mitigation:** Implement with sandbox credentials; test thoroughly; swap to production credentials when available
**Impact:** Low - development not blocked, only production VAT validation delayed

**Risk:** HMRC API rate limiting
**Mitigation:** Implement result caching (15-min TTL); handle rate limit errors gracefully; consider batch validation for imports
**Impact:** Medium - may require retry logic and user communication

---

## Notes

- HMRC sandbox credentials available in `.archive/practice-hub/.env`
- Companies House integration (clients.ts:490-607) is reference implementation
- VAT validation is advisory (doesn't block form submission) to avoid HMRC API dependency
- Consider adding "Validate VAT" button for on-demand validation vs automatic blur validation
- HMRC API documentation: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-registered-companies-api

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-1 - Critical Path & Production Readiness
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR2)

---

## QA Results

### Review Date: 2025-10-22

### Reviewed By: Quinn (Test Architect)

### 🚨 CRITICAL ISSUE: Test Failures Blocking Approval

**Status:** 5 out of 6 unit tests FAILING

Test execution results show only 1 of 6 tests passing in `lib/hmrc/client.test.ts`:
- ✅ PASS: "should successfully validate a valid VAT number"
- ❌ FAIL: "should return invalid for non-existent VAT number"
- ❌ FAIL: "should normalize VAT number by removing GB prefix"
- ❌ FAIL: "should throw RateLimitError when API returns 429"
- ❌ FAIL: "should throw AuthenticationError when OAuth fails"
- ❌ FAIL: "should cache OAuth token for subsequent requests"

**Root Cause Analysis:**
The mock setup in tests is incomplete. While the first test uses proper mock chaining with `vi.fn().mockResolvedValue()`, subsequent tests are not properly clearing mocks between runs, causing response.target to be undefined.

**Evidence:**
```
TypeError: Cannot read properties of undefined (reading 'vatNumber')
 ❯ validateVAT lib/hmrc/client.ts:300:34
```

This indicates that `response.target.vatNumber` is undefined because the mock fetch isn't returning the expected structure for all test cases.

### Code Quality Assessment

**Implementation Excellence:**

The HMRC integration code quality is **outstanding**:

1. **Architecture (9/10)**
   - Clean separation of concerns
   - Well-structured error hierarchy with 5 custom error classes
   - OAuth 2.0 token caching with 60-second expiry buffer
   - Follows Companies House integration pattern consistently

2. **Security (10/10)**
   - Environment variable validation with clear error messages
   - OAuth 2.0 server-to-server authentication (client credentials grant)
   - No hardcoded credentials
   - Proper credential handling with getOAuthCredentials()

3. **Error Handling (10/10)**
   - Comprehensive Sentry integration throughout tRPC layer
   - 5 specific error classes: VATNotFoundError, RateLimitError, APIServerError, NetworkError, AuthenticationError
   - User-friendly error messages with context
   - Graceful degradation (404 returns invalid result instead of throwing)
   - Advisory validation (doesn't block form submission)

4. **Documentation (9/10)**
   - Excellent JSDoc comments with examples
   - Clear inline comments explaining OAuth flow
   - TypeScript interfaces well-documented
   - API endpoint documentation link included

5. **Type Safety (10/10)**
   - Full TypeScript coverage
   - Proper interface definitions for API responses
   - No `any` types
   - Zod validation in tRPC mutation

### Requirements Traceability

| AC# | Requirement | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | HMRC OAuth 2.0 Authentication | ✅ PASS | `lib/hmrc/client.ts:135-180` - Client credentials grant with token caching |
| AC2 | VAT Validation tRPC Endpoint | ✅ PASS | `clients.ts:631-761` - validateVAT mutation with proper input validation |
| AC3 | Client Onboarding Wizard Integration | ✅ PASS | `registration-details-step.tsx:268-278` - VATValidationIndicator integrated |
| AC4 | Client Edit Form Integration | ✅ PASS | `client-modal.tsx:401-413` - VAT validation in edit modal |
| AC5 | Validation Status Storage | ✅ PASS | `schema.ts:311-312` + `clients.ts:653-654` - Database fields + update logic |
| AC6 | Sandbox and Production Support | ✅ PASS | `client.ts:98-103` - getBaseURL() switches based on HMRC_SANDBOX_MODE |
| AC7 | Error Handling | ✅ PASS | `clients.ts:703-760` - Comprehensive error handling with user-friendly messages |
| AC8 | Rate Limiting Handling | ✅ PASS | `RateLimitError` class + tRPC handler with retry guidance |
| AC9 | Multi-tenant Isolation | ✅ PASS | `clients.ts:641` - tenantId from authContext used consistently |
| AC10 | Existing Functionality Intact | ⚠️ UNTESTED | Requires regression test execution |
| AC11 | Performance (<2s response) | ⚠️ UNTESTED | Requires live API testing |
| AC12 | Visual Feedback | ✅ PASS | `vat-validation-indicator.tsx` - Loading/success/error states with icons |

**Coverage:** 9/12 fully verified, 3/12 require runtime testing

### Compliance Check

- ✅ **Coding Standards:** Excellent adherence to TypeScript best practices
- ✅ **Project Structure:** Follows established patterns (lib/hmrc/, app/server/routers/)
- ❌ **Testing Strategy:** CRITICAL FAILURE - 83% of unit tests failing
- ⚠️ **All ACs Met:** Core functionality implemented, but not verified due to test failures

### Test Architecture Assessment

**Test Coverage Status:**

| Test Type | Required | Actual | Status |
|-----------|----------|--------|--------|
| Unit Tests | Yes | 6 tests (1 passing, 5 failing) | ❌ FAILING |
| Integration Tests | Yes | Not found | ❌ MISSING |
| E2E Tests | Recommended | Not found | ⚠️ MISSING |

**Test Quality Issues:**

1. **Mock Management (CRITICAL)**
   - Mocks not being reset between test cases
   - Fetch responses returning undefined for subsequent tests
   - Needs proper `beforeEach(() => vi.clearAllMocks())` usage

2. **Test Isolation (HIGH)**
   - Tests are not independent - failure cascade suggests shared state
   - Token caching test may be polluting global state

3. **Missing Test Coverage (HIGH)**
   - No integration tests for actual HMRC API (even with mocks)
   - No tRPC mutation tests
   - No multi-tenant isolation verification
   - No E2E tests for client onboarding flow with VAT validation

### Security Review

✅ **EXCELLENT** - No security concerns identified:

- OAuth credentials properly secured in environment variables
- No credential leakage in logs or errors
- Sentry error tracking configured with appropriate context
- Rate limiting handled gracefully
- No SQL injection risk (parameterized queries via Drizzle)
- VAT number normalization prevents injection attempts

### Performance Considerations

✅ **GOOD** - Performance optimizations implemented:

- OAuth token caching reduces auth overhead (60-second buffer before expiry)
- Advisory validation (non-blocking) prevents UI delays
- Proper error handling avoids hanging requests
- No N+1 query patterns detected

⚠️ **Recommendations:**
- Consider implementing validation result caching (15-minute TTL) to reduce HMRC API calls
- Monitor HMRC API response times in production and add timeout configuration

### Non-Functional Requirements Assessment

| NFR | Status | Score | Notes |
|-----|--------|-------|-------|
| **Security** | ✅ PASS | 10/10 | Excellent credential handling, proper auth flow, Sentry integration |
| **Reliability** | ⚠️ CONCERNS | 6/10 | Code is solid, but failing tests reduce confidence |
| **Performance** | ✅ PASS | 9/10 | Token caching, non-blocking validation, good error handling |
| **Maintainability** | ✅ PASS | 9/10 | Excellent documentation, clean code, clear structure |
| **Testability** | ❌ FAIL | 3/10 | Test suite not functional - critical blocker |

### Risk Assessment

**Risk Profile:** HIGH

| Risk Factor | Severity | Probability | Impact | Mitigation Status |
|-------------|----------|-------------|--------|-------------------|
| Test failures masking bugs | HIGH | High (83% failure rate) | Production defects | ❌ UNMITIGATED |
| Untested integration points | MEDIUM | Medium | Runtime errors | ❌ UNMITIGATED |
| HMRC API production credentials | LOW | Low | Feature unavailable | ✅ MITIGATED (sandbox works) |
| Rate limiting in production | MEDIUM | Medium | User friction | ✅ MITIGATED (graceful handling) |

### Improvements Checklist

**CRITICAL - Must Fix Before Approval:**

- [ ] **Fix unit test mocks** - Ensure all 6 tests pass
  - Add proper `beforeEach(() => vi.clearAllMocks())` to reset mocks
  - Fix mock response structure for all test cases
  - Verify token caching test doesn't pollute state
  - File: `lib/hmrc/client.test.ts`

- [ ] **Add integration tests for validateVAT mutation**
  - Test with mocked HMRC responses
  - Verify database updates
  - Test multi-tenant isolation
  - File: `__tests__/routers/clients-vat.test.ts` (create)

**HIGH PRIORITY - Recommended Before Production:**

- [ ] **Add E2E test for VAT validation flow**
  - Test client onboarding wizard with VAT validation
  - Verify visual feedback (loading/success/error states)
  - File: `__tests__/e2e/client-hub/vat-validation.spec.ts` (create)

- [ ] **Implement result caching**
  - Cache validation results for 15 minutes
  - Reduce HMRC API call volume
  - File: `lib/hmrc/client.ts`

**MEDIUM PRIORITY - Future Enhancements:**

- [ ] Consider extracting OAuth logic to reusable service (DRY principle with Companies House)
- [ ] Add timeout configuration for HMRC API calls
- [ ] Add retry logic with exponential backoff for transient failures
- [ ] Create admin panel for viewing validation history

### Files Modified During Review

**No files modified** - Review only identified issues, no code changes made.

### Gate Status

**Gate:** FAIL → docs/qa/gates/epic-1.story-2-hmrc-vat-validation.yml

**Decision Rationale:**
Despite excellent code quality, architecture, and security implementation, the **83% unit test failure rate (5/6 tests failing)** is a critical blocker. Tests must pass before code can be promoted to production. This is a deterministic FAIL per gate criteria: test failures indicate insufficient validation of implementation.

**Risk Profile:** docs/qa/assessments/epic-1.story-2-risk-20251022.md
**NFR Assessment:** docs/qa/assessments/epic-1.story-2-nfr-20251022.md

### Recommended Status

❌ **Changes Required** - Test failures must be resolved

**Required Actions:**
1. Fix all 5 failing unit tests in `lib/hmrc/client.test.ts`
2. Add integration tests for validateVAT tRPC mutation
3. Re-run full test suite and verify no regressions
4. Request re-review after tests pass

**Estimated Fix Time:** 1-2 hours (straightforward mock fixes)

**Quality Score:** 58/100
- Calculation: 100 - (20 × 1 NFR FAIL) - (10 × 1 NFR CONCERN) - (20 × test failure penalty) = 58

---

### Notes for Developer

**What You Did Really Well:**

🌟 **Exceptional code quality** - This is some of the cleanest integration code I've reviewed:
- Outstanding error handling with proper error hierarchy
- Excellent documentation and comments
- Perfect Sentry integration
- Secure credential management
- Clean architecture following established patterns

**What Needs Immediate Attention:**

🔧 **Test Mock Setup** - The issue is straightforward:
```typescript
// Problem: Mocks aren't isolated between tests
// Solution: Add proper cleanup in beforeEach

beforeEach(() => {
  vi.clearAllMocks();
  // Reset cached token to ensure test isolation
  cachedToken = null; // If exported for testing
});
```

The first test passes because it's the first to run. Subsequent tests fail because mocks aren't reset. This is a common issue and easy to fix.

**Confidence Assessment:**

I have **high confidence** in your implementation. The test failures are superficial (mock setup issues), not fundamental problems with the integration logic. Once tests are fixed, this will be production-ready code.

**Next Steps:**
1. Fix test mocks (see checklist above)
2. Add the recommended integration tests
3. Request re-review - should be a quick PASS

---

**Review Completed:** 2025-10-22T13:57:00Z
**Reviewer:** Quinn (Test Architect & Quality Advisor)
**Review Type:** Comprehensive Test Architecture Review
