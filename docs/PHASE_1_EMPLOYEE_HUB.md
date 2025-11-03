# Phase 1: Create Employee Hub Module

Duration: 6–7 days (Week 1–2)  
Runs parallel with: Phase 0 (Doc Audit)  
Hub color: Emerald (#10b981)

---

## Goal

Extract and consolidate all employee self‑service features into a dedicated Employee Hub: timesheets, time entries, leave management, TOIL, and approvals.

---

## Current vs Target

Current (scattered)
- Client Hub: time‑tracking, time, leave (and calendar).  
- Admin: leave/approvals.  
- Staff components in components/staff/ used by multiple modules.

Target (consolidated)
```
app/employee-hub/
  layout.tsx (emerald header)
  page.tsx (dashboard)
  timesheets/
    page.tsx
    [weekId]/page.tsx
    submit/page.tsx
  time-entries/
    page.tsx
    history/page.tsx
  leave/
    page.tsx
    request/page.tsx
    calendar/page.tsx
    balance/page.tsx
  toil/
    page.tsx
    balance/page.tsx
    history/page.tsx
  approvals/
    page.tsx
    timesheets/page.tsx
    leave/page.tsx
```

Components (moved/created)
```
components/employee-hub/
  dashboard/
    my-timesheet-widget.tsx
    leave-balance-widget.tsx
    pending-approvals-widget.tsx
    quick-actions.tsx
  timesheets/
    timesheet-entry-form.tsx
    timesheet-submission-card.tsx
    timesheet-approval-modal.tsx
    timesheet-status-badge.tsx
  leave/
    leave-request-form.tsx
    leave-calendar.tsx
    leave-balance-widget.tsx
    approval-actions-modal.tsx
  toil/
    toil-balance-widget.tsx
    toil-history-table.tsx
    toil-accrual-summary.tsx
```

Routers: reuse existing (`timesheets.ts`, `leave.ts`, `toil.ts`, `staffCapacity.ts`, `workingPatterns.ts`, `workTypes.ts`).

---

## Tasks

1) Module scaffolding (Day 1)  
- Create directories and layout with headerColor="#10b981"; add to GlobalSidebar; protect routes in middleware.

2) Move timesheet functionality (Day 1–2)  
- Copy pages from Client Hub; update imports/routes; relocate related components; verify forms and mutations.  
- Add approvals under employee‑hub/approvals/timesheets.

3) Move leave functionality (Day 2–3)  
- Copy leave pages and calendar; move approvals from Admin to Employee Hub; ensure role gating.

4) TOIL UI (Day 3)  
- Create pages and wire to `toil` router; move widgets from components/staff.

5) Dashboard (Day 3–4)  
- Implement widgets (timesheet progress, balances, approvals for managers, quick actions).  
- Wire to routers and add loading/error states.

6) Navigation & cleanup (Day 4–5)  
- Remove employee items from Client/Admin nav; ensure all new routes linked; update breadcrumbs.

7) Testing (Day 5–6)  
- Update E2E flows (new paths).  
- Run router/unit tests for timesheets/leave/TOIL.  
- Validate multi‑tenant isolation and manager permissions.  
- Performance: approval queue and calendar.

---

## Workflows to Validate

- Weekly timesheet: entry → submit → manager approve/reject → notify.  
- Annual leave: request → check balance/calendar → manager approve → balance update.  
- TOIL: accrue on approved overtime → view balance → request usage → approve → deduct/expire.  
- Manager approvals: process queue, bulk actions, comments.

---

## Definition of Done

- Employee Hub fully functional and separated from Client/Admin.  
- All tests pass (1,389+).  
- All workflows validated; dark mode and responsiveness OK.  
- Navigation coherent; no dead links.


