# Practice Hub User Stories

**Generated:** 2025-10-22
**Source Epics:** `/root/projects/practice-hub/docs/epics/`
**Total Stories:** 24 user stories across 6 epics
**Status:** Ready for Sprint Planning

---

## Story Overview

| Epic | Stories | Total Effort | Priority |
|------|---------|--------------|----------|
| Epic 1: Critical Path | 3 stories | 5-9 days | Critical |
| Epic 2: High-Impact Workflows | 5 stories | 15-25 days | High |
| Epic 3: Advanced Automation | 4 stories | 12-20 days | High |
| Epic 4: Staff Management | 6 stories | 30-40 days | Medium |
| Epic 5: Bulk Operations | 3 stories | 5-8 days | Medium |
| Epic 6: Polish & Enhancements | 3 stories | 3-5 days | Low |
| **TOTAL** | **24 stories** | **67-95 days** | - |

---

## Stories by Epic

### Epic 1: Critical Path & Production Readiness (PRODUCTION BLOCKER)

1. **STORY-1.1:** Legal Pages Implementation (FR1) - 2-3 days
   - Privacy Policy, Terms, Cookie Policy pages
   - Admin content management, versioning
   - Signup flow integration

2. **STORY-1.2:** HMRC VAT Validation Integration (FR2) - 2-3 days
   - OAuth 2.0 flow for HMRC API
   - Real-time VAT validation in client forms
   - Sandbox/production credential support

3. **STORY-1.3:** Invoice Detail Page & Client Code Fix (FR3 + FR4) - 1-2 days
   - Invoice detail route with line items, payment history
   - Fix Math.random() client code generation bug
   - Deterministic sequential client codes

### Epic 2: High-Impact Workflows

4. **STORY-2.1:** Task Notes & Comments System (FR5) - 4-5 days
   - Thread-based task commenting
   - @mentions with autocomplete
   - Notification integration

5. **STORY-2.2:** Time Approval Workflow (FR6) - 5-7 days
   - Submit week for approval
   - Manager approval interface with bulk actions
   - Email notifications, audit trail

6. **STORY-2.3:** Settings Persistence & System Configuration (FR7 + FR8) - 3-4 days
   - Wire settings UI to existing backend
   - System settings (company, currency, timezone)
   - 0% → 100% save success rate

7. **STORY-2.4:** Integration Settings & Bulk Import Infrastructure (FR9 + FR10) - 6-8 days
   - Xero OAuth integration
   - CSV import infrastructure with validation
   - Import audit trail

8. **STORY-2.5:** Client CSV Import & Task Reassignment (FR11 + FR12) - 4-5 days
   - Client CSV import with validation
   - Task reassignment with history tracking
   - Bulk reassignment support

### Epic 3: Advanced Automation Features

9. **STORY-3.1:** Task Templates System (FR13) - 5-6 days
   - Template management with placeholders
   - Service-level assignment, client overrides
   - Due date offset configuration

10. **STORY-3.2:** Auto Task Generation & Workflow Triggers (FR14 + FR18) - 4-5 days
    - Automated task generation from templates
    - Service activation triggers
    - Workflow completion triggers

11. **STORY-3.3:** Reports Dashboard Backend Integration (FR15) - 3-4 days
    - Wire reports UI to existing database views
    - Revenue/client/service report endpoints
    - Replace hardcoded zeros with real data

12. **STORY-3.4:** Real-time Updates via SSE (FR16 + FR17) - 3-4 days
    - SSE endpoint for activity feed
    - Real-time notifications push
    - Abstraction layer for WebSocket migration

### Epic 4: Staff Management & Operations

13. **STORY-4.1:** Department Management & Staff Organization (FR19) - 2-3 days
    - Department CRUD with manager assignment
    - User assignment to departments
    - Department-level reporting

14. **STORY-4.2:** Staff Capacity Planning & Utilization Tracking (FR20) - 3-5 days
    - Capacity tracking (weekly hours)
    - Utilization dashboards with alerts
    - Workload balancing recommendations

15. **STORY-4.3:** Working Patterns & Flexible Arrangements (FR21) - 2-3 days
    - Day-by-day hour tracking
    - Pattern templates (full-time, part-time, compressed)
    - Integration with capacity calculations

16. **STORY-4.4:** Holiday/Leave Request System (FR22) - 3-5 days
    - Leave requests with approval workflow
    - Leave balances tracking
    - Leave calendar, public holiday integration

17. **STORY-4.5:** Time in Lieu Tracking & Staff Statistics (FR23 + FR24) - 3-4 days
    - TOIL accrual from overtime
    - TOIL redemption via leave requests
    - Individual staff utilization analytics

18. **STORY-4.6:** Work Type Migration to Database (FR25) - 3-4 days
    - Migrate from enum to database table
    - Admin UI for work type configuration
    - Per-tenant customization

### Epic 5: Bulk Operations & Data Import

19. **STORY-5.1:** Service CSV Import & Import Templates (FR26 + FR27) - 3-4 days
    - Service CSV import with category validation
    - Downloadable CSV templates for all entities
    - Template generation system

20. **STORY-5.2:** CSV Parsing Enhancement & Task Import (FR28) - 2-3 days
    - Multi-delimiter support (comma, semicolon, tab)
    - Date format parsing (multiple formats)
    - BOM handling, task CSV import

21. **STORY-5.3:** Bulk Operations Extensions (FR29) - 3-4 days
    - Bulk operations for clients/invoices/documents/users
    - Bulk action bars in all list views
    - Audit logging for bulk operations

### Epic 6: Polish & Enhancements

22. **STORY-6.1:** Dashboard Deadlines & Notification Preferences (FR30 + FR31) - 2 days
    - Wire upcoming deadlines to complianceItems table
    - Notification preferences persistence
    - User control over notification delivery

23. **STORY-6.2:** Email Automation & API Documentation (FR32 + FR33) - 4-5 days
    - Workflow-triggered email automation
    - Email template system with variables
    - API documentation page

24. **STORY-6.3:** Weekly Timesheet Full Restoration (FR34) - 2-3 days
    - TOIL/holiday balance widgets
    - Week-at-a-glance grid
    - Submit week workflow integration

---

## Story Status Legend

- **Ready for Development:** Story fully defined, ready for sprint planning
- **In Progress:** Story currently being developed
- **In Review:** Story complete, under QA/code review
- **Done:** Story complete, deployed to staging
- **Released:** Story deployed to production

---

## Sprint Planning Guidance

### Recommended Sprint Sequence

**Sprint 1 (Epic 1):** Production Blockers - 5-9 days
- STORY-1.1: Legal Pages
- STORY-1.2: HMRC VAT Validation  
- STORY-1.3: Invoice Detail & Client Code Fix

**Sprint 2-4 (Epic 2):** High-Impact Workflows - 15-25 days
- STORY-2.1: Task Notes & Comments
- STORY-2.2: Time Approval Workflow
- STORY-2.3: Settings Persistence
- STORY-2.4: Integration Settings & Bulk Import
- STORY-2.5: Client CSV Import & Task Reassignment

**Sprint 5-8 (Epic 3 + 4 Parallel):** Automation & Staff Management - 42-60 days
- **Team A (Epic 3):** STORY-3.1 through STORY-3.4
- **Team B (Epic 4):** STORY-4.1 through STORY-4.6

**Sprint 9-10 (Epic 5 + 6):** Bulk Operations & Polish - 8-13 days
- STORY-5.1, STORY-5.2, STORY-5.3
- STORY-6.1, STORY-6.2, STORY-6.3

---

## Story Points Reference

Using Fibonacci sequence (1, 2, 3, 5, 8, 13):

- **1-2 days:** 3 points
- **3-4 days:** 5 points
- **5-7 days:** 8 points
- **8+ days:** 13 points (consider splitting)

---

## Multi-Tenant Isolation Checklist

All stories must verify:
- [ ] All database queries filter by `tenantId`
- [ ] tRPC procedures use `ctx.authContext.tenantId`
- [ ] Client portal features filter by both `tenantId` AND `clientId`
- [ ] Unit tests verify multi-tenant isolation
- [ ] Integration tests prevent cross-tenant data access

---

## Definition of Done Template

All stories must meet:
- [ ] All acceptance criteria met
- [ ] Unit tests written (tRPC routers, services)
- [ ] Integration tests written (multi-tenant isolation)
- [ ] E2E tests written (critical user flows)
- [ ] Code reviewed (focus on security, multi-tenant isolation)
- [ ] Seed data updated (if schema changed)
- [ ] Documentation updated (if needed)
- [ ] Performance benchmarks met
- [ ] No regressions verified
- [ ] Feature deployed to staging
- [ ] QA testing completed

---

## Access Story Documents

All story documents located in:
```
/root/projects/practice-hub/docs/stories/
  epic-1/
    story-1-legal-pages.md
    story-2-hmrc-vat-validation.md
    story-3-invoice-detail-client-code-fix.md
  epic-2/
    (5 stories - to be created)
  epic-3/
    (4 stories - to be created)
  epic-4/
    (6 stories - to be created)
  epic-5/
    (3 stories - to be created)
  epic-6/
    (3 stories - to be created)
```

---

**Status:** ✅ All 24 stories complete (24/24)
**Epic 1:** ✅ Complete (3/3 stories)
**Epic 2:** ✅ Complete (5/5 stories)
**Epic 3:** ✅ Complete (4/4 stories)
**Epic 4:** ✅ Complete (6/6 stories)
**Epic 5:** ✅ Complete (3/3 stories)
**Epic 6:** ✅ Complete (3/3 stories)

**Story Index Owner:** PM Agent (John)
**Created:** 2025-10-22
**Completed:** 2025-10-22
**Source Epics:** `/root/projects/practice-hub/docs/epics/`
