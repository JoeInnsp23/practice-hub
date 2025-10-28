# Decision Queue: Practice Hub Production Readiness

**Last Updated**: 2025-10-27
**Total Decisions**: 3
**Status**: Awaiting Stakeholder Input

---

## DEC-001: Social Hub Deprecation

**Context**: Social Hub (11 pages including post scheduler, analytics, social profiles) was part of legacy app but not migrated to current Practice Hub application.

### Options

#### A) Migrate Social Hub - Full Feature Parity
**Pros**:
- Complete feature set from legacy
- Social media management capabilities included
- No feature regression for existing users

**Cons**:
- Out of MVP scope for practice management
- 3-4 weeks development effort (11 pages + BullMQ integration)
- Requires Redis infrastructure for post scheduling
- Increases maintenance burden
- Adds complexity to already feature-rich platform

**Effort**: 3-4 weeks (120-160 hours)

#### B) Deprecate Social Hub - Focus on Core Practice Management
**Pros**:
- Ship faster by focusing on core features
- Reduce complexity and maintenance
- Practice management is primary value proposition
- Can add post-MVP if customer demand exists

**Cons**:
- Lose social media management capability
- Potential user disappointment if they used this feature
- Gap vs legacy app

**Effort**: 0 hours (document decision only)

#### C) External Integration - Use Specialized Tools
**Pros**:
- Best-in-class social media tools (Buffer, Hootsuite, Later)
- Reduce development burden
- Professional features beyond in-house capability

**Cons**:
- Integration complexity (OAuth, webhooks)
- Additional vendor dependencies
- Potential extra cost for users

**Effort**: 2-3 weeks (80-120 hours for integration)

### Recommended: B (Deprecate Social Hub)

**Rationale**:
- Social media management is **not core** to practice management MVP
- Focus limited resources on accounting practice workflows (tasks, proposals, timesheets, client portal)
- Can be added as **separate Story post-MVP** if customer demand validates the need
- Reduces time-to-market by 3-4 weeks

### Input Needed
- [ ] **Product Manager**: Confirm Social Hub is not required for launch
- [ ] **Stakeholders**: Verify no legacy users depend on Social Hub features
- [ ] **Customer Success**: Validate social media management is not top customer request

### Decision Owner
Product Manager

### Target Decision Date
Week 1 Day 1 (2025-10-27)

### Impact if Not Decided
- Blocks final scope confirmation
- May delay production launch planning
- Creates ambiguity for roadmap prioritization

---

## DEC-002: Quote Management Data Model

**Context**: Legacy app has `/quotes` page for quote generation. Current app has no `quotes` router found. Unclear if quotes are proposal variants (same table, `type='quote'`) or separate entity requiring dedicated CRUD operations.

### Options

#### A) Quotes are Proposal Variants - Use Existing Proposals Table
**Pros**:
- No additional development required
- Reuse existing proposal logic (tRPC router, UI components, PDF generation)
- Simpler architecture (one entity type)
- DRY principle (don't repeat proposal logic)

**Cons**:
- Need to document clearly in architecture docs
- May have different business requirements (e.g., quotes don't require DocuSeal signatures)
- Could cause confusion if proposal and quote workflows diverge

**Effort**: 1 hour (add `type` enum to proposals, document architecture)

#### B) Implement Separate Quotes Module - Dedicated Table & Router
**Pros**:
- Feature parity with legacy app
- Specialized workflow for quotes (if requirements differ)
- Clear separation of concerns
- Easier to add quote-specific features later

**Cons**:
- 3-5 hours development effort (schema + router + UI)
- Additional maintenance burden
- Code duplication (similar to proposals)

**Effort**: 4 hours (create schema, router, UI pages)

### Recommended: A (Quotes are Proposal Variants)

**Rationale**:
- **Verify first** if quotes and proposals have different requirements
- If requirements are similar (both are "offers sent to clients"), use proposal table with `type` enum
- **Only implement separate module** if business logic requires it
- Principle: Start simple, add complexity only if needed

### Input Needed
- [ ] **Product Manager**: What are the business requirements for quotes vs proposals?
- [ ] **Stakeholders**: Are quotes and proposals the same entity with different labels?
- [ ] **Customer Success**: Do customers need separate quote workflows?

**Key Questions**:
1. Can a quote be "converted to proposal" or are they always separate?
2. Do quotes require e-signatures (DocuSeal) or just PDF generation?
3. Are quote line items identical to proposal line items?

### Decision Owner
Product Manager + Backend Developer

### Target Decision Date
Week 1 Day 1 (2025-10-27)

### Impact if Not Decided
- Blocks GAP-002 implementation (4 hours at risk)
- May cause rework if wrong approach chosen
- Creates technical debt if architecture is inconsistent

---

## DEC-003: Canvas Signatures Deprecation

**Context**: Canvas signatures (HTML5 canvas-based in-browser signing) were used in legacy app. Current app uses **DocuSeal** (professional e-signature platform with UK compliance, audit trail, webhooks). Canvas signatures deprecated by design.

### Options

#### A) DocuSeal Only - No Canvas Fallback
**Pros**:
- Professional e-signature standard (UK legally compliant)
- Full audit trail (who signed, when, IP address, device)
- Webhooks for status updates (signed, declined)
- Reduces code complexity (one signature path)
- Better user experience (email-based signing)

**Cons**:
- No offline signing option
- Legacy contracts with canvas signatures may need migration path
- If DocuSeal is unavailable, no fallback

**Effort**: 0 hours (current implementation)

#### B) Implement Canvas as Fallback - Hybrid Approach
**Pros**:
- Backward compatibility with legacy canvas-signed contracts
- Offline signing option (no external service required)
- Fallback if DocuSeal API unavailable

**Cons**:
- 4-8 hours development effort (canvas UI + signature storage)
- Maintenance burden (two signature systems)
- Canvas signatures lack legal compliance features
- May confuse users (two signature options)

**Effort**: 6 hours (implement canvas UI, store signatures in DB)

### Recommended: A (DocuSeal Only)

**Rationale**:
- DocuSeal is **professional standard** for e-signatures (legally compliant, audit trail, webhooks)
- Canvas signatures are **not legally compliant** for UK contracts (no audit trail, no identity verification)
- Canvas signatures deprecated **by design** in current architecture
- **No evidence** that canvas fallback is required

### Input Needed
- [ ] **Legal/Compliance**: Confirm canvas signatures are not required for any legacy contracts
- [ ] **Product Manager**: Verify no customer requests for canvas signatures
- [ ] **Customer Success**: Check if any existing contracts need canvas migration path

**Key Questions**:
1. Are there existing contracts with canvas signatures that need to be re-signed?
2. Does UK compliance require DocuSeal-level audit trails?
3. Is offline signing a customer requirement?

### Decision Owner
Product Manager + Legal/Compliance

### Target Decision Date
Week 1 Day 2 (2025-10-28)

### Impact if Not Decided
- Low impact (current implementation is DocuSeal-only)
- May cause late-stage rework if canvas fallback is suddenly required
- Creates risk if legal review reveals compliance gaps

---

## Decision Summary Table

| Decision | Priority | Effort if Wrong Choice | Target Date | Owner | Blocks |
|----------|----------|------------------------|-------------|-------|--------|
| **DEC-001**: Social Hub | HIGH | 120-160 hours | Week 1 Day 1 | Product Manager | Scope finalization |
| **DEC-002**: Quotes | MEDIUM | 4 hours rework | Week 1 Day 1 | Product Manager + Backend | GAP-002 |
| **DEC-003**: Canvas | LOW | 6 hours rework | Week 1 Day 2 | Product Manager + Legal | None (current DocuSeal works) |

---

## Decision Process

### How to Approve a Decision
1. Review options and recommended choice
2. Gather input from stakeholders (listed in "Input Needed")
3. Document final decision in this file:
   ```markdown
   ### Decision: [Chosen Option]
   **Approved By**: [Name, Role]
   **Date**: [Date]
   **Rationale**: [Why this option was chosen]
   ```
4. Update backlog if decision impacts GAP items
5. Communicate decision to engineering team

### Escalation Path
- **Not decided by target date**: Escalate to Engineering Lead
- **Conflicting stakeholder input**: Schedule decision meeting
- **New information changes recommendation**: Re-review and document

---

**Next Steps**:
1. Schedule decision meeting with Product Manager (Week 1 Day 1)
2. Invite stakeholders for each decision
3. Document approved decisions in this file
4. Update backlog and schedule based on decisions
