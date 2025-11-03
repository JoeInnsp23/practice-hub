# Gaps Analysis

**Date:** 2025-10-28
**Status:** Complete codebase scan + market research analysis

---

## Executive Summary

The Practice Hub has a **robust pricing engine** (two-model calculation, DocuSeal e-signature, comprehensive service catalog) but **limited lead capture** prevents automatic pricing and service pre-selection. The primary gaps are **missing pricing driver fields** in the lead capture flow.

**Critical Impact:** Manual proposal creation is slow; leads don't see pricing previews; Model B (transaction-based) pricing unavailable for new leads.

---

## CRITICAL GAPS (High Priority)

### GAP-001: Transaction Data Not Captured in Leads
**Evidence:** `lib/db/schema.ts:1705-1773` - Lead schema missing `monthlyTransactions` field
**Location:** Lead capture form `/root/projects/practice-hub/app/(public)/lead-capture/page.tsx`

**Impact:**
- Model B pricing calculation **unavailable** for new leads
- System falls back to Model A (turnover-based) only
- Less accurate pricing for transaction-heavy businesses
- Cannot demonstrate per-transaction pricing benefits

**Recommendation:**
```typescript
// Add to lead schema
monthlyTransactions?: number; // Optional with "I don't know" option
transactionEstimateSource?: 'manual' | 'estimated' | 'unknown';
```

**Priority:** **HIGH** - Affects 50% of pricing calculations

---

### GAP-002: VAT Registration Flag Missing in Leads
**Evidence:** `lib/db/schema.ts:1705-1773` - Lead schema missing `vatRegistered`
**Note:** Clients table **has** `vatRegistered` (line 612) but leads don't

**Impact:**
- Transaction estimation formula less accurate (missing 1.2x multiplier)
- Cannot auto-add VAT returns service
- Cannot pre-calculate VAT compliance costs

**Recommendation:**
```typescript
// Add to lead schema
vatRegistered?: boolean;
vatNumber?: string; // Optional for validation
```

**Priority:** **HIGH** - Affects transaction estimation accuracy

---

### GAP-003: No Complexity Indicators in Lead Capture
**Evidence:** Complexity field only in service config, not in lead form

**Impact:**
- Cannot auto-recommend complexity level (`clean`, `average`, `complex`, `disaster`)
- Manual assessment required for every proposal
- Pricing accuracy reduced (complexity multipliers: 0.95x to 1.4x)

**Recommendation:**
```typescript
// Add to lead schema
booksCondition?: 'clean' | 'average' | 'needs_cleanup' | 'disaster_recovery' | 'unknown';
hasCleanRecords?: boolean;
currentAccountingSoftware?: 'xero' | 'quickbooks' | 'sage' | 'excel' | 'none' | 'other';
```

**Priority:** **HIGH** - Affects all pricing calculations (multipliers up to 1.4x)

---

### GAP-004: No Auto-Service Configuration from Lead
**Evidence:** `app/server/routers/proposals.ts:447-547` - `proposals.createFromLead` sets services to empty array

**Impact:**
- Manual service selection required for every proposal
- Slow proposal creation (5-10 minutes vs <1 minute automated)
- Inconsistent service recommendations
- Lost conversion opportunity (leads don't see relevant services)

**Recommendation:**
```typescript
// Implement auto-mapping logic
const autoMapLeadToServices = (lead: Lead): ServiceConfig[] => {
  const services: ServiceConfig[] = [];

  // Core services based on interestedServices
  if (lead.interestedServices.includes('COMP_ACCOUNTS')) {
    services.push({ code: 'COMP_ACCOUNTS', complexity: estimateComplexity(lead) });
  }

  // Auto-add based on data
  if (lead.estimatedEmployees > 0) {
    services.push({
      code: 'PAYROLL_STANDARD',
      config: { employees: lead.estimatedEmployees }
    });
  }

  if (lead.propertyCount && lead.propertyCount > 0) {
    services.push({
      code: 'ADDON_RENTAL',
      config: { properties: lead.propertyCount }
    });
  }

  return services;
};
```

**Priority:** **CRITICAL** - Directly impacts sales velocity

---

### GAP-005: No Pricing Preview in Lead Capture
**Evidence:** Lead capture form `/root/projects/practice-hub/app/(public)/lead-capture/page.tsx` has no pricing display

**Impact:**
- Leads submit form without knowing estimated cost
- Higher bounce rate on follow-up
- Lost conversion opportunity (no "wow factor")
- Competitors with instant pricing have advantage

**Recommendation:**
- Add pricing preview after Step 1 (company details)
- Show estimated monthly/annual range
- Highlight services included
- "Get Accurate Quote" CTA to complete form

**Priority:** **HIGH** - Affects lead conversion rate

---

## MODERATE GAPS (Medium Priority)

### GAP-006: No Rental Property Count in Leads
**Evidence:** `propertiesCount` field missing from lead schema
**Service Exists:** `ADDON_RENTAL` defined in service catalog

**Impact:**
- Cannot auto-add rental addon (£12/property in market data)
- Manual input required

**Recommendation:**
```typescript
propertyCount?: number; // For landlords with rental properties
```

**Priority:** MEDIUM

---

### GAP-007: No Bank Account Count in Leads
**Evidence:** `bankAccountsCount` field missing

**Impact:**
- Cannot estimate bookkeeping complexity
- Bookkeeping services priced without account count factor

**Recommendation:**
```typescript
bankAccountsCount?: number; // Typically 1-3 for small businesses
```

**Priority:** MEDIUM - Affects bookkeeping pricing accuracy

---

### GAP-008: No Accounting Software Field
**Evidence:** No `currentSoftware` field in lead or client schema

**Impact:**
- Cannot determine Xero/QuickBooks integration eligibility
- Cannot assess migration complexity
- Cannot pre-configure software integrations

**Recommendation:**
```typescript
currentAccountingSoftware?: 'xero' | 'quickbooks' | 'sage' | 'freeagent' | 'excel' | 'none' | 'other';
otherSoftware?: string; // If 'other' selected
```

**Priority:** MEDIUM - Useful for service scoping

---

### GAP-009: No Multi-Currency Flag
**Evidence:** No `multiCurrency` field in schema

**Impact:**
- Cannot detect international trading complexity
- Bookkeeping/VAT complexity under-estimated

**Recommendation:**
```typescript
hasMultipleCurrencies?: boolean;
primaryCurrency?: string; // Default 'GBP'
```

**Priority:** MEDIUM - Affects complexity for international businesses

---

### GAP-010: No Multi-Entity Flag
**Evidence:** No `multiEntity` or group structure fields

**Impact:**
- Cannot identify group structures early
- Group accounts service not auto-recommended

**Recommendation:**
```typescript
hasMultipleEntities?: boolean;
entityCount?: number;
```

**Priority:** MEDIUM - Affects group structures

---

## MINOR GAPS (Low Priority)

### GAP-011: No Payroll Frequency in Leads
**Evidence:** Payroll frequency only in service config

**Impact:**
- Manual input required for payroll pricing
- Frequency multipliers not applied automatically

**Recommendation:**
```typescript
payrollFrequency?: 'weekly' | 'fortnightly' | '4weekly' | 'monthly';
```

**Priority:** LOW - Easy to ask during service configuration

---

### GAP-012: No Income Streams Count
**Evidence:** `incomeStreamsCount` not in schema

**Impact:**
- Cannot assess SA complexity for directors/landlords

**Recommendation:**
```typescript
incomeStreamsCount?: number; // For SATR complexity
```

**Priority:** LOW

---

### GAP-013: No CIS Registration Flag
**Evidence:** No `cisRegistered` field

**Impact:**
- Cannot auto-add CIS addon for construction industry

**Recommendation:**
```typescript
cisRegistered?: boolean; // Construction Industry Scheme
```

**Priority:** LOW - Industry-specific

---

### GAP-014: No Lead Qualification Thresholds
**Evidence:** `calculateLeadScore` in `lib/lead-scoring/calculate-score.ts:19` calculated but no threshold logic

**Impact:**
- All leads treated equally
- No prioritization workflow

**Recommendation:**
```typescript
// Define thresholds
const LEAD_QUALITY_THRESHOLDS = {
  hot: 80, // >80 = hot lead (immediate follow-up)
  warm: 60, // 60-80 = warm lead (24h follow-up)
  cold: 40, // 40-60 = cold lead (48h follow-up)
  disqualified: 0 // <40 = disqualified
};
```

**Priority:** LOW - Process improvement, not pricing

---

### GAP-015: No Pricing Configuration Export
**Evidence:** No export functionality in pricing router

**Impact:**
- Cannot bulk-edit pricing rules
- Manual updates required

**Recommendation:**
- Add `pricing.exportRules()` procedure
- Add `pricing.importRules()` procedure with validation

**Priority:** LOW - Admin convenience feature

---

## SYSTEM-LEVEL GAPS

### GAP-016: No Multi-Currency Support
**Evidence:** GBP hardcoded throughout (252 occurrences of `£`)

**Impact:**
- Cannot serve international clients
- Limited to UK market only

**Recommendation:**
- Add `currency` field to proposals/clients
- Create currency conversion service
- Update all pricing displays to use dynamic currency symbol

**Priority:** LOW (unless international expansion planned)

---

### GAP-017: No Multi-Region Support
**Evidence:** UK tax compliance hardcoded (VAT, PAYE, Companies House references)

**Impact:**
- Cannot serve non-UK businesses

**Recommendation:**
- Add `region` field to tenants/clients
- Create region-specific compliance service catalogs
- Conditional UI based on region

**Priority:** LOW (UK-only for now)

---

## SUMMARY TABLE

| Gap ID | Description | Priority | Effort | Impact | Owner Area |
|--------|-------------|----------|--------|--------|------------|
| GAP-001 | Transaction data not captured | **HIGH** | Small | High | Lead Capture |
| GAP-002 | VAT registration missing | **HIGH** | Small | High | Lead Capture |
| GAP-003 | No complexity indicators | **HIGH** | Medium | High | Lead Capture |
| GAP-004 | No auto-service config | **CRITICAL** | Large | Critical | Proposals Router |
| GAP-005 | No pricing preview | **HIGH** | Medium | High | Lead Capture UI |
| GAP-006 | No rental property count | MEDIUM | Small | Medium | Lead Capture |
| GAP-007 | No bank account count | MEDIUM | Small | Medium | Lead Capture |
| GAP-008 | No accounting software field | MEDIUM | Small | Medium | Lead Capture |
| GAP-009 | No multi-currency flag | MEDIUM | Small | Low | Lead Capture |
| GAP-010 | No multi-entity flag | MEDIUM | Small | Low | Lead Capture |
| GAP-011 | No payroll frequency | LOW | Small | Low | Lead Capture |
| GAP-012 | No income streams count | LOW | Small | Low | Lead Capture |
| GAP-013 | No CIS registration | LOW | Small | Low | Lead Capture |
| GAP-014 | No qualification thresholds | LOW | Medium | Low | Lead Scoring |
| GAP-015 | No pricing config export | LOW | Medium | Low | Admin Tools |
| GAP-016 | No multi-currency support | LOW | X-Large | Low | Platform |
| GAP-017 | No multi-region support | LOW | X-Large | Low | Platform |

**Total Critical/High Gaps:** 5
**Total Medium Gaps:** 5
**Total Low Gaps:** 7

---

## RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Quick Wins (Week 1-2)
1. **GAP-001**: Add `monthlyTransactions` field to lead schema + form
2. **GAP-002**: Add `vatRegistered` field to lead schema + form
3. **GAP-006**: Add `propertyCount` field
4. **GAP-007**: Add `bankAccountsCount` field

**Effort:** 2-3 days
**Impact:** Enables Model B pricing, improves estimation accuracy

---

### Phase 2: Complexity Assessment (Week 3)
5. **GAP-003**: Add complexity indicator fields + estimation logic

**Effort:** 3-5 days
**Impact:** Automatic complexity multiplier application

---

### Phase 3: Automation (Week 4-5)
6. **GAP-004**: Implement auto-service configuration from lead
7. **GAP-005**: Build pricing preview UI component

**Effort:** 1-2 weeks
**Impact:** **Massive** - 10x faster proposal creation, better lead conversion

---

### Phase 4: Polish (Week 6+)
8. Remaining medium/low priority gaps as needed

---

**End of Gaps Analysis**
