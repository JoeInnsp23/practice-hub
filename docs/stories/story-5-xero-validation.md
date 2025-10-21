# Story 5: Xero Integration Testing & Validation - Brownfield Enhancement

**Epic:** Client-Hub Production Readiness
**Created:** 2025-10-21
**Priority:** LOW
**Story Points:** 5

---

## User Story

As a **developer maintaining the Xero integration**,
I want **comprehensive tests validating the OAuth flow and transaction data fetching**,
So that **I can confidently deploy Xero-related changes knowing the integration works correctly and token refresh is reliable**.

---

## Story Context

### Existing System Integration

- **Integrates with:** Existing Xero integration in `lib/xero/client.ts`
- **Technology:** Xero OAuth 2.0 API, Next.js API routes, tRPC
- **Follows pattern:** Existing integration test patterns
- **Touch points:**
  - `lib/xero/client.ts` (287 lines, FULLY IMPLEMENTED)
  - `app/api/xero/authorize/route.ts`
  - `app/api/xero/callback/route.ts`
  - `app/server/routers/transactionData.ts`
  - Database: `xeroConnections` table

### Current System Context

**Xero Integration is FULLY IMPLEMENTED:**
- ✅ OAuth authorization flow complete
- ✅ Token exchange implemented
- ✅ Token refresh mechanism working
- ✅ Bank transaction fetching implemented
- ✅ Monthly transaction calculation working
- ✅ Database schema for xero_connections exists
- ⚠️ NO tests exist for Xero integration
- ⚠️ Documentation says "not implemented" (FALSE)

**Functions Implemented:**
```typescript
// lib/xero/client.ts
export function getAuthorizationUrl(state: string): string { ... }
export async function getAccessToken(code: string): Promise<XeroTokenResponse> { ... }
export async function refreshAccessToken(refreshToken: string): Promise<XeroTokenResponse> { ... }
export async function getConnections(accessToken: string): Promise<XeroConnection[]> { ... }
export async function getValidAccessToken(clientId: string) { ... }
export async function fetchBankTransactions(...) { ... }
export function calculateMonthlyTransactions(transactions: BankTransaction[]): number { ... }
```

---

## Acceptance Criteria

### Functional Requirements

1. **OAuth Flow Tests:** Unit tests for authorization URL generation
2. **Token Exchange Tests:** Tests for code-to-token exchange
3. **Token Refresh Tests:** Tests for automatic token refresh before expiration
4. **Transaction Fetch Tests:** Tests for bank transaction fetching
5. **Calculation Tests:** Tests for monthly transaction calculations
6. **Error Handling Tests:** Tests for expired tokens, API failures, network errors

### Integration Requirements

7. **Sandbox Testing:** Manual test with real Xero sandbox account
8. **OAuth Flow E2E:** Complete authorization → callback → token storage flow tested
9. **Token Expiry:** Verify automatic refresh when token near expiration (5-min buffer)
10. **Database Integration:** Verify xero_connections table updates correctly
11. **Router Integration:** Verify `transactionData.fetchFromXero` procedure works

### Quality Requirements

12. **Test Coverage:** Minimum 80% coverage for `lib/xero/client.ts`
13. **Mock API Responses:** Use mocked Xero API responses for unit tests
14. **Integration Tests:** Real API tests with Xero sandbox (not in CI)
15. **Documentation:** Xero setup guide validated and updated

---

## Technical Notes

### Integration Approach

**Unit Tests with Mocks:**
```typescript
// lib/xero/client.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  getAuthorizationUrl,
  getAccessToken,
  refreshAccessToken,
  calculateMonthlyTransactions,
} from './client';

describe('lib/xero/client.ts', () => {
  describe('getAuthorizationUrl', () => {
    it('should generate valid OAuth URL with state', () => {
      const state = 'test-state-123';
      const url = getAuthorizationUrl(state);

      expect(url).toContain('https://login.xero.com/identity/connect/authorize');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('response_type=code');
    });
  });

  describe('getAccessToken', () => {
    it('should exchange code for access token', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 1800,
        }),
      });

      const result = await getAccessToken('test-code');

      expect(result.access_token).toBe('mock_access_token');
      expect(result.refresh_token).toBe('mock_refresh_token');
    });
  });

  describe('calculateMonthlyTransactions', () => {
    it('should calculate average monthly transactions', () => {
      const transactions = [
        { date: '2025-01-15', type: 'SPEND', total: 100 },
        { date: '2025-01-20', type: 'SPEND', total: 200 },
        { date: '2025-02-10', type: 'SPEND', total: 150 },
      ];

      const result = calculateMonthlyTransactions(transactions);

      // 3 transactions across 2 months = 1.5, rounded to 2
      expect(result).toBe(2);
    });
  });
});
```

**Integration Tests (Manual):**
```typescript
// lib/xero/client.integration.test.ts
// Run manually with: XERO_TEST=true pnpm test client.integration.test.ts

import { describe, it, expect } from 'vitest';

describe.skipIf(!process.env.XERO_TEST)('Xero Integration Tests', () => {
  it('should connect to Xero sandbox', async () => {
    // Real Xero sandbox test
    // Requires XERO_CLIENT_ID and XERO_CLIENT_SECRET in env
  });
});
```

### Existing Pattern Reference

- Follow integration test patterns from Story 2
- Use mocking patterns similar to existing test helpers
- Follow error handling patterns from existing routers

### Key Testing Scenarios

**Token Refresh Logic:**
```typescript
it('should refresh token when near expiration', async () => {
  // Create connection with token expiring in 4 minutes
  const connection = await createTestConnection({
    expiresAt: new Date(Date.now() + 4 * 60 * 1000),
  });

  // Mock refresh response
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      access_token: 'new_token',
      refresh_token: 'new_refresh',
      expires_in: 1800,
    }),
  });

  const result = await getValidAccessToken(connection.clientId);

  expect(result.accessToken).toBe('new_token');
  // Verify database updated
  const updated = await db.select().from(xeroConnections)
    .where(eq(xeroConnections.id, connection.id));
  expect(updated[0].accessToken).toBe('new_token');
});
```

---

## Definition of Done

- [ ] Unit tests created for `lib/xero/client.ts`
- [ ] All 7 functions have unit tests
- [ ] OAuth URL generation tested
- [ ] Token exchange tested (mocked)
- [ ] Token refresh tested (mocked)
- [ ] Transaction fetching tested (mocked)
- [ ] Monthly calculation tested
- [ ] Error handling tested (expired tokens, API errors)
- [ ] Integration test file created (for manual sandbox testing)
- [ ] Manual test completed with real Xero sandbox account
- [ ] Token refresh verified working (5-minute buffer)
- [ ] Database integration verified (xero_connections updates)
- [ ] Code coverage reaches 80% for `lib/xero/client.ts`
- [ ] All tests pass: `pnpm test lib/xero/client.test.ts`
- [ ] **Documentation updated:** `docs/guides/integrations/xero.md` (add testing section, mark as COMPLETE & TESTED)
- [ ] **Documentation updated:** `docs/reference/integrations.md` (update status to ✅ COMPLETE & TESTED)
- [ ] **Documentation updated:** `docs/development/technical-debt.md` (remove false "not implemented" claim)

---

## Risk and Compatibility Check

### Minimal Risk Assessment

- **Primary Risk:** Tests reveal bugs in token refresh logic
- **Mitigation:**
  - Fix bugs as discovered
  - Token refresh has 5-minute buffer to prevent expiry during operations
  - Existing functionality works, so bugs are likely edge cases
- **Rollback:** Xero integration can be disabled via feature flag if critical bugs found

### Compatibility Verification

- [ ] No changes to Xero integration code (test-only)
- [ ] Xero OAuth flow continues to work
- [ ] Token refresh continues to work
- [ ] Transaction fetching continues to work
- [ ] No database schema changes needed

---

## Validation Checklist

### Scope Validation

- [x] Story scope is clear (test existing Xero integration)
- [x] Integration already complete, only needs tests
- [x] Success criteria measurable (80% coverage, tests pass)
- [x] Low risk (test-only changes)

### Clarity Check

- [x] Test scenarios clearly defined
- [x] Mocking strategy specified
- [x] Manual testing approach documented
- [x] Rollback approach simple (feature flag)

---

## Implementation Notes

### Xero Sandbox Setup

1. Create Xero sandbox account (free)
2. Create test Xero app at https://developer.xero.com/app/manage
3. Set redirect URI to `http://localhost:3000/api/xero/callback`
4. Add credentials to `.env.local`:
   ```bash
   XERO_CLIENT_ID="your-sandbox-client-id"
   XERO_CLIENT_SECRET="your-sandbox-secret"
   XERO_REDIRECT_URI="http://localhost:3000/api/xero/callback"
   ```

### Manual Testing Checklist

- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to client detail page
- [ ] Click "Connect to Xero"
- [ ] Authorize with Xero sandbox account
- [ ] Verify redirected back to client page
- [ ] Verify connection saved in database
- [ ] Click "Fetch Transactions from Xero"
- [ ] Verify transactions fetched and average calculated
- [ ] Wait 31 minutes (token should refresh)
- [ ] Fetch transactions again
- [ ] Verify token refresh happened (check database expiresAt)

### Test File Structure

```
lib/xero/
├── client.ts                    # Existing implementation
├── client.test.ts               # New unit tests
└── client.integration.test.ts   # New integration tests (manual only)
```

---

## Success Metrics

- **Coverage:** 80%+ for Xero client code
- **Test Count:** 15-20 unit tests
- **Manual Validation:** OAuth flow working end-to-end
- **Token Refresh:** Automatic refresh verified working
- **Confidence:** Can deploy Xero changes without breaking existing functionality

---

**Story Status:** Ready for Implementation (Lowest priority)
**Estimated Time:** 1 day
**Dependencies:** Story 1 (documentation correction - Xero is actually implemented)
