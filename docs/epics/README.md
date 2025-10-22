# Practice Hub Feature Parity Epics

**Generated:** 2025-10-22
**Source PRD:** `/root/projects/practice-hub/docs/prd.md`
**Total Epics:** 6
**Total Effort:** 67-95 days
**Status:** Ready for Story Creation

---

## Epic Overview

This directory contains 6 comprehensive epics derived from the Practice Hub Feature Parity Restoration PRD. The epics are organized by implementation tier to enable sprint planning while maintaining logical dependencies.

---

## Epic Summary

| Epic ID | Epic Name | Tier | Effort | Priority | Features | Stories |
|---------|-----------|------|--------|----------|----------|---------|
| **EPIC-1** | Critical Path & Production Readiness | 1 | 5-9 days | Critical | 4 features (9 items) | 3 stories |
| **EPIC-2** | High-Impact Workflows | 2 | 15-25 days | High | 8 features (13 items) | 5 stories |
| **EPIC-3** | Advanced Automation Features | 3 | 12-20 days | High | 6 features (8 items) | 4 stories |
| **EPIC-4** | Staff Management & Operations | 4 | 30-40 days | Medium | 7 features (15 items) | 6 stories |
| **EPIC-5** | Bulk Operations & Data Import | 5 | 5-8 days | Medium | 4 features (4 items) | 3 stories |
| **EPIC-6** | Polish & Enhancements | 6 | 3-5 days | Low | 5 features (4 core + 2 bonus) | 3 stories |
| **TOTAL** | - | - | **67-95 days** | - | **34 features (51+ items)** | **24 stories** |

---

## Epic Files

### Epic 1: Critical Path & Production Readiness
**File:** `epic-1-critical-path.md`
**Goal:** Complete all production-blocking features to enable production release candidate

**Key Features:**
- Legal Pages Implementation (GDPR compliance)
- HMRC VAT Validation Integration
- Invoice Detail Page
- Client Code Generation Fix

**Critical Success Factors:**
- PRODUCTION BLOCKER - All other epics can proceed in parallel once this completes
- Legal pages require counsel review before production
- HMRC sandbox credentials available, production credentials pending

---

### Epic 2: High-Impact Workflows
**File:** `epic-2-high-impact-workflows.md`
**Goal:** Restore time-saving automation and unlock staff productivity

**Key Features:**
- Task Notes & Comments (with @mentions)
- Time Approval Workflow (saves 1.5 hours/week per manager)
- Settings Persistence (0% → 100% save success rate)
- Bulk Import Infrastructure
- Client CSV Import
- Task Reassignment

**Critical Success Factors:**
- Settings backend already exists - easiest gap to fix (2-3 days)
- Time approval workflow foundational for Epic 4 (TOIL accrual)
- Bulk import infrastructure foundation for Epic 5

---

### Epic 3: Advanced Automation Features
**File:** `epic-3-advanced-automation.md`
**Goal:** Unlock workflow automation with templates and real-time updates

**Key Features:**
- Task Templates System (prerequisite for auto-generation)
- Automated Task Generation (from templates + workflow triggers)
- Reports Dashboard Backend Integration (database views exist, just wire UI)
- Real-time Activity Feed (SSE implementation)
- Real-time Notifications Push

**Critical Success Factors:**
- Database views for reports already exist (drizzle/0000_create_views.sql)
- SSE chosen for Phase 1 (abstraction layer enables WebSocket migration Phase 2)
- Task templates prerequisite for FR14 (dependency)

---

### Epic 4: Staff Management & Operations
**File:** `epic-4-staff-management.md`
**Goal:** Achieve operational maturity with comprehensive staff management

**Key Features:**
- Department Management
- Staff Capacity Planning & Utilization Tracking
- Working Patterns Management
- Holiday/Leave Request System (with approval workflow)
- Time in Lieu (TOIL) Tracking
- Staff Statistics Dashboard
- Work Type Migration (enum → database table)

**Critical Success Factors:**
- LARGEST EPIC (30-40 days) - consider splitting if needed
- TOIL accrual depends on timesheet approval (Epic 2 dependency)
- Work type migration critical - test thoroughly to prevent data loss
- Leave system approval workflow similar to time approval (Epic 2 pattern)

---

### Epic 5: Bulk Operations & Data Import
**File:** `epic-5-bulk-operations.md`
**Goal:** Enable rapid data import and efficient bulk management

**Key Features:**
- Service CSV Import
- Import Templates System (downloadable CSV templates)
- CSV Parsing Service Enhancement (multi-delimiter, date formats, BOM)
- Bulk Operations Extensions (clients, invoices, documents, users)

**Critical Success Factors:**
- Extends bulk import infrastructure from Epic 2 (FR10-FR11)
- Generic CSV parser handles real-world CSV variations
- Bulk operations follow task bulk action pattern (reuse component)
- Soft delete for bulk operations preserves recovery capability

---

### Epic 6: Polish & Enhancements
**File:** `epic-6-polish-enhancements.md`
**Goal:** Final polish to achieve 100% feature parity with archived CRM

**Key Features:**
- Dashboard Upcoming Deadlines Widget (replace hardcoded placeholder)
- Notification Preferences Backend (persistence)
- Email Automation for Workflows
- API Documentation Page (BONUS - from archived CRM)
- Weekly Timesheet Full Restoration (BONUS - 60% → 100% parity)

**Critical Success Factors:**
- FINAL EPIC - achieves 100% feature parity with archived CRM
- Notification preferences UI exists, just needs backend wiring
- Email automation extends existing email notification system
- Weekly timesheet restoration completes migration

---

## Implementation Sequence

### Recommended Sequence

1. **Epic 1 (Critical Path)** - 5-9 days
   - MUST complete first (production blocker)
   - Unblocks production deployment
   - Other epics can proceed in parallel after this

2. **Epic 2 (High-Impact Workflows)** - 15-25 days
   - High ROI (time approval saves 1.5 hrs/week per manager)
   - Settings persistence easiest gap (2-3 days)
   - Foundation for Epic 3 (task notes) and Epic 4 (TOIL accrual)

3. **Epic 3 (Advanced Automation)** - 12-20 days
   - Depends on Epic 2 (task notes foundation)
   - Task templates prerequisite for auto-generation
   - Reports backend integration (database views exist)

4. **Epic 4 (Staff Management)** - 30-40 days
   - Depends on Epic 2 (timesheet approval for TOIL)
   - LARGEST EPIC - can run in parallel with Epic 5 if team size allows
   - Consider splitting: 4A (Organization & Capacity), 4B (Leave & Analytics)

5. **Epic 5 (Bulk Operations)** - 5-8 days
   - Depends on Epic 2 (bulk import infrastructure)
   - Can run in parallel with Epic 4
   - Short duration, low risk

6. **Epic 6 (Polish)** - 3-5 days
   - Final polish, minimal dependencies
   - Achieves 100% feature parity
   - Can start after Epic 2-3 complete

### Parallel Execution Strategy

**Phase 1: Critical Path (Sprint 1)**
- Epic 1: Critical Path (5-9 days)

**Phase 2: High-Impact Foundation (Sprint 2-4)**
- Epic 2: High-Impact Workflows (15-25 days)

**Phase 3: Automation & Management (Sprint 5-8)**
- Epic 3: Advanced Automation (12-20 days) - Team A
- Epic 4: Staff Management (30-40 days) - Team B (start after Sprint 2)

**Phase 4: Final Features (Sprint 9-10)**
- Epic 5: Bulk Operations (5-8 days)
- Epic 6: Polish (3-5 days) - can overlap

**Total Timeline:**
- Sequential: 70-107 days (14-21 sprints)
- Parallel (2 teams): 52-73 days (10-15 sprints)

---

## Dependencies Graph

```
Epic 1 (Critical Path)
  └─> Epic 2 (High-Impact Workflows)
       ├─> Epic 3 (Advanced Automation)
       │    └─> Epic 6 (Polish)
       ├─> Epic 4 (Staff Management)
       │    └─> Epic 6 (Polish)
       └─> Epic 5 (Bulk Operations)
            └─> Epic 6 (Polish)
```

**Critical Path:** Epic 1 → Epic 2 → Epic 3/4 (parallel) → Epic 5/6 (parallel)

---

## Story Count by Epic

| Epic | Stories | Avg Story Size | Story Complexity |
|------|---------|----------------|------------------|
| Epic 1 | 3 stories | 2-3 days | Simple (wiring existing backends) |
| Epic 2 | 5 stories | 3-5 days | Medium (new infrastructure + wiring) |
| Epic 3 | 4 stories | 3-5 days | Medium-High (templates, SSE, automation) |
| Epic 4 | 6 stories | 5-7 days | High (comprehensive staff management) |
| Epic 5 | 3 stories | 2-3 days | Simple-Medium (extends Epic 2 infrastructure) |
| Epic 6 | 3 stories | 1-2 days | Simple (polish, wiring) |
| **Total** | **24 stories** | **3-4 days avg** | **Medium** |

---

## Risk Summary

### High-Risk Areas

1. **Epic 4 - Staff Management Scope**
   - **Risk:** Largest epic (30-40 days), potential scope creep
   - **Mitigation:** Strict scope adherence, consider splitting into 2 epics

2. **Epic 1 - Legal Pages Counsel Review**
   - **Risk:** Production deployment blocked until legal approval
   - **Mitigation:** Placeholder compliant templates, schedule review in parallel

3. **Epic 4 - Work Type Migration**
   - **Risk:** Migrating enum to table could break timeEntries references
   - **Mitigation:** Migration script, test on production data copy, rollback plan

4. **Epic 3 - SSE Connection Stability**
   - **Risk:** Real-time connections drop frequently
   - **Mitigation:** Robust reconnection logic, fallback to polling

### Medium-Risk Areas

1. **Epic 2 - CSV Import Complexity**
   - CSV parsing edge cases (encoding, delimiters, quoted fields)

2. **Epic 3 - Task Template Complexity**
   - Placeholder system and due date logic complexity

3. **Epic 4 - Leave System Complexity**
   - Balance calculations, carryover logic, public holiday integration

4. **Epic 2 - Time Approval Edge Cases**
   - Partial weeks, holiday weeks, retroactive submissions

---

## Success Metrics

### Quantitative Goals

- **Feature Parity:** 100% (51 features implemented)
- **Settings Save Rate:** 0% → 100%
- **Time Approval Adoption:** >90% of staff
- **Task Templates:** >10 templates created (first week)
- **Auto Task Generation:** >100 tasks generated (first month)
- **CSV Imports:** >100 clients, >50 services (first month)
- **Utilization Tracking:** 100% staff have capacity configured

### Qualitative Goals

- Legal pages meet GDPR compliance
- Time approval reduces manager reconciliation by 1.5 hrs/week
- Task notes eliminate email/Slack fragmentation
- Reports dashboard provides instant performance visibility
- Real-time updates improve team collaboration
- Staff management enables data-driven resource allocation
- 100% feature parity with archived CRM achieved

---

## Next Steps

### For Story Manager

1. **Review Epic Documents:** Read all 6 epic files to understand scope
2. **Clarify Ambiguities:** Ask PM for clarifications on unclear requirements
3. **Develop User Stories:** Create detailed user stories for each epic following these guidelines:
   - Break epics into actionable user stories
   - Include acceptance criteria per story
   - Define story points (Fibonacci: 1, 2, 3, 5, 8, 13)
   - Specify technical implementation notes
   - Include test requirements (unit, integration, E2E)
   - Verify multi-tenant isolation requirements
   - Link to related stories (dependencies)
   - Reference source FR from PRD

4. **Story Sequencing:** Ensure stories respect dependencies:
   - Epic 1 stories first (production blocker)
   - Epic 2 stories before Epic 3 (task notes foundation)
   - Epic 2 stories before Epic 4 (timesheet approval for TOIL)
   - Task templates (Epic 3) before auto-generation (Epic 3)

5. **Story Templates:** Use Practice Hub story template including:
   - User story format: "As a [role], I want [feature], so that [benefit]"
   - Acceptance criteria (Given/When/Then format)
   - Technical implementation notes
   - Database schema changes (CLAUDE.md Rule #12: NO migrations, direct schema updates)
   - Multi-tenant isolation requirements
   - Test requirements (unit, integration, E2E)
   - Definition of Done checklist

### For Development Team

1. **Review Architecture:** Understand existing codebase patterns (see CLAUDE.md)
2. **Setup Environment:** Ensure dev environment ready (Docker, MinIO, DocuSeal)
3. **Sprint Planning:** Plan Sprint 1 with Epic 1 stories (production blocker)
4. **Resource Allocation:** Consider parallel execution strategy for Epics 3-4

---

## Document Metadata

**Generated By:** PM Agent (John)
**Generation Date:** 2025-10-22
**Source PRD Version:** 1.0
**Total Epics:** 6
**Total Stories:** 24
**Total Effort:** 67-95 days
**PRD Location:** `/root/projects/practice-hub/docs/prd.md`

---

**Status:** ✅ All 6 epics created and ready for story development
