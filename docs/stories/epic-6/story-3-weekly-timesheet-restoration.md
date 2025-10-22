# User Story: Weekly Timesheet Full Restoration

**Story ID:** STORY-6.3
**Epic:** Epic 6 - Polish & Enhancements
**Feature:** FR34 - Weekly Timesheet Full Restoration (BONUS)
**Priority:** Low
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** staff member
**I want** full weekly timesheet features from archived CRM restored (TOIL/holiday widgets, week grid, submission)
**So that** I have complete timesheet functionality achieving 100% feature parity

---

## Business Value

- **Feature Parity:** Achieves 100% parity with archived CRM
- **User Experience:** Familiar workflow for migrated users
- **Completeness:** Comprehensive weekly time management

---

## Acceptance Criteria

**AC1:** Dedicated weekly timesheet component (enhance timesheet-grid)
**AC2:** Week-at-a-glance grid: 7 days (Mon-Sun) × work types
**AC3:** Daily row totals: sum of hours per day
**AC4:** Weekly total: sum of all hours for week
**AC5:** TOIL balance widget: "TOIL Balance: 14.5 hours (1.9 days)"
**AC6:** Holiday balance widget: "Leave Remaining: 15 days (25 - 10 used)"
**AC7:** Week submission workflow: "Submit Week" button
**AC8:** Submission validation: warn if < 37.5 hours
**AC9:** Approval status indicator: "Pending Approval" | "Approved" | "Rejected" badge
**AC10:** Rejected week: show comments, allow resubmission
**AC11:** Minimum hours warning: highlight row if daily < expected
**AC12:** Week navigation: Previous/Next buttons, date picker
**AC13:** Copy previous week: "Copy Last Week" button
**AC14:** Quick add: keyboard shortcuts (Tab next, Enter save)
**AC15:** Weekly summary card: total, billable %, work type breakdown (pie chart)
**AC16:** Integration with time approval workflow (Epic 2)

---

## Technical Implementation

```typescript
// Weekly timesheet component
export function WeeklyTimesheetView({ weekStartDate }: { weekStartDate: Date }) {
  const { data: entries } = trpc.timesheets.getWeek.useQuery({ weekStartDate });
  const { data: toilBalance } = trpc.leave.getBalance.useQuery({ userId });
  const { data: holidayBalance } = trpc.leave.getBalance.useQuery({ userId });
  const { data: submission } = trpc.timesheets.getSubmissionStatus.useQuery({ weekStartDate });

  const submitWeek = trpc.timesheets.submit.useMutation();

  return (
    <div className="space-y-4">
      {/* TOIL & Holiday Balance Widgets */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>TOIL Balance</CardHeader>
          <CardContent>{toilBalance.toilBalance} hours ({(toilBalance.toilBalance / 7.5).toFixed(1)} days)</CardContent>
        </Card>
        <Card>
          <CardHeader>Leave Remaining</CardHeader>
          <CardContent>{holidayBalance.annualEntitlement - holidayBalance.annualUsed} days</CardContent>
        </Card>
      </div>

      {/* Week Grid */}
      <TimesheetGrid entries={entries} weekStartDate={weekStartDate} />

      {/* Submit Week */}
      {!submission && (
        <Button onClick={() => submitWeek.mutate({ weekStartDate, weekEndDate })}>
          Submit Week
        </Button>
      )}

      {/* Submission Status */}
      {submission && (
        <Badge>{submission.status}</Badge>
      )}
    </div>
  );
}
```

**Reference:** `.archive/practice-hub/crm-app/main/src/components/WeeklyTimesheet.tsx`

---

## Definition of Done

- [ ] Weekly timesheet component enhanced
- [ ] Week grid functional with totals
- [ ] TOIL & holiday balance widgets displayed
- [ ] Week submission workflow integrated
- [ ] Validation and warnings working
- [ ] Navigation and quick add functional
- [ ] Summary card with charts
- [ ] Integration with Epic 2 time approval
- [ ] Multi-tenant isolation verified
- [ ] Tests written

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-6 - Polish & Enhancements
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR34)
