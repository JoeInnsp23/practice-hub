# User Story: Staff Capacity Planning & Utilization Tracking

**Story ID:** STORY-4.2
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR20 - Staff Capacity Planning & Utilization
**Priority:** Medium
**Effort:** 3-5 days
**Status:** Ready for Development

---

## User Story

**As a** practice manager
**I want** staff capacity tracking with utilization dashboards and overallocation alerts
**So that** I can optimize resource allocation and prevent staff burnout

---

## Business Value

- **Resource Management:** Visibility into staff capacity and utilization
- **Alerts:** Overallocation and underutilization warnings
- **Decision Making:** Data-driven workload balancing

---

## Acceptance Criteria

**AC1:** staffCapacity table created (user_id, effective_from, weekly_hours, notes)
**AC2:** Capacity interface at `/admin/staff/capacity`
**AC3:** Capacity entry form: user, effective date, weekly hours, notes
**AC4:** Capacity history view per staff
**AC5:** Utilization calculation: (actual hours / capacity hours) × 100%
**AC6:** Utilization dashboard showing per-staff cards with name, capacity, actual, %
**AC7:** Utilization trend charts (12-week line chart per staff)
**AC8:** Overallocation alerts (red if assigned > capacity)
**AC9:** Underutilization alerts (yellow if logged < 75% capacity)
**AC10:** Workload balancing recommendations
**AC11:** Dashboard widget: "Team at 87% capacity"
**AC12:** tRPC: staffCapacity.list, create, update, getUtilization, getHistory, getUtilizationTrends

---

## Technical Implementation

```typescript
// staffCapacity table
export const staffCapacity = pgTable("staff_capacity", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  weeklyHours: real("weekly_hours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Utilization calculation
const utilization = (actual_hours / capacity_hours) * 100;
// Color coding: <60% yellow, 60-100% green, >100% red
```

---

## Definition of Done

- [ ] staffCapacity table created
- [ ] Capacity UI at `/admin/staff/capacity`
- [ ] Utilization calculations functional
- [ ] Dashboards and alerts working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR20)
