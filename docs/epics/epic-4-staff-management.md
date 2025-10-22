# Epic 4: Staff Management & Operations - Brownfield Enhancement

**Epic ID:** EPIC-4
**Status:** Draft
**Tier:** 4
**Estimated Effort:** 30-40 days
**Priority:** Medium
**Created:** 2025-10-22

---

## Epic Goal

Implement comprehensive staff management systems including department organization, capacity planning, working patterns, holiday/leave management, time in lieu tracking, staff statistics, and work type configuration to achieve operational maturity and enable data-driven resource management.

---

## Epic Description

### Existing System Context

**Current State:**
- Practice Hub has basic user management (users table, role-based access)
- No department organization exists
- No capacity planning or utilization tracking
- No working patterns management (contracted hours)
- No holiday/leave request system
- No TOIL (Time Off In Lieu) tracking
- Basic role-level staff statistics exist (by role only, not individual)
- Work types are enum-based (workTypeEnum), not customizable per tenant

**Technology Stack:**
- Frontend: Next.js 15 App Router, React 19, Tailwind CSS v4, shadcn/ui
- Backend: tRPC, Better Auth, Drizzle ORM
- Database: PostgreSQL 15+ with application-level multi-tenancy
- Admin Panel: app/admin/ for staff management features

**Integration Points:**
- tRPC routers: users.ts (extend), new departments.ts, staffCapacity.ts, workingPatterns.ts, leave.ts, workTypes.ts
- Admin Panel: app/admin/departments/, app/admin/staff/capacity/, app/admin/leave/approvals/
- Timesheet system: app/client-hub/time/ (integrate TOIL accrual)
- Database schema: departments, staffCapacity, workingPatterns, leaveRequests, leaveBalances, workTypes tables

### Enhancement Details

**What's Being Added/Changed:**

This epic implements 7 staff management features (15 individual capabilities):

1. **Department Management (FR19)** - 1 feature
   - Department CRUD with manager assignment
   - User assignment to departments
   - **Status:** No departments table exists
   - **Value:** Organizational structure foundation

2. **Staff Capacity Planning (FR20)** - 2 features
   - Capacity tracking (weekly hours per staff)
   - Utilization dashboards and alerts
   - **Status:** Capacity planning completely missing
   - **Value:** Resource management visibility

3. **Working Patterns (FR21)** - 1 feature
   - Working hours patterns (full-time, part-time, flexible)
   - Day-by-day hour tracking
   - **Status:** Working patterns missing
   - **Value:** Accurate capacity calculations

4. **Holiday/Leave System (FR22)** - 4 features
   - Leave requests with approval workflow
   - Leave balances tracking
   - Leave calendar showing team availability
   - Public holiday integration
   - **Status:** Holiday/leave management completely absent
   - **Value:** Operational maturity for staff scheduling

5. **Time in Lieu Tracking (FR23)** - 2 features
   - TOIL accrual from overtime
   - TOIL redemption via leave requests
   - **Status:** TOIL tracking missing
   - **Value:** Flexible working arrangements support

6. **Staff Statistics Dashboard (FR24)** - 2 features
   - Individual staff utilization analytics
   - Department-level aggregations
   - **Status:** Basic role-level stats exist, missing individual analytics
   - **Value:** Performance visibility per staff member

7. **Work Type Management UI (FR25)** - 2 features
   - Migrate from enum to database table
   - Admin UI for work type configuration
   - **Status:** Work types are enum-based (not tenant-customizable)
   - **Value:** Per-tenant work type customization

**How It Integrates:**
- Departments: New departments table, add departmentId to users table
- Capacity: New staffCapacity table, integrate with timesheet tracking for utilization calculation
- Working patterns: New workingPatterns table, integrate with capacity calculations
- Leave: New leaveRequests/leaveBalances tables, approval workflow similar to time approval (Epic 2)
- TOIL: Integrate with timesheet approval (Epic 2), calculate accrual on approval
- Statistics: Extend existing staff statistics with individual performance metrics
- Work types: Migrate workTypeEnum to workTypes table, update timeEntries FK

**Success Criteria:**
- [ ] Departments created with manager assignments and staff assignments
- [ ] Staff capacity tracked with weekly hours per staff member
- [ ] Utilization dashboards showing capacity vs actual hours with alerts
- [ ] Working patterns configured for all staff (full-time, part-time, flexible)
- [ ] Leave requests submitted, approved/rejected with balance tracking
- [ ] Leave calendar showing team availability and conflicts
- [ ] TOIL accrued from overtime and redeemed via leave requests
- [ ] Staff statistics showing individual utilization and department aggregations
- [ ] Work types migrated to database with tenant-customizable types
- [ ] Zero regressions in existing user management/timesheet functionality

---

## Stories

### Story 1: Department Management & Staff Organization (FR19)
**Effort:** 2-3 days

Implement department organizational structure with manager assignment and staff assignment to enable department-level reporting and organizational hierarchy.

**Acceptance Criteria:**
- departments table created (tenant_id, name, description, manager_id, created_at, updated_at)
- Admin interface at app/admin/departments/page.tsx
- Department list view with search and filter
- Department create form (name, description, manager selection)
- Department edit form with manager reassignment
- Department soft delete (is_active flag)
- Add departmentId field to users table (FK to departments.id)
- User edit form: department assignment dropdown
- Department manager selection: dropdown of tenant users with manager/admin role
- Department-level reporting: aggregate metrics by department
- Department filtering in staff lists: filter users by department
- Department filtering in reports: filter data by department
- Department card showing: name, manager, staff count, description
- tRPC procedures: departments.list, departments.create, departments.update, departments.delete, departments.getById, departments.getStaffByDepartment

**Technical Notes:**
- Department manager is a user reference (manager_id FK to users.id)
- Add index on users.department_id for filtering performance
- Soft delete: set is_active = false instead of DELETE
- Seed sample departments: "Tax", "Audit", "Advisory", "Admin"

---

### Story 2: Staff Capacity Planning & Utilization Tracking (FR20)
**Effort:** 3-5 days

Implement staff capacity tracking with weekly hours configuration and utilization dashboards showing capacity vs actual hours with overallocation alerts.

**Acceptance Criteria:**
- staffCapacity table created (user_id, effective_from, weekly_hours, notes, created_at, updated_at)
- Capacity interface at app/admin/staff/capacity/page.tsx
- Capacity list view: all staff with current capacity
- Capacity entry form: user selection, effective date, weekly hours, notes
- Capacity history view: timeline of capacity changes per staff
- Utilization calculation: (actual hours / capacity hours) × 100%
- Utilization dashboard per-staff: card showing name, capacity, actual, utilization %
- Utilization trend charts: 12-week utilization line chart per staff
- Overallocation alerts: red indicator if assigned hours > capacity hours
- Underutilization alerts: yellow indicator if logged hours < capacity × 0.75
- Capacity vs actual comparison charts: bar chart comparing capacity to actual by week/month
- Workload balancing recommendations: suggest staff with available capacity
- Staff capacity widget in dashboard: "Team at 87% capacity (23/30 staff active)"
- tRPC procedures: staffCapacity.list, staffCapacity.create, staffCapacity.update, staffCapacity.getUtilization, staffCapacity.getHistory, staffCapacity.getUtilizationTrends

**Technical Notes:**
- Calculate actual hours: SUM(timeEntries.hours) GROUP BY user_id, week
- Calculate utilization: (actual_hours / capacity_hours) × 100
- Use effective_from for historical capacity tracking (capacity changes over time)
- Utilization color coding: <60% yellow, 60-100% green, >100% red
- Query optimization: create materialized view for utilization calculations if slow

---

### Story 3: Working Patterns & Flexible Arrangements (FR21)
**Effort:** 2-3 days

Implement working patterns management with day-by-day hour tracking to support flexible working arrangements and enable accurate capacity calculations.

**Acceptance Criteria:**
- workingPatterns table created (user_id, pattern_type, contracted_hours, monday_hours, tuesday_hours, wednesday_hours, thursday_hours, friday_hours, saturday_hours, sunday_hours, effective_from, notes, created_at, updated_at)
- Working patterns interface at app/admin/staff/working-patterns/page.tsx
- Pattern list view: all staff with current working pattern
- Pattern entry form: user selection, pattern type dropdown, day-by-day hours inputs
- Pattern type options: "full_time" (37.5h), "part_time", "compressed_hours", "job_share", "custom"
- Pattern templates: predefined templates for common patterns (e.g., "Standard Full-Time: Mon-Fri 7.5h each")
- Pattern history view: timeline of pattern changes per staff
- Pattern-aware capacity calculations: use working pattern hours instead of fixed weekly hours
- Integration with time tracking: validate timesheet hours against working pattern
- Flexible arrangements support: compressed hours (e.g., 4×9.5h days), job share (split role)
- Working pattern summary: "John Smith: Mon-Thu 9h, Fri off (36h/week)"
- tRPC procedures: workingPatterns.list, workingPatterns.create, workingPatterns.update, workingPatterns.getByUser, workingPatterns.getActive

**Technical Notes:**
- contracted_hours: total weekly hours (e.g., 37.5)
- day_hours fields: hours per specific day (e.g., monday_hours: 7.5)
- SUM(monday_hours + tuesday_hours + ... + sunday_hours) should equal contracted_hours
- Use effective_from for historical pattern tracking
- Integrate with staffCapacity: use workingPattern.contracted_hours for capacity
- Seed standard patterns: "Standard Full-Time (37.5h)", "Part-Time 20h", "Compressed 4-day (36h)"

---

### Story 4: Holiday/Leave Request System (FR22)
**Effort:** 3-5 days

Implement comprehensive holiday/leave management with request submission, manager approval, balance tracking, leave calendar, and public holiday integration.

**Acceptance Criteria:**
- leaveRequests table created (user_id, leave_type, start_date, end_date, days_count, status, requested_at, reviewed_by, reviewed_at, reviewer_comments, notes, tenant_id)
- leaveBalances table created (user_id, year, annual_entitlement, annual_used, sick_used, toil_balance, carried_over, tenant_id)
- Leave request interface at app/client-hub/leave/page.tsx
- Leave request form: type selection, date range picker, notes textarea
- Leave type options: "annual_leave", "sick_leave", "toil", "unpaid", "other"
- Date range validation: prevent overlapping leave requests, prevent past dates
- Days count calculation: working days between start and end (exclude weekends, public holidays)
- Leave balance validation: prevent if insufficient annual leave balance
- Manager approval interface at app/admin/leave/approvals/page.tsx
- Approval list: pending leave requests with user, dates, type, days count
- Bulk approve/reject actions
- Individual approve/reject with comments
- Leave calendar at app/client-hub/leave/calendar/page.tsx showing team availability
- Leave calendar: month view with leave requests, color-coded by type
- Leave balance widget: "15 days remaining (25 entitlement - 10 used)"
- Leave conflict detection: alert if multiple team members request same dates
- Leave notification emails: submitted, approved, rejected
- Leave carryover logic: transfer unused annual leave to next year (capped at 5 days)
- Public holiday integration: UK bank holidays list (fetch from gov.uk API or hardcode)
- Leave history: timeline of leave requests per user
- tRPC procedures: leave.request, leave.approve, leave.reject, leave.cancel, leave.getBalance, leave.getCalendar, leave.getHistory, leave.getTeamLeave

**Technical Notes:**
- Calculate working days: exclude weekends (Sat/Sun), exclude public holidays
- Use date-fns for date calculations: `differenceInBusinessDays(endDate, startDate)`
- Public holidays: store in publicHolidays table or use external API
- Leave balance: initialize on user creation (annual_entitlement from contract)
- Carryover: run annual job to transfer unused leave (max 5 days)
- Color coding: annual (green), sick (red), toil (blue), unpaid (gray)

---

### Story 5: Time in Lieu Tracking & Staff Statistics (FR23 + FR24)
**Effort:** 3-4 days

Implement TOIL accrual from overtime and redemption via leave requests, plus enhance staff statistics with individual utilization analytics and department aggregations.

**Acceptance Criteria (TOIL Tracking - FR23):**
- TOIL accrual calculation: overtime hours beyond contracted (logged_hours - contracted_hours)
- TOIL balance field in leaveBalances table (toil_balance)
- TOIL accrual triggered by timesheet approval: calculate hours > contracted, add to balance
- Integration with working patterns: use workingPattern.contracted_hours for accrual calculation
- TOIL redemption via leave request: leave_type = "toil", deduct from toil_balance
- TOIL balance widget in dashboard: "TOIL Balance: 14.5 hours (1.9 days)"
- TOILI accrual history view: timeline showing when TOIL earned and used
- TOIL expiry policy (optional): expires after 6 months (configurable)
- TOIL expiry notifications: email when TOIL approaching expiry (30 days before)
- TOIL accrual detail: show which week/timesheet generated TOIL

**Acceptance Criteria (Staff Statistics - FR24):**
- Individual staff utilization cards at app/admin/staff/statistics/page.tsx
- Utilization card per staff: photo, name, role, department, hours (this week), utilization %
- 12-week utilization trend chart per staff: line chart showing utilization over time
- Department-level utilization aggregations: "Tax Department: 92% utilization (3 staff)"
- Staff comparison table: sortable table with columns (name, role, dept, hours, utilization %)
- Filters: by status (active/inactive), role, department, date range
- Utilization heatmap: staff × weeks grid, color-coded by utilization % (green/yellow/red)
- Export staff stats to CSV: download button for reporting
- Utilization alerts: list of overallocated (>100%) and underutilized (<60%) staff
- Performance metrics: billable hours %, non-billable hours %, average weekly hours

**Technical Notes:**
- TOIL accrual: calculate on timesheet approval (Epic 2 integration)
- Formula: `toil_accrued = MAX(0, logged_hours - contracted_hours)`
- Store TOIL in hours (decimal), display in days (hours / 7.5)
- TOIL redemption: validate balance before leave approval
- Staff statistics: query timeEntries aggregated by user, week
- Heatmap: use Recharts or custom CSS grid

---

### Story 6: Work Type Migration to Database (FR25)
**Effort:** 3-4 days

Migrate work types from enum to database table to enable per-tenant customization with admin UI for work type configuration.

**Acceptance Criteria:**
- workTypes table created (tenant_id, code, label, color_code, is_active, sort_order, is_billable, created_at, updated_at)
- Migrate existing workTypeEnum values to seed data
- Admin interface at app/admin/settings/work-types/page.tsx
- Work type list view: all work types with color indicators
- Work type create form: code (unique), label, color picker, billable checkbox
- Work type edit form: update label, color, billable flag
- Work type soft delete: is_active flag (don't hard delete, preserve historical data)
- Sort order drag-and-drop: reorder work types for UI display
- Color picker component: select color for work type badge
- Update timeEntries.workType: change from enum to text FK (references workTypes.code)
- Migration script: convert existing enum values to workTypes records per tenant
- Seed default work types per tenant: "Work", "Admin", "Training", "Meeting", "Holiday", "Sick"
- Work type color display: badges in timesheet showing color-coded work types
- tRPC procedures: workTypes.list, workTypes.create, workTypes.update, workTypes.softDelete, workTypes.reorder

**Technical Notes:**
- Schema change: `workType: text("work_type").references(() => workTypes.code)`
- Seed migration: for each tenant, create default workTypes records
- Seed data: insert default work types in scripts/seed.ts
- Color codes: store as hex (#FF5733) or CSS color name (red-500)
- Preserve historical data: soft delete ensures old timeEntries still reference work types
- Unique constraint: (tenant_id, code) to prevent duplicate codes per tenant

---

## Compatibility Requirements

- [x] Existing APIs remain unchanged (only additions: departments, staffCapacity, workingPatterns, leave, workTypes routers)
- [x] Database schema changes are backward compatible (new tables: departments, staffCapacity, workingPatterns, leaveRequests, leaveBalances, workTypes; add departmentId to users; migrate workType from enum to FK)
- [x] UI changes follow existing patterns (GlobalHeader/Sidebar, glass-card, shadcn/ui)
- [x] Performance impact is minimal (capacity/utilization queries optimized with indexes)
- [x] Multi-tenant isolation enforced (all queries filter by tenantId)

**Schema Changes Required:**
```typescript
// departments table
export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: text("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add to users table
departmentId: text("department_id").references(() => departments.id),

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

// workingPatterns table
export const workingPatterns = pgTable("working_patterns", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  patternType: text("pattern_type").notNull(), // "full_time" | "part_time" | "compressed_hours" | "job_share" | "custom"
  contractedHours: real("contracted_hours").notNull(),
  mondayHours: real("monday_hours").default(0).notNull(),
  tuesdayHours: real("tuesday_hours").default(0).notNull(),
  wednesdayHours: real("wednesday_hours").default(0).notNull(),
  thursdayHours: real("thursday_hours").default(0).notNull(),
  fridayHours: real("friday_hours").default(0).notNull(),
  saturdayHours: real("saturday_hours").default(0).notNull(),
  sundayHours: real("sunday_hours").default(0).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// leaveRequests table
export const leaveRequests = pgTable("leave_requests", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  leaveType: text("leave_type").notNull(), // "annual_leave" | "sick_leave" | "toil" | "unpaid" | "other"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysCount: real("days_count").notNull(),
  status: text("status").notNull(), // "pending" | "approved" | "rejected" | "cancelled"
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
  annualEntitlement: real("annual_entitlement").notNull(), // e.g., 25 days
  annualUsed: real("annual_used").default(0).notNull(),
  sickUsed: real("sick_used").default(0).notNull(),
  toilBalance: real("toil_balance").default(0).notNull(), // in hours
  carriedOver: real("carried_over").default(0).notNull(),
});

// workTypes table
export const workTypes = pgTable("work_types", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  code: text("code").notNull(), // "WORK", "ADMIN", "TRAINING", etc.
  label: text("label").notNull(), // "Work", "Admin", "Training"
  colorCode: text("color_code").notNull(), // "#3b82f6" or "blue-500"
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isBillable: boolean("is_billable").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Update timeEntries.workType
// Before: workType: workTypeEnum("work_type")
// After: workType: text("work_type").references(() => workTypes.code).notNull()
```

---

## Risk Mitigation

**Primary Risks:**

1. **Scope Creep - Largest Epic**
   - **Risk:** 30-40 day estimate makes this the largest epic, risk of scope expansion
   - **Mitigation:** Strict scope adherence to FR19-FR25 only; defer enhancements to Phase 2; focus on MVP features
   - **Impact:** Epic timeline extends to 40-50 days
   - **Likelihood:** Medium | **Severity:** Medium

2. **Leave System Complexity**
   - **Risk:** Leave balance calculations, carryover logic, public holiday integration more complex than estimated
   - **Mitigation:** Start with simple annual leave, iterate to advanced features; use date-fns for reliable date calculations; defer public holiday integration to later sprint if needed
   - **Impact:** Leave system story extends 2-3 days
   - **Likelihood:** Medium | **Severity:** Low

3. **TOIL Accrual Edge Cases**
   - **Risk:** Overtime calculation edge cases (part-time staff, compressed hours, holiday weeks)
   - **Mitigation:** Use working patterns for accurate contracted hours; clear business rules for accrual; extensive testing with various scenarios
   - **Impact:** TOIL accrual produces incorrect balances requiring manual adjustments
   - **Likelihood:** Medium | **Severity:** Medium

4. **Work Type Migration Data Loss**
   - **Risk:** Migrating work types from enum to table could break existing timeEntries references
   - **Mitigation:** Migration script carefully maps enum values to workTypes.code; test on copy of production data; rollback plan preserves enum fallback
   - **Impact:** Timesheet data displays incorrect work types
   - **Likelihood:** Low | **Severity:** High

**Rollback Plan:**
- Departments: Remove departments table, remove departmentId from users
- Capacity/patterns: Remove staffCapacity, workingPatterns tables (no impact on core functionality)
- Leave: Remove leaveRequests, leaveBalances tables
- TOIL: Remove TOIL accrual logic, remove toil_balance field
- Statistics: Revert to basic role-level stats (existing state)
- Work types: Revert timeEntries.workType to enum, remove workTypes table

---

## Definition of Done

- [x] All 6 stories completed with acceptance criteria met
- [x] Departments created with staff and manager assignments
- [x] Staff capacity tracked with utilization dashboards and alerts
- [x] Working patterns configured for all staff members
- [x] Leave requests submitted, approved, and tracked with balances
- [x] Leave calendar showing team availability and conflicts
- [x] TOIL accrued from overtime and redeemed via leave
- [x] Staff statistics showing individual and department analytics
- [x] Work types migrated to database with admin configuration UI
- [x] Unit tests written for all new tRPC mutations (capacity, leave, workTypes)
- [x] Integration tests for leave balance calculations, TOIL accrual, utilization calculations
- [x] E2E tests for leave request workflow, capacity tracking, work type configuration
- [x] Multi-tenant isolation tests (validate tenantId filtering across all new features)
- [x] Performance tests for utilization queries (>100 staff, >10000 timeEntries)
- [x] Seed data updated with sample departments, capacities, patterns, leave balances, work types
- [x] Documentation updated: leave policies, TOIL accrual rules, utilization calculations, work type migration guide
- [x] Code reviewed with focus on TOIL calculations, leave balance logic, work type migration
- [x] Performance benchmarks met (<3s page loads, <500ms API, utilization queries <2s)
- [x] No regressions in existing user management/timesheet functionality
- [x] Feature deployed to staging and tested by QA
- [x] User acceptance testing completed for leave workflow

---

## Dependencies

**Upstream Dependencies:**
- Epic 2 (High-Impact Workflows) completed for time approval workflow (TOIL accrual depends on timesheet approval)
- Epic 3 (Advanced Features) completed for task templates (capacity planning templates - optional)

**Downstream Dependencies:**
- Epic 6 (Polish) benefits from leave balances (notification preferences for leave alerts)

**External Dependencies:**
- date-fns library for date calculations (already installed)
- UK public holidays list (gov.uk API or hardcoded list)

---

## Success Metrics

**Quantitative:**
- Departments: 100% of staff assigned to departments within 2 weeks
- Capacity: 100% of staff have capacity configured within 1 week
- Working patterns: 100% of staff have patterns configured within 1 week
- Leave requests: >50 leave requests submitted in first month
- TOIL: >20 staff accrue TOIL in first month
- Utilization: >10 utilization reports viewed per week
- Work types: All tenants migrate to custom work types within 1 week

**Qualitative:**
- Departments provide organizational structure for reporting
- Capacity planning enables data-driven resource allocation decisions
- Working patterns support flexible working arrangements
- Leave system eliminates manual spreadsheet tracking
- TOIL tracking supports work-life balance initiatives
- Staff statistics provide performance visibility
- Work types enable tenant-specific customization

---

## Notes

- This is the largest epic (30-40 days) - consider splitting into 2 epics if needed:
  - Epic 4A: Organization & Capacity (FR19-FR21) - 7-11 days
  - Epic 4B: Leave & Analytics (FR22-FR25) - 23-29 days
- Leave system approval workflow similar to time approval (Epic 2) - reuse patterns
- TOIL accrual integrates with timesheet approval (Epic 2 dependency)
- Work type migration is critical - test thoroughly to prevent data loss
- Utilization calculations may need materialized views for performance at scale

---

**Epic Owner:** PM Agent (John)
**Created:** 2025-10-22
**Last Updated:** 2025-10-22
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (Tier 4)
