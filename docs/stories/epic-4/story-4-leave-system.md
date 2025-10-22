# User Story: Holiday/Leave Request System

**Story ID:** STORY-4.4
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR22 - Holiday/Leave Management
**Priority:** Medium
**Effort:** 3-5 days
**Status:** Ready for Development

---

## User Story

**As a** staff member
**I want** comprehensive holiday/leave management with requests, approvals, and balance tracking
**So that** I can manage my leave and managers can approve team leave efficiently

---

## Business Value

- **Operational Maturity:** Professional leave management system
- **Transparency:** Clear leave balances and calendar visibility
- **Compliance:** Tracked annual entitlements and usage

---

## Acceptance Criteria

**AC1:** leaveRequests table created (user_id, leave_type, start_date, end_date, days_count, status, reviewer fields)
**AC2:** leaveBalances table created (user_id, year, annual_entitlement, annual_used, sick_used, toil_balance, carried_over)
**AC3:** Leave request interface at `/client-hub/leave`
**AC4:** Request form: type (annual_leave, sick_leave, toil, unpaid, other), date range, notes
**AC5:** Date validation: prevent overlaps, past dates
**AC6:** Days count calculation: working days (exclude weekends, public holidays)
**AC7:** Balance validation: prevent if insufficient annual leave
**AC8:** Manager approval interface at `/admin/leave/approvals`
**AC9:** Approval list with bulk approve/reject
**AC10:** Leave calendar at `/client-hub/leave/calendar` (month view, color-coded)
**AC11:** Leave balance widget: "15 days remaining (25 - 10 used)"
**AC12:** Conflict detection: alert if team members request same dates
**AC13:** Email notifications: submitted, approved, rejected
**AC14:** Carryover logic: transfer unused leave to next year (max 5 days)
**AC15:** Public holiday integration (UK bank holidays)
**AC16:** Leave history per user
**AC17:** tRPC: leave.request, approve, reject, cancel, getBalance, getCalendar, getHistory, getTeamLeave

---

## Technical Implementation

```typescript
// leaveRequests table
export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysCount: real("days_count").notNull(),
  status: text("status").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewerComments: text("reviewer_comments"),
  notes: text("notes"),
});

// leaveBalances table
export const leaveBalances = pgTable("leave_balances", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  year: integer("year").notNull(),
  annualEntitlement: real("annual_entitlement").notNull(),
  annualUsed: real("annual_used").default(0).notNull(),
  sickUsed: real("sick_used").default(0).notNull(),
  toilBalance: real("toil_balance").default(0).notNull(),
  carriedOver: real("carried_over").default(0).notNull(),
});

// Calculate working days
import { differenceInBusinessDays } from "date-fns";
const daysCount = differenceInBusinessDays(endDate, startDate) + 1;

// Color coding: annual (green), sick (red), toil (blue), unpaid (gray)
```

---

## Definition of Done

- [ ] leaveRequests, leaveBalances tables created
- [ ] Leave request UI functional
- [ ] Manager approval interface working
- [ ] Leave calendar displaying
- [ ] Balance calculations correct
- [ ] Conflict detection working
- [ ] Email notifications sent
- [ ] Carryover logic implemented
- [ ] Public holidays integrated
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR22)
