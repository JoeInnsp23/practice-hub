# Decision Log

**Date:** 2025-10-28
**Purpose:** Document all DECISION NEEDED items requiring stakeholder approval

---

## DEC-001: Currency & Region Confirmation ⚠️ **REQUIRED**

**Context:**
Codebase analysis detected **252 occurrences of `£` symbol**, UK tax references (VAT, PAYE, Companies House, HMRC), and UK phone formats. Market research conducted for UK pricing only.

**Evidence:**
- `lib/pdf/proposal-template.tsx` - Hardcoded `£` symbols
- `docs/guides/integrations/microsoft-oauth.md` - UK compliance
- `lib/docuseal/uk-compliance-fields.ts` - UK-specific e-signature fields

**Current State:** **UK/GBP only**

**Options:**

| Option | Description | Pros | Cons | Effort |
|--------|-------------|------|------|--------|
| **A. Confirm UK/GBP Only** | System remains UK-only, GBP hardcoded | ✅ No changes<br>✅ Faster to market<br>✅ Focused pricing | ❌ Limits international expansion<br>❌ Cannot serve UK expats/multinationals | None |
| **B. Add Multi-Currency Support** | Add `currency` field, conversion service | ✅ International expansion ready<br>✅ Serves multinationals | ❌ 4-6 weeks dev effort<br>❌ Exchange rate complexity<br>❌ Pricing data needed for each currency | X-Large |
| **C. Defer to V2** | Ship UK-only, plan international later | ✅ Fast MVP<br>✅ Validate UK market first | ❌ Refactor cost later | None now |

**Recommended:** **Option A - Confirm UK/GBP Only** (with plan to revisit in 6-12 months based on demand)

**Rationale:**
- All market research is UK-specific
- No international demand signal yet
- Faster time-to-market
- Easy to add later if needed

**Decision Required:** **Approve Option A** ✅ / Select Alternative ___

**Impact:** Determines pricing research scope, schema design, UI labels

---

## DEC-002: Pricing Model Adoption ⚠️ **REQUIRED**

**Context:**
Practice Hub currently has **Model A (turnover-based)** and **Model B (transaction-based)** with automatic recommendation logic. Market research shows competitors use various approaches.

**Current Implementation:** `app/server/routers/pricing.ts:548-587`

**Market Research Findings:**
- **60%** of UK firms use turnover bands
- **25%** use per-transaction pricing
- **15%** use hourly rates or custom quotes

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Keep Dual-Model System** | Current Model A + Model B with auto-recommendation | ✅ Already implemented<br>✅ Gives clients choice<br>✅ Competitive advantage | ❌ Complex to explain<br>❌ May confuse leads |
| **B. Simplify to Turnover-Only** | Remove Model B, use turnover bands only | ✅ Simpler UX<br>✅ Market standard<br>✅ Easier lead capture | ❌ Less accurate for high-txn businesses<br>❌ Lose competitive feature |
| **C. Hybrid Tiered Packages** | Pre-defined packages (Essentials/Standard/Plus) | ✅ Simple for leads<br>✅ Easy to market | ❌ Less flexible<br>❌ Requires new package definitions |

**Recommended:** **Option A - Keep Dual-Model System**

**Rationale:**
- Already built and tested
- Provides better accuracy for diverse clients
- Shows pricing sophistication
- Recommendation engine reduces confusion

**Modifications Suggested:**
- Rename "Model A" → "Turnover-Based Pricing"
- Rename "Model B" → "Transaction-Based Pricing"
- Add explanatory tooltips in UI

**Decision Required:** **Approve Option A** ✅ / Select Alternative ___

---

## DEC-003: Discount Policy 🎯

**Context:**
Current system has volume discounts hardcoded in `app/server/routers/pricing.ts:189-253`:
- 5% over £500/month
- Additional 3% over £1000/month
- Rush fee: +25%
- New client: -10%
- Custom: configurable %

**Market Research:**
- Most firms don't publish discounts
- Some offer "first 3 months half price" (promotional)
- Annual payment discounts common (5-10%)

**Options:**

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **A. Keep Current Discounts** | Volume + new client + rush | ✅ Transparent, rewards larger clients |
| **B. Remove All Discounts** | List price only | Simplifies pricing, avoids discount expectations |
| **C. Add Annual Payment Discount** | 10% off if paid annually | Industry standard, improves cash flow |
| **D. First 3 Months Promo** | 50% off first 3 months | Competitive for new client acquisition |

**Recommended:** **A + C** (Keep current + add annual payment discount)

**Rationale:**
- Volume discounts reward larger clients (retention)
- Annual payment discount standard practice
- Rush fee justified for expedited work

**Decision Required:** Confirm recommendation or specify alternative

---

## DEC-004: Rounding Rules 💷

**Context:**
Practice Hub code does not specify rounding rules. Market data shows varied approaches.

**Market Research:**
- **Round to nearest £5**: Common for monthly fees (e.g., £95, £120, £145)
- **Round to nearest £10**: Common for annual packages
- **No rounding**: Exact calculations (e.g., £1,247.38)

**Current State:** Exact decimal calculations in code

**Options:**

| Option | Example | Pros | Cons |
|--------|---------|------|------|
| **A. Round to Nearest £1** | £127.42 → £127 | Simpler invoicing | May lose revenue on rounding down |
| **B. Round to Nearest £5** | £127.42 → £125 or £130 | Clean pricing, easy to remember | Some revenue variance |
| **C. Round Up to Nearest £5** | £127.42 → £130 | Protects margin | Perceived as "inflated" |
| **D. No Rounding** | £127.42 | Precise, transparent | Awkward pricing (£1,247.38/year) |

**Recommended:** **Option B - Round to Nearest £5** (with round-up tiebreaker)

**Formula:**
```typescript
const roundToNearest5 = (price: number): number => {
  return Math.round(price / 5) * 5;
};

// Example: £127.42 → £125, £127.50 → £130, £128.99 → £130
```

**Decision Required:** Confirm recommendation or specify alternative

---

## DEC-005: Minimum Engagement Value 💰

**Context:**
Market research shows most firms have **minimum fees** to ensure profitability.

**Market Data:**
- Minimum engagement: £300-£500/year (dormant companies)
- Monthly minimums: £60-£100/month (active businesses)

**Current State:** No minimum enforced

**Options:**

| Option | Value | Justification |
|--------|-------|---------------|
| **A. No Minimum** | £0 | Accept all clients, build portfolio |
| **B. £60/month Minimum** | £720/year | Covers basic compliance costs |
| **C. £100/month Minimum** | £1,200/year | Ensures profitability |

**Recommended:** **Option B - £60/month Minimum** (with exceptions for dormant companies)

**Rationale:**
- Market research median: £60-£100/month for solo directors
- Allows small client acquisition
- Ensures cost coverage

**Decision Required:** Confirm recommendation or specify alternative

---

## DEC-006: SLA for Quote Delivery ⏱️

**Context:**
Leads expect quotes within a certain timeframe. Market standard varies.

**Market Research:**
- Instant quotes (online calculators): Immediate
- Email quotes: 24-48 hours
- Complex quotes: 3-5 business days

**Options:**

| Option | SLA | Automation Level |
|--------|-----|------------------|
| **A. Instant** | <5 minutes | Fully automated calculator |
| **B. Same Day** | Within 24 hours | Semi-automated with review |
| **C. 48 Hours** | 2 business days | Manual proposal creation |

**Recommended:** **Option A for standard leads, Option B for complex**

**Rationale:**
- Gap analysis shows auto-service configuration needed (GAP-004)
- Instant quotes competitive advantage
- Complex/custom quotes require review

**Decision Required:** Confirm recommendation or specify SLA policy

---

## DEC-007: Pricing DSL Adoption 🔧

**Context:**
Proposal includes lightweight DSL for pricing configuration (see `32-pricing-dsl.md`). Alternative is hardcoded logic.

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Adopt DSL** | Implement JSON/YAML pricing config | ✅ Non-technical price updates<br>✅ Auditable changes<br>✅ Version control | ❌ Dev effort (2-3 weeks)<br>❌ Testing complexity |
| **B. Keep Hardcoded** | Current TypeScript logic | ✅ No refactor needed<br>✅ Faster to market | ❌ Developers required for price changes<br>❌ Deployment needed for updates |
| **C. Hybrid** | Core logic hardcoded, bands/multipliers in DB | ✅ Balance flexibility & simplicity | ❌ Partial solution |

**Recommended:** **Option C - Hybrid Approach** (for V1)

**Rationale:**
- `pricing_rules` table already exists (lines 1667-1697 in schema.ts)
- Can update bands/prices via admin UI
- Complex logic (payroll tiers, discounts) stays in code
- Path to full DSL later if needed

**Decision Required:** Confirm recommendation or plan full DSL adoption

---

## DEC-008: Tax Year Definition 📅

**Context:**
UK tax year: 6 April to 5 April. Affects self-assessment deadlines, thresholds.

**Current State:** No explicit tax year configuration

**Options:**

| Option | Implementation |
|--------|----------------|
| **A. Hardcoded 2024-2025** | Constants in code |
| **B. Dynamic (Current FY)** | Calculate from current date |
| **C. Configurable per Tenant** | Tenant-level setting |

**Recommended:** **Option B - Dynamic Calculation**

**Formula:**
```typescript
const getCurrentTaxYear = (): { start: Date; end: Date } => {
  const now = new Date();
  const year = now.getFullYear();
  const taxYearStart = new Date(year, 3, 6); // April 6

  if (now < taxYearStart) {
    return {
      start: new Date(year - 1, 3, 6),
      end: new Date(year, 3, 5)
    };
  } else {
    return {
      start: taxYearStart,
      end: new Date(year + 1, 3, 5)
    };
  }
};
```

**Decision Required:** Approve dynamic calculation ✅ / Alternative ___

---

## DEC-009: Pricing Visibility (Public vs Private) 👁️

**Context:**
Should pricing be publicly visible or quote-only?

**Market Research:**
- **40%** of UK firms publish pricing on website
- **35%** show "from £X" starting prices
- **25%** require quote request

**Options:**

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. Fully Public** | All prices visible on website | ✅ Transparency<br>✅ Lead qualification<br>✅ SEO benefit | ❌ Competitor intel<br>❌ Price comparison |
| **B. Starting Prices** | Show "from £X" ranges | ✅ Attracts leads<br>✅ Flexibility | ❌ Unclear total cost |
| **C. Quote-Only** | No public pricing | ✅ Protects competitive position | ❌ Higher bounce rate<br>❌ More low-quality leads |

**Recommended:** **Option B - Starting Prices with Interactive Calculator**

**Example:**
- "Annual Accounts from £300/year"
- "Payroll from £18/month"
- "Get instant quote" → Interactive calculator

**Decision Required:** Confirm recommendation or select alternative

---

## DEC-010: Feature Flags for Pricing Engine 🚩

**Context:**
Rollout strategy for new pricing features.

**Recommended Feature Flags:**

| Flag | Purpose | Default |
|------|---------|---------|
| `pricing.modelB.enabled` | Enable transaction-based pricing | `true` |
| `pricing.autoServiceConfig.enabled` | Auto-configure services from lead | `false` (manual until tested) |
| `pricing.pricingPreview.enabled` | Show pricing in lead capture | `false` (staged rollout) |
| `pricing.complexityEstimation.enabled` | Auto-estimate complexity | `false` (requires validation) |

**Decision Required:** Approve flags and rollout plan

---

## SUMMARY: Decisions Pending

| ID | Decision | Priority | Blocker? |
|----|----------|----------|----------|
| DEC-001 | Currency & Region | **HIGH** | ✅ Yes |
| DEC-002 | Pricing Model | **HIGH** | ✅ Yes |
| DEC-003 | Discount Policy | MEDIUM | No |
| DEC-004 | Rounding Rules | MEDIUM | No |
| DEC-005 | Minimum Engagement | MEDIUM | No |
| DEC-006 | Quote SLA | MEDIUM | No |
| DEC-007 | DSL Adoption | LOW | No |
| DEC-008 | Tax Year | LOW | No |
| DEC-009 | Pricing Visibility | LOW | No |
| DEC-010 | Feature Flags | MEDIUM | No |

**Critical Blockers:** DEC-001 (Region) and DEC-002 (Pricing Model) must be decided before implementation begins.

---

**End of Decision Log**
