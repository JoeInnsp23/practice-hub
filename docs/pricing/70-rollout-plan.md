# Rollout Plan: Pricing Engine & Proposal Workflow

**Date:** 2025-10-28
**Version:** 1.0 (Production-Ready)
**Timeline:** 8 weeks (phased rollout)
**Target ROI:** £75k-£151k annual benefit, <1 month payback

---

## Executive Summary

This plan details a **3-phase rollout** of the pricing engine with **gradual feature flag enablement** and **A/B testing** to minimize risk.

**Phases:**
- **Phase 1 (Weeks 1-2):** Quick Wins - Lead capture fields + schema changes
- **Phase 2 (Weeks 3-5):** Automation - Auto-service configuration
- **Phase 3 (Weeks 6-8):** Enhancement - Pricing preview UI

**Risk Mitigation:**
- Feature flags for gradual rollout (10% → 50% → 100%)
- A/B testing to measure impact
- Rollback triggers with automated alerting
- Staff training before each phase

**Success Criteria:**
- Proposal creation time: <1 minute (from 5-10 minutes)
- Auto-config accuracy: >90% staff approval
- Lead-to-client conversion: +5 percentage points

---

## Phase 1: Quick Wins (Weeks 1-2)

### Goals

1. ✅ Add missing pricing driver fields to leads schema
2. ✅ Enable transaction estimation for Model B pricing
3. ✅ Improve pricing accuracy by 30-40%
4. ✅ Train staff on new lead capture fields

### Timeline

| Week | Activity | Owner | Status |
|------|----------|-------|--------|
| **Week 1** | | | |
| Day 1-2 | Schema design + review | Backend Dev | ⏳ Pending |
| Day 3-4 | Implement schema changes in `lib/db/schema.ts` | Backend Dev | ⏳ Pending |
| Day 5 | Deploy schema to staging + test | Backend Dev | ⏳ Pending |
| **Week 2** | | | |
| Day 1-2 | Deploy schema to production (off-hours) | DevOps | ⏳ Pending |
| Day 3 | Update lead capture UI to include new fields | Frontend Dev | ⏳ Pending |
| Day 4 | Staff training session (new fields + usage) | Product Manager | ⏳ Pending |
| Day 5 | Monitor adoption + feedback | Product Manager | ⏳ Pending |

### Implementation Steps

#### 1.1 Schema Changes

**File:** `lib/db/schema.ts:1705-1773` (leads table)

**New Fields to Add:**
```typescript
export const leads = pgTable('leads', {
  // ... existing fields ...

  // Pricing drivers (GAP-001, GAP-002, GAP-003)
  monthlyTransactions: integer('monthly_transactions'),
  vatRegistered: boolean('vat_registered').default(false),
  propertyCount: integer('property_count').default(0),
  bankAccountsCount: integer('bank_accounts_count').default(0),
  booksCondition: varchar('books_condition', { length: 50 }), // 'clean', 'average', 'complex', 'disaster', 'unknown'
  currentAccountingSoftware: varchar('current_accounting_software', { length: 50 }),
  hasMultipleCurrencies: boolean('has_multiple_currencies').default(false),
  hasMultipleEntities: boolean('has_multiple_entities').default(false),
  entityCount: integer('entity_count').default(1),
  payrollFrequency: varchar('payroll_frequency', { length: 20 }), // 'weekly', 'fortnightly', '4weekly', 'monthly'
  cisRegistered: boolean('cis_registered').default(false),
  incomeStreamsCount: integer('income_streams_count').default(1)
});
```

**Deployment:**
```bash
# 1. Apply schema changes to staging
DATABASE_URL="<staging-url>" pnpm db:push

# 2. Verify schema in staging
psql <staging-url> -c "\d leads"

# 3. Apply to production (off-hours, Friday evening)
DATABASE_URL="<production-url>" pnpm db:push
```

**Rollback Plan:**
- If errors: Drop new columns via migration script
- Data loss risk: LOW (all fields nullable or have defaults)

---

#### 1.2 UI Updates

**Files to Update:**
- `app/practice-hub/leads/new/page.tsx` - Add form fields
- `components/ui/lead-form.tsx` - New field components
- `lib/validation/lead-schema.ts` - Zod validation

**New Form Fields:**
- Monthly Transactions (number input, optional)
- VAT Registered (checkbox)
- Property Count (number input, default: 0)
- Bank Accounts (number input, default: 0)
- Books Condition (select: clean, average, complex, disaster, unknown)
- Current Software (select: Xero, QuickBooks, Sage, Excel, None, Other)
- Multi-Currency (checkbox)
- Multi-Entity (checkbox)
- Entity Count (number input, shown if multi-entity checked)
- Payroll Frequency (select, shown if employees > 0)
- CIS Registered (checkbox)

**User Flow:**
1. Staff navigates to "New Lead"
2. Fills company details (unchanged)
3. Fills business details (existing fields)
4. **NEW:** Fills pricing driver fields (optional, with tooltips)
5. Saves lead → Fields stored in database

---

#### 1.3 Staff Training

**Training Session (1 hour):**
1. Why we added new fields (improve pricing accuracy)
2. How to fill each field (with examples)
3. What happens if fields are left blank (estimation fallback)
4. Demo: Create lead with new fields → Create proposal → See pricing

**Training Materials:**
- Slides: `/docs/guides/staff/pricing-fields-training.pdf` (create)
- Video: Screen recording of demo
- Quick reference card: Field definitions + examples

**Attendees:** All staff who create leads/proposals

---

### Success Metrics (Phase 1)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Field Completion Rate** | 0% (fields don't exist) | 70% | % of new leads with ≥5 new fields filled |
| **Pricing Accuracy** | Unknown | +30% | Staff override rate decreases |
| **Staff Satisfaction** | N/A | 8/10 | Post-training survey |

**Data Collection:**
- Log field completion rates in analytics
- Track pricing override frequency (staff manually adjusts auto-calculated price)
- Survey staff after 1 week

---

### Go/No-Go Decision (End of Week 2)

**Criteria to Proceed to Phase 2:**
- ✅ Schema deployed successfully (no errors)
- ✅ UI updates deployed and functional
- ✅ Staff training completed (≥80% attendance)
- ✅ Field completion rate ≥50% (stretch goal: 70%)
- ✅ No critical bugs reported

**Decision Maker:** Product Manager + Engineering Lead

---

## Phase 2: Automation (Weeks 3-5)

### Goals

1. ✅ Implement auto-service configuration (GAP-004)
2. ✅ Implement complexity estimation logic (GAP-003)
3. ✅ Reduce proposal creation time from 5-10 min to <1 min
4. ✅ Achieve >90% auto-config accuracy

### Timeline

| Week | Activity | Owner | Status |
|------|----------|-------|--------|
| **Week 3** | | | |
| Day 1-3 | Implement `autoMapLeadToServices()` function | Backend Dev | ⏳ Pending |
| Day 4-5 | Implement `estimateComplexity()` function | Backend Dev | ⏳ Pending |
| **Week 4** | | | |
| Day 1-2 | Write unit tests (target: 90% coverage) | Backend Dev | ⏳ Pending |
| Day 3 | Add `createFromLeadAuto` tRPC procedure | Backend Dev | ⏳ Pending |
| Day 4 | Update UI: "Create Proposal (Auto)" button | Frontend Dev | ⏳ Pending |
| Day 5 | Deploy to staging + internal testing | QA Team | ⏳ Pending |
| **Week 5** | | | |
| Day 1 | Enable feature flag for 1 test tenant | DevOps | ⏳ Pending |
| Day 2-3 | Monitor accuracy + collect feedback | Product Manager | ⏳ Pending |
| Day 4 | Enable for 50% of tenants (A/B test) | DevOps | ⏳ Pending |
| Day 5 | Review metrics + decide on 100% rollout | Product Manager | ⏳ Pending |

### Implementation Steps

#### 2.1 Auto-Service Configuration Logic

**File:** `app/server/utils/auto-service-config.ts` (new)

**Pseudo-code:**
```typescript
export async function autoMapLeadToServices(lead: Lead): Promise<ServiceConfig[]> {
  const services: ServiceConfig[] = [];

  // Rule 1: Interested services
  if (lead.interestedServices.includes('COMP_ACCOUNTS')) {
    services.push({
      serviceId: 'COMP_ACCOUNTS',
      quantity: 1,
      frequency: 'annual',
      config: {
        complexity: await estimateComplexity(lead)
      }
    });
  }

  // Rule 2: Employees → Payroll
  if (lead.estimatedEmployees > 0) {
    services.push({
      serviceId: 'PAYROLL_STANDARD',
      quantity: 1,
      frequency: lead.payrollFrequency || 'monthly',
      config: {
        employees: lead.estimatedEmployees,
        frequency: lead.payrollFrequency || 'monthly'
      }
    });
  }

  // Rule 3: Properties → Rental addon
  if (lead.propertyCount > 0) {
    services.push({
      serviceId: 'ADDON_RENTAL',
      quantity: lead.propertyCount,
      frequency: 'annual'
    });
  }

  // Rule 4: VAT registered → VAT Returns
  if (lead.vatRegistered) {
    services.push({
      serviceId: 'VAT_RETURNS',
      quantity: 1,
      frequency: 'quarterly'
    });
  }

  // Rule 5: CIS registered → CIS addon
  if (lead.cisRegistered) {
    services.push({
      serviceId: 'ADDON_CIS',
      quantity: 1,
      frequency: 'monthly'
    });
  }

  // Rule 6: Bookkeeping (estimate level from transactions/accounts)
  if (lead.interestedServices.includes('BOOK_BASIC') || lead.interestedServices.includes('BOOK_FULL')) {
    const level = estimateBookkeepingLevel(lead);
    services.push({
      serviceId: level,
      quantity: 1,
      frequency: 'monthly',
      config: {
        transactions: lead.monthlyTransactions || await estimateTransactions(lead)
      }
    });
  }

  return services;
}
```

**Location:** `app/server/utils/auto-service-config.ts`

---

#### 2.2 Complexity Estimation Logic

**File:** `app/server/utils/estimate-complexity.ts` (new)

**Pseudo-code:**
```typescript
export function estimateComplexity(lead: Lead): ComplexityLevel {
  let score = 0;

  // Factor 1: Books condition (weight: 0.5)
  const booksScores = {
    clean: 1,
    average: 2,
    complex: 3,
    disaster: 4,
    unknown: 2
  };
  score += (booksScores[lead.booksCondition] || 2) * 0.5;

  // Factor 2: Software (weight: 0.2)
  const softwareScores = {
    xero: 1,
    quickbooks: 2,
    sage: 2,
    excel: 3,
    none: 4,
    other: 2
  };
  score += (softwareScores[lead.currentAccountingSoftware] || 2) * 0.2;

  // Factor 3: Transactions (weight: 0.15)
  const txn = lead.monthlyTransactions || estimateTransactions(lead);
  if (txn <= 50) score += 1 * 0.15;
  else if (txn <= 150) score += 2 * 0.15;
  else if (txn <= 300) score += 3 * 0.15;
  else score += 4 * 0.15;

  // Factor 4: Multi-currency (weight: 0.1)
  if (lead.hasMultipleCurrencies) score += 1 * 0.1;

  // Factor 5: Multi-entity (weight: 0.05)
  if (lead.hasMultipleEntities) score += 1 * 0.05;

  // Map score to complexity level
  if (score <= 1.5) return 'clean';
  if (score <= 2.5) return 'average';
  if (score <= 3.5) return 'complex';
  return 'disaster';
}
```

**Location:** `app/server/utils/estimate-complexity.ts`

---

#### 2.3 Feature Flag Configuration

**File:** `config/feature-flags.ts` (new)

```typescript
export const featureFlags = {
  pricing: {
    autoServiceConfig: {
      enabled: process.env.FEATURE_AUTO_SERVICE_CONFIG === 'true',
      rolloutPercentage: parseInt(process.env.AUTO_SERVICE_CONFIG_ROLLOUT || '0'),
      allowedTenants: process.env.AUTO_SERVICE_CONFIG_TENANTS?.split(',') || []
    }
  }
};

export function isFeatureEnabled(feature: string, tenantId: string): boolean {
  const config = featureFlags.pricing.autoServiceConfig;

  // Check if globally enabled
  if (!config.enabled) return false;

  // Check if tenant is in allowed list (early access)
  if (config.allowedTenants.length > 0) {
    return config.allowedTenants.includes(tenantId);
  }

  // Check rollout percentage (A/B test)
  const hash = hashCode(tenantId);
  return (hash % 100) < config.rolloutPercentage;
}
```

**Environment Variables:**
- `FEATURE_AUTO_SERVICE_CONFIG=true` (enable feature)
- `AUTO_SERVICE_CONFIG_ROLLOUT=10` (10% of tenants)
- `AUTO_SERVICE_CONFIG_TENANTS=tenant_test_1,tenant_test_2` (specific tenants for early access)

---

#### 2.4 UI Updates

**File:** `app/practice-hub/proposals/new/page.tsx`

**Changes:**
- Add "Create Proposal (Auto)" button next to "Create Proposal"
- Button only shown if feature flag enabled
- Clicking auto button:
  1. Calls `proposals.createFromLeadAuto` tRPC procedure
  2. Services auto-populated in form
  3. Staff can review and adjust before saving

**User Flow:**
1. Staff views lead detail page
2. Clicks "Create Proposal (Auto)"
3. Proposal form opens with services pre-selected
4. Staff reviews:
   - Services (can add/remove)
   - Quantities (can adjust)
   - Complexity (can override)
5. Clicks "Save Proposal"
6. Proposal created in <1 minute (vs 5-10 min manual)

---

### A/B Testing Strategy (Week 5)

**Hypothesis:** Auto-service configuration will reduce proposal creation time and improve staff efficiency without sacrificing accuracy.

**Test Groups:**
- **Control (50%):** Manual service selection (existing flow)
- **Treatment (50%):** Auto-service configuration (new flow)

**Randomization:** Hash tenant ID, route 50% to treatment

**Metrics to Track:**
| Metric | Control | Treatment | Target |
|--------|---------|-----------|--------|
| Proposal creation time | 5-10 min | ? | <1 min |
| Auto-config accuracy | N/A | ? | >90% |
| Staff approval rate | N/A | ? | >90% |
| Services per proposal | ? | ? | Similar |

**Duration:** 5 business days (Week 5)

**Data Collection:**
```typescript
// Log event when proposal created
analytics.track('proposal_created', {
  tenantId,
  userId,
  method: 'auto' | 'manual',
  duration_seconds,
  services_count,
  manually_adjusted: true | false
});
```

**Analysis:**
- Compare avg proposal creation time
- Calculate auto-config accuracy (% of proposals not manually adjusted)
- Survey staff satisfaction (Control vs Treatment)

---

### Success Metrics (Phase 2)

| Metric | Baseline | Target | Actual |
|--------|----------|--------|--------|
| **Proposal Creation Time** | 5-10 min | <1 min | TBD |
| **Auto-Config Accuracy** | N/A | >90% | TBD |
| **Staff Approval Rate** | N/A | >90% | TBD |
| **Services Per Proposal** | 2.5 avg | 2.5 avg | TBD |

**Go-Live Decision (End of Week 5):**
- ✅ Proposal creation time <1 min
- ✅ Auto-config accuracy >90%
- ✅ Staff approval rate >90%
- ✅ No increase in proposal errors

**If Metrics NOT Met:**
- Extend A/B test for 1 more week
- Collect qualitative feedback from staff
- Adjust auto-config rules based on feedback
- Re-test

---

### Rollback Plan (Phase 2)

**Trigger Conditions:**
- Auto-config accuracy <80%
- Staff complaints >20%
- Increase in proposal errors >10%

**Rollback Procedure:**
1. Set `FEATURE_AUTO_SERVICE_CONFIG=false`
2. Restart app servers (zero-downtime)
3. Notify staff via Slack: "Auto-config temporarily disabled"
4. Investigate root cause (logs, staff feedback)
5. Fix issues, re-test in staging
6. Re-enable feature flag gradually (10% → 50% → 100%)

**Estimated Rollback Time:** 15 minutes

---

## Phase 3: Enhancement (Weeks 6-8)

### Goals

1. ✅ Implement pricing preview in lead capture flow
2. ✅ Increase lead-to-proposal conversion by +5 percentage points
3. ✅ Increase lead-to-client conversion by +5 percentage points
4. ✅ Improve user experience for leads (instant pricing feedback)

### Timeline

| Week | Activity | Owner | Status |
|------|----------|-------|--------|
| **Week 6** | | | |
| Day 1-3 | Implement pricing preview component | Frontend Dev | ⏳ Pending |
| Day 4 | Integrate with lead capture form | Frontend Dev | ⏳ Pending |
| Day 5 | Deploy to staging + internal testing | QA Team | ⏳ Pending |
| **Week 7** | | | |
| Day 1 | Enable for 1 test tenant | DevOps | ⏳ Pending |
| Day 2-3 | Monitor conversion + collect feedback | Product Manager | ⏳ Pending |
| Day 4 | Enable for 50% of traffic (A/B test) | DevOps | ⏳ Pending |
| Day 5 | Review metrics | Product Manager | ⏳ Pending |
| **Week 8** | | | |
| Day 1-2 | Adjust based on feedback | Frontend Dev | ⏳ Pending |
| Day 3 | Enable for 100% of traffic | DevOps | ⏳ Pending |
| Day 4-5 | Final monitoring + documentation | Product Manager | ⏳ Pending |

### Implementation Steps

#### 3.1 Pricing Preview Component

**File:** `components/pricing-preview.tsx` (new)

**Design:**
- Sticky sidebar on lead capture form (right side)
- Real-time pricing calculation as user fills form
- Shows:
  - Estimated monthly cost (range: £X-£Y)
  - Breakdown by service
  - Model recommendation (if applicable)
  - CTA: "Get Accurate Quote" → submit form

**User Flow:**
1. Lead visits lead capture form
2. Fills turnover field → Pricing preview appears
3. Selects services → Pricing updates
4. Fills employees → Payroll price appears
5. Sees total: "Estimated monthly cost: £120-£150"
6. Clicks "Get Accurate Quote" → Submits form

**Implementation:**
```typescript
'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';

export function PricingPreview({ formData }: { formData: LeadFormData }) {
  const { data: pricing } = trpc.pricing.calculate.useQuery({
    turnover: formData.estimatedTurnover,
    complexity: formData.booksCondition || 'average',
    industry: formData.industry,
    services: formData.interestedServices.map(s => ({
      serviceId: s,
      quantity: 1
    }))
  }, {
    enabled: !!formData.estimatedTurnover && formData.interestedServices.length > 0
  });

  if (!pricing) return null;

  return (
    <div className="sticky top-20 glass-card p-6">
      <h3 className="font-semibold mb-4">Estimated Pricing</h3>
      <div className="space-y-2">
        {pricing.services.map(s => (
          <div key={s.serviceId} className="flex justify-between text-sm">
            <span>{s.name}</span>
            <span className="font-medium">£{s.priceA}/mo</span>
          </div>
        ))}
      </div>
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between font-semibold">
          <span>Estimated Monthly Cost</span>
          <span className="text-primary">£{pricing.totals.total}</span>
        </div>
      </div>
      <button className="w-full mt-6 btn-primary">
        Get Accurate Quote →
      </button>
    </div>
  );
}
```

---

#### 3.2 Feature Flag Configuration

**Environment Variables:**
- `FEATURE_PRICING_PREVIEW=true`
- `PRICING_PREVIEW_ROLLOUT=0` (start at 0%, gradually increase)

**Rollout Strategy:**
- Week 7 Day 1: 10% (monitor)
- Week 7 Day 4: 50% (A/B test)
- Week 8 Day 3: 100% (full rollout)

---

### A/B Testing Strategy (Week 7)

**Hypothesis:** Pricing preview will increase lead-to-proposal conversion by showing instant value.

**Test Groups:**
- **Control (50%):** No pricing preview (existing form)
- **Treatment (50%):** Pricing preview shown (new component)

**Randomization:** Cookie-based (not tenant-based, since leads are not yet tenants)

**Metrics to Track:**
| Metric | Control | Treatment | Target |
|--------|---------|-----------|--------|
| Lead submission rate | ? | ? | +5% |
| Lead-to-proposal rate | 60% | ? | +5% |
| Avg time on form | ? | ? | Similar |
| Form completion rate | ? | ? | Similar or higher |

**Duration:** 5 business days (Week 7)

---

### Success Metrics (Phase 3)

| Metric | Baseline | Target | Actual |
|--------|----------|--------|--------|
| **Lead Submission Rate** | 100% (no change expected) | 105% | TBD |
| **Lead-to-Proposal Rate** | 60% | 65% | TBD |
| **Lead-to-Client Rate** | 18% | 23% | TBD |
| **Time on Form** | 3 min | 3 min | TBD |

**Go-Live Decision (End of Week 7):**
- ✅ Lead-to-proposal conversion +5% (or statistically significant improvement)
- ✅ No decrease in form completion rate
- ✅ No increase in pricing errors

---

### Rollback Plan (Phase 3)

**Trigger Conditions:**
- Lead-to-proposal conversion decreases >5%
- Form completion rate decreases >10%
- Pricing preview errors >5%

**Rollback Procedure:**
1. Set `FEATURE_PRICING_PREVIEW=false`
2. Deploy updated config (no app restart needed)
3. Notify marketing team
4. Investigate root cause
5. Fix and re-test

**Estimated Rollback Time:** 5 minutes

---

## Monitoring & Alerts

### Dashboard Metrics

**Create Dashboard:** "Pricing Engine Rollout"

**Widgets:**
1. **Proposal Creation Time** (line chart, daily)
   - Avg time per proposal
   - Target: <1 min
   - Alert if >2 min for 3+ days

2. **Auto-Config Accuracy** (percentage, daily)
   - % of proposals not manually adjusted
   - Target: >90%
   - Alert if <80%

3. **Conversion Funnel** (bar chart, weekly)
   - Lead → Proposal → Sent → Signed → Client
   - Show conversion % at each stage
   - Alert if any stage drops >5%

4. **Error Rate** (line chart, hourly)
   - Pricing calculation errors
   - DocuSeal API errors
   - Alert if >5% error rate

5. **Feature Flag Status** (indicator)
   - Current rollout % for each feature
   - Show current state (enabled/disabled)

**Tool:** Use Sentry Performance Monitoring, Grafana, or custom analytics dashboard

---

### Alerts Configuration

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| **High Error Rate** | Pricing errors >5% for 15 min | Critical | Slack + PagerDuty |
| **Low Auto-Config Accuracy** | <80% for 24 hours | High | Slack notification |
| **Conversion Drop** | Any funnel stage drops >5% | High | Email to Product Manager |
| **DocuSeal API Down** | API errors >50% for 5 min | Critical | Slack + PagerDuty |
| **Proposal Creation Time** | Avg >2 min for 3 days | Medium | Email to Engineering Lead |

**Tool:** Sentry alerts + Slack webhooks

---

## Communication Plan

### Internal Communication

**Stakeholders:**
- **Leadership:** CEO, Finance Director
- **Staff:** Practice Manager, all staff who create proposals
- **Engineering:** Engineering Lead, Backend/Frontend Devs, QA
- **Product:** Product Manager

**Communication Schedule:**

| Phase | Audience | Message | Channel | Timing |
|-------|----------|---------|---------|--------|
| **Pre-Phase 1** | Leadership | Kickoff: Goals, timeline, ROI | Email + Meeting | Week 0 |
| **Phase 1 Start** | Staff | New lead capture fields available | Slack + Training | Week 2 Day 4 |
| **Phase 1 End** | Leadership | Phase 1 complete, metrics | Email | Week 2 Day 5 |
| **Phase 2 Start** | Staff | Auto-config feature available (50% rollout) | Slack | Week 5 Day 4 |
| **Phase 2 End** | All | Phase 2 complete, proposal time reduced | Email + Slack | Week 5 Day 5 |
| **Phase 3 Start** | Marketing | Pricing preview enabled (50% traffic) | Meeting | Week 7 Day 4 |
| **Phase 3 End** | All | Rollout complete, success metrics | Email + All-Hands | Week 8 Day 5 |

---

### External Communication (Optional)

**Website Update (Phase 3):**
- Add "Instant Pricing Estimate" badge to lead capture form
- Update marketing copy to highlight transparency
- Blog post: "How we price our services (and why we show it upfront)"

**Client Communication:**
- Email to existing clients: "We've improved our proposal process"
- Highlight faster turnaround times

---

## Risk Management

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Schema migration failures** | Low | High | Test in staging first, deploy off-hours, rollback script ready |
| **Auto-config inaccuracy** | Medium | Medium | A/B test with 50% rollout, rollback if <90% accuracy |
| **DocuSeal API downtime during rollout** | Low | High | Monitor API health, delay send operations if down |
| **Staff resistance to new fields** | Medium | Low | Training session, emphasize benefits, make fields optional |
| **Pricing preview confuses leads** | Low | Medium | A/B test, monitor form completion rate, add tooltips |
| **Performance degradation (pricing calc)** | Low | Medium | Load test before rollout, Redis cache ready |

---

## Success Criteria (Overall)

### Phase 1 Success

- ✅ Schema deployed successfully
- ✅ Field completion rate ≥50%
- ✅ No critical bugs
- ✅ Staff trained

### Phase 2 Success

- ✅ Proposal creation time <1 min
- ✅ Auto-config accuracy >90%
- ✅ Staff approval rate >90%

### Phase 3 Success

- ✅ Lead-to-proposal conversion +5%
- ✅ No decrease in form completion
- ✅ Pricing preview errors <5%

### Overall Success

- ✅ All phases complete
- ✅ All success metrics met
- ✅ No rollbacks required
- ✅ ROI achieved (proposal time reduced, conversion improved)

---

## Post-Rollout Activities

### Week 9: Optimization

- **Activity:** Analyze metrics, identify bottlenecks
- **Owner:** Product Manager + Engineering Lead
- **Deliverables:**
  - Optimization backlog (Jira tickets)
  - Performance improvements (if needed)
  - UI/UX refinements based on feedback

### Week 10: Documentation

- **Activity:** Update all documentation
- **Owner:** Product Manager
- **Deliverables:**
  - Final rollout report
  - Lessons learned document
  - Staff handbook updates
  - Knowledge base articles

### Ongoing: Monitoring & Iteration

- **Activity:** Monitor metrics, iterate on auto-config rules
- **Owner:** Product Manager
- **Frequency:** Monthly review
- **Actions:**
  - Adjust auto-config rules if accuracy drops
  - Add new services to auto-config
  - Refine complexity estimation logic

---

## References

- **Executive Brief:** `00-exec-brief.md`
- **Pricing Model:** `30-pricing-model.md`
- **Quote Workflow:** `40-quote-workflow.md`
- **Readiness Checklist:** `45-readiness-checklist.md`
- **Test Plan:** `50-test-plan.md`
- **Gaps Analysis:** `55-gaps.md`
- **Decisions Log:** `60-decisions.md`

---

**End of Rollout Plan**
