# Story 3: Implement Companies House API Integration - Brownfield Enhancement

**Epic:** Client-Hub Production Readiness
**Created:** 2025-10-21
**Priority:** HIGH
**Story Points:** 8

---

## User Story

As an **accountant creating a new client in Practice Hub**,
I want **to automatically lookup UK company information from Companies House**,
So that **I can quickly populate client details without manual data entry and ensure accuracy**.

---

## Story Context

### Existing System Integration

- **Integrates with:** Client wizard in `components/client-hub/clients/client-wizard-modal.tsx`
- **Technology:** Next.js, tRPC, Companies House REST API
- **Follows pattern:** Existing Xero integration pattern (OAuth not needed, API key auth)
- **Touch points:**
  - Client creation wizard
  - `app/server/routers/clients.ts` (add new procedure)
  - New `lib/companies-house/client.ts` API client
  - Database tables: `clients`, `clientDirectors`, `clientPSCs`

### Current System Context

**Documented but Not Implemented:**
- `docs/reference/integrations.md` lists Companies House as available
- Environment variable `COMPANIES_HOUSE_API_KEY` documented
- No actual implementation exists

**Existing Similar Pattern (Xero):**
```typescript
// lib/xero/client.ts - Follow this pattern
export async function getCompany(number: string) {
  const response = await fetch(
    `${COMPANIES_HOUSE_API_URL}/company/${number}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`,
      },
    }
  );
  return response.json();
}
```

---

## Acceptance Criteria

### Functional Requirements

1. **API Client Created:** `lib/companies-house/client.ts` with basic auth support
2. **Get Company Implemented:** `getCompany(companyNumber)` fetches company details
3. **Get Officers Implemented:** `getOfficers(companyNumber)` fetches directors list
4. **Get PSCs Implemented:** `getPSCs(companyNumber)` fetches persons with significant control
5. **tRPC Procedure Added:** `clients.lookupCompaniesHouse(companyNumber)` procedure in router
6. **UI Integration:** "Lookup from Companies House" button added to client wizard
7. **Data Mapping:** Company data correctly maps to client schema fields
8. **Error Handling:** 404 (not found), 429 (rate limit), network errors handled gracefully

### Integration Requirements

9. **Rate Limiting:** Respects 600 requests per 5 minutes limit
10. **Caching:** Company lookups cached for 24 hours to reduce API calls
11. **Tenant Isolation:** Lookup results associated with correct tenantId
12. **Existing Client Flow:** Client creation wizard still works without Companies House lookup
13. **Activity Logging:** Lookup actions logged in activity logs

### Quality Requirements

14. **Integration Tests:** API client has comprehensive integration tests
15. **Router Tests:** tRPC procedure tested with mocked API responses
16. **E2E Test:** Manual test with real Companies House sandbox
17. **Documentation:** Setup guide created in `docs/guides/integrations/companies-house.md`

---

## Technical Notes

### Integration Approach

**API Client Structure:**
```typescript
// lib/companies-house/client.ts

const API_URL = "https://api.company-information.service.gov.uk";
const API_KEY = process.env.COMPANIES_HOUSE_API_KEY || "";

export interface CompanyDetails {
  companyNumber: string;
  companyName: string;
  status: string; // "active" | "dissolved" | etc
  type: string; // "ltd" | "plc" | etc
  registeredOffice: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    postalCode: string;
    country: string;
  };
  dateOfCreation: string;
  sicCodes: string[];
}

export interface Officer {
  name: string;
  role: string; // "director" | "secretary" | etc
  appointedOn: string;
  resignedOn?: string;
}

export interface PSC {
  name: string;
  notifiedOn: string;
  natureOfControl: string[];
  kind: string; // "individual-person-with-significant-control" | etc
}

export async function getCompany(companyNumber: string): Promise<CompanyDetails> {
  // Implement with basic auth
}

export async function getOfficers(companyNumber: string): Promise<Officer[]> {
  // Implement
}

export async function getPSCs(companyNumber: string): Promise<PSC[]> {
  // Implement
}
```

**tRPC Procedure:**
```typescript
// app/server/routers/clients.ts

lookupCompaniesHouse: protectedProcedure
  .input(z.string()) // Company number
  .query(async ({ ctx, input: companyNumber }) => {
    const { getCompany, getOfficers, getPSCs } = await import("@/lib/companies-house/client");

    const company = await getCompany(companyNumber);
    const officers = await getOfficers(companyNumber);
    const pscs = await getPSCs(companyNumber);

    return {
      company,
      officers,
      pscs,
    };
  }),
```

### Existing Pattern Reference

- **Auth Pattern:** Follow Xero's API client pattern (basic HTTP auth)
- **Error Handling:** Follow tRPC error handling patterns
- **Caching:** Use similar pattern to Xero token caching
- **UI Pattern:** Add button similar to "Connect to Xero" in client wizard

### Key Implementation Details

**Rate Limiting Strategy:**
- 600 requests per 5 minutes = 120 requests per minute
- Implement simple in-memory counter (reset every 5 minutes)
- Return cached data if rate limit approaching

**Data Mapping:**
```typescript
// Map Companies House data to client schema
const clientData = {
  name: company.companyName,
  registrationNumber: company.companyNumber,
  type: mapCompanyType(company.type), // "ltd" → "limited_company"
  status: company.status === "active" ? "active" : "inactive",
  addressLine1: company.registeredOffice.addressLine1,
  addressLine2: company.registeredOffice.addressLine2,
  city: company.registeredOffice.locality,
  postalCode: company.registeredOffice.postalCode,
  country: company.registeredOffice.country,
  incorporationDate: company.dateOfCreation,
};
```

---

## Definition of Done

- [ ] `lib/companies-house/client.ts` created with API client
- [ ] `getCompany()` function implemented and tested
- [ ] `getOfficers()` function implemented and tested
- [ ] `getPSCs()` function implemented and tested
- [ ] `clients.lookupCompaniesHouse` tRPC procedure added
- [ ] "Lookup Company" button added to client wizard UI
- [ ] Data mapping correctly populates client form fields
- [ ] Error handling works (404, 429, network errors)
- [ ] Rate limiting implemented (600 per 5 min)
- [ ] Caching implemented (24 hour TTL)
- [ ] Integration tests written and passing
- [ ] Manual test completed with real Companies House sandbox
- [ ] **Documentation created:** `docs/guides/integrations/companies-house.md`
- [ ] **Documentation updated:** `docs/reference/integrations.md` (move from Planned to Implemented)
- [ ] **Documentation updated:** `docs/architecture/brownfield-architecture.md` (add to integrations)
- [ ] Environment variable `COMPANIES_HOUSE_API_KEY` added to `.env.example`

---

## Risk and Compatibility Check

### Minimal Risk Assessment

- **Primary Risk:** Companies House API rate limits in production usage
- **Mitigation:**
  - Implement caching to reduce API calls
  - Implement rate limit tracking and graceful degradation
  - Add queue system if needed for bulk lookups
- **Rollback:** Feature flag to disable Companies House lookup button

### Compatibility Verification

- [ ] Client creation wizard works with and without Companies House lookup
- [ ] No breaking changes to existing client creation flow
- [ ] Database schema compatible (no new required fields)
- [ ] UI changes follow existing Practice Hub design patterns
- [ ] No performance impact on non-UK clients

---

## Validation Checklist

### Scope Validation

- [x] Story scope is clear (implement Companies House integration)
- [x] Integration approach follows existing patterns (Xero-like)
- [x] Success criteria are measurable (API works, data maps correctly)
- [x] No architectural changes required

### Clarity Check

- [x] API client structure defined
- [x] Data mapping clearly specified
- [x] UI integration point identified
- [x] Rollback approach is simple (feature flag)

---

## Implementation Notes

### API Registration

1. Register at https://developer.company-information.service.gov.uk/
2. Create application for Practice Hub
3. Copy API key
4. Add to `.env.local`: `COMPANIES_HOUSE_API_KEY="your-key-here"`

### Testing Strategy

**Unit Tests:**
- Mock API responses
- Test data mapping
- Test error handling

**Integration Tests:**
- Use real Companies House sandbox API
- Test with known company numbers
- Test rate limiting

**Manual E2E Test:**
- Lookup "00000006" (BBC)
- Verify all data populates correctly
- Test error cases (invalid number, rate limit)

### Environment Variables

```bash
# .env.local
COMPANIES_HOUSE_API_KEY="your-api-key-here"

# .env.example
COMPANIES_HOUSE_API_KEY="get-from-https://developer.company-information.service.gov.uk/"
```

---

## Success Metrics

- **Functionality:** Successfully lookup UK companies by number
- **Accuracy:** Company data correctly populates all client fields
- **Performance:** Lookups complete in under 2 seconds
- **Reliability:** Error handling prevents crashes
- **Usage:** Track how many accountants use Companies House lookup

---

**Story Status:** Ready for Implementation (Depends on Story 1)
**Estimated Time:** 1-2 days
**Dependencies:** Story 1 (documentation baseline)
