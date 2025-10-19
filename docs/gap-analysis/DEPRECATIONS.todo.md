# Deprecations & Removals Checklist

**Status:** No deprecations required at this time
**Last Review:** 2025-10-19

---

## Decision Needed (Await User Confirmation)

### None at this time.

All implemented features in the current codebase align with the product roadmap. No features have been identified for removal or deprecation.

---

## Features Considered for Deprecation

During the gap audit, the following features were considered but **NOT recommended for removal**:

### ✅ Keep: Task Quick-Add (CH-013)

**Reason:** Although not currently implemented in current codebase, quick-add is a UX enhancement that would benefit users. Recommend implementing rather than deprecating.

**Status:** Candidate for Phase 2 enhancement (not priority)

### ✅ Keep: Workflow Template UI (CH-012)

**Reason:** Essential admin feature for managing task workflows. No reason to remove.

**Status:** Candidate for Phase 2 implementation (medium priority)

### ✅ Keep: Proposal Pipeline Kanban (PH-008)

**Reason:** Core sales management feature. High value for users.

**Status:** Candidate for Phase 2 implementation (high priority)

### ✅ Keep: Proposal Analytics (PH-009)

**Reason:** Business intelligence feature; drives decision-making.

**Status:** Candidate for Phase 2 implementation (medium-low priority)

---

## Legacy Features NOT in Current Codebase (Intentional Removals?)

### Decision Needed — Task Quick-Add

**Context:** Legacy has TaskQuickAdd component for inline task creation. Current codebase has no trace of this.

**File Evidence:**
- Legacy: `.archive/practice-hub/crm-app/main/src/components/tasks/TaskQuickAdd.tsx` (exists)
- Current: Not found

**Options:**
1. **Intentionally Removed** – Simplify task creation, use modal only (simpler UX for current version)
2. **Not Yet Implemented** – Plan to add back in Phase 2
3. **Replace with Different UX** – Use drag-drop or batch upload instead

**Recommendation:** Option 2 (Not Yet Implemented). Quick-add is UX enhancement; can come later. Not urgent.

**What we need from you:**
- Confirm: Should quick-add be re-implemented as enhancement in Phase 2?
- Or deprecate entirely?

---

### Decision Needed — Proposal Templates

**Context:** Legacy has ProposalTemplateBuilder. Current has `templates` table but no admin UI.

**File Evidence:**
- Legacy: `.archive/practice-hub/proposal-app/main/src/components/ProposalTemplateBuilder.tsx` (exists)
- Current: Database table exists (schema.ts), but no admin UI

**Options:**
1. **Intentionally Incomplete** – Database support exists, admin UI coming in Phase 2
2. **Planned for Deprecation** – Remove from schema, don't implement UI
3. **Blocked by Dependency** – Waiting for other feature to complete

**Recommendation:** Option 1 (Intentionally Incomplete). Database is ready; UI is Phase 2 candidate.

**What we need from you:**
- Confirm: Is proposal template management on the roadmap?
- Timeline: When should admin UI be built?

---

### Decision Needed — Proposal Pipeline Customization

**Context:** Legacy allows custom pipeline stages. Current has no stage management UI.

**File Evidence:**
- Legacy: Inferred from settings/PipelineStages page
- Current: `proposalPipelineStages` table exists (schema.ts), but no UI

**Options:**
1. **Use Default Stages** – Hard-code 5 stages (enquiry, qualified, proposal_sent, follow_up, won/lost), don't allow customization
2. **Implement Customization** – Build admin UI for stage management (Phase 2 or later)
3. **Deprecate** – Remove from database schema; not needed for MVP

**Recommendation:** Option 1 (Use Default Stages). Simplify MVP; customization can come later if needed.

**What we need from you:**
- Confirm: Are custom pipeline stages required for launch?
- Or is 5-stage standard pipeline sufficient?

---

### Decision Needed — Lead-to-Client Conversion

**Context:** Legacy has explicit lead conversion on proposal signature. Current code suggests auto-conversion (proposalHubInitiated "auto-convert" logic exists).

**File Evidence:**
- Current: `app/api/webhooks/docuseal/route.ts:164–180` hints at conversion
- Query: Does `convertLeadToClient()` exist?

**Options:**
1. **Auto-Convert** – On signature, auto-move lead to client (current approach)
2. **Manual Conversion** – Require user to explicitly convert lead
3. **Optional Flow** – Give user choice at signature time

**Recommendation:** Option 1 (Auto-Convert). Simpler UX, aligns with business logic.

**What we need from you:**
- Confirm auto-conversion behavior is desired?
- Should conversion be optional/manual instead?

---

## Features in Current Codebase NOT in Legacy (New Features)

These are **additions**, not deprecations. No action needed.

| Feature | Status | Rationale |
|---------|--------|-----------|
| Task subtasks (parentTaskId) | ✅ Enhancement | Improves task hierarchy beyond legacy |
| Task recurring (isRecurring, recurringPattern) | ✅ Enhancement | Advanced scheduling |
| Proposal version versioning (auto-snapshot on update) | ✅ Enhancement | Better audit trail than legacy |
| Task progress % auto-calculation | ✅ Enhancement | UX improvement over manual tracking |
| Multi-currency support (if added) | ✅ Enhancement | Future-proofing |

---

## Archive & Cleanup

### Files to Consider Removing from Archive

**Recommendation:** Keep `.archive/` intact for 6 months, then:

- Option A: Delete after confirmation that no legacy features are needed
- Option B: Compress to single archive file and store in S3
- Option C: Keep for compliance/audit trail

**Current action:** Leave as-is for reference during Phase 2 implementations.

---

## Cleanup Tasks (If Needed Later)

- [ ] Remove `.archive/` directory if all features migrated successfully
- [ ] Remove any dead code branches from legacy implementations in current codebase
- [ ] Archive legacy test files once new test suite is comprehensive

---

## Sign-Off Checklist

Deprecation review complete. Awaiting confirmation on:

- [ ] Quick-Add (Task): Implement in Phase 2 or deprecate?
- [ ] Proposal Templates: On roadmap?
- [ ] Pipeline Customization: Required for launch or can use defaults?
- [ ] Lead Conversion: Auto or manual?

**Once confirmed:** Update this document and move items to appropriate sprints.

---

## Summary

| Item | Status | Owner | ETA |
|------|--------|-------|-----|
| Deprecations identified | ❌ None (all features valuable) | N/A | N/A |
| Decision needed | ⚠️ 4 items | Product | ASAP |
| Archive cleanup | ✅ No action | N/A | Later |

---

**Report Generated:** 2025-10-19
**Next Review:** After product confirmation on decision items above
