# User Story: TOIL Tracking & Staff Statistics

**Story ID:** STORY-4.5
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR23 (TOIL Tracking) + FR24 (Staff Statistics)
**Priority:** Medium
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** practice manager
**I want** TOIL accrual from overtime and individual staff utilization analytics
**So that** I can support flexible working and monitor performance

---

## Business Value

- **Flexibility:** TOIL enables overtime compensation flexibility
- **Performance:** Individual staff analytics for management
- **Fairness:** Transparent overtime tracking and redemption

---

## Acceptance Criteria - TOIL Tracking (FR23)

**AC1:** TOIL accrual calculation: overtime hours beyond contracted (logged_hours - contracted_hours)
**AC2:** TOIL balance field in leaveBalances.toil_balance
**AC3:** TOIL accrual triggered by timesheet approval (Epic 2 integration)
**AC4:** Integration with working patterns for contracted hours
**AC5:** TOIL redemption via leave request (leave_type = "toil")
**AC6:** TOIL balance widget: "TOIL Balance: 14.5 hours (1.9 days)"
**AC7:** TOIL accrual history view
**AC8:** TOIL expiry policy (optional, 6 months)
**AC9:** TOIL expiry notifications (30 days before)
**AC10:** TOIL accrual detail: which week/timesheet generated TOIL

---

## Acceptance Criteria - Staff Statistics (FR24)

**AC11:** Individual staff utilization cards at `/admin/staff/statistics`
**AC12:** Utilization card: photo, name, role, department, hours, utilization %
**AC13:** 12-week utilization trend chart per staff
**AC14:** Department-level utilization aggregations: "Tax: 92% (3 staff)"
**AC15:** Staff comparison table (sortable by name, role, dept, hours, %)
**AC16:** Filters: status, role, department, date range
**AC17:** Utilization heatmap: staff × weeks grid, color-coded
**AC18:** Export to CSV
**AC19:** Utilization alerts: overallocated (>100%), underutilized (<60%)
**AC20:** Performance metrics: billable %, non-billable %, avg weekly hours

---

## Technical Implementation

```typescript
// TOIL accrual on timesheet approval
const toil_accrued = Math.max(0, logged_hours - contracted_hours);

await db.update(leaveBalances)
  .set({ toilBalance: sql`toil_balance + ${toil_accrued}` })
  .where(eq(leaveBalances.userId, userId));

// TOIL redemption validation
if (leaveType === "toil" && daysCount * 7.5 > toilBalance) {
  throw new Error("Insufficient TOIL balance");
}

// Staff statistics query
const stats = await db
  .select({
    userId: timeEntries.userId,
    totalHours: sum(timeEntries.hours),
    utilization: sql`(SUM(hours) / capacity) * 100`,
  })
  .from(timeEntries)
  .innerJoin(staffCapacity, eq(timeEntries.userId, staffCapacity.userId))
  .groupBy(timeEntries.userId);
```

---

## Definition of Done

- [ ] TOIL accrual calculation implemented
- [ ] TOIL balance tracking functional
- [ ] TOIL redemption via leave working
- [ ] TOIL widgets and history views
- [ ] Staff statistics UI at `/admin/staff/statistics`
- [ ] Utilization cards and charts
- [ ] Department aggregations
- [ ] Heatmap and CSV export
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR23 + FR24)
