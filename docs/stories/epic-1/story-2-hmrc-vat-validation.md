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
