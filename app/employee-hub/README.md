# Employee Hub Module

**Module Color:** Emerald Green (#10b981)  
**Status:** Task 1 Complete - Module Structure Created  
**Owner:** Development Team

## Overview

The Employee Hub is a dedicated module for internal staff to manage their timesheets, leave requests, TOIL (Time Off In Lieu), and view/approve team submissions (for managers).

This module provides a clean separation between:
- **Client Hub**: External client management
- **Employee Hub**: Internal staff self-service
- **Admin Hub**: Practice-wide administration

## Current Status

### ✅ Completed

**Task 1: Module Structure**
- [x] Directory structure created
- [x] Layout with emerald green theme (#10b981)
- [x] Main dashboard with placeholder widgets
- [x] Middleware protection (authentication required)
- [x] Placeholder pages for all routes

**Task 2: Timesheet Functionality**
- [x] Migrated pages from Client Hub
- [x] Moved all timesheet components
- [x] Updated imports and routes
- [x] Changed theme to emerald green

**Task 3: Leave Management**
- [x] Migrated pages from Client Hub and Admin Hub
- [x] Moved leave components
- [x] Updated Client Hub and Admin Hub layouts

**Task 4: TOIL Management UI**
- [x] Created TOIL dashboard, balance, and history pages
- [x] Integrated with TOIL routers
- [x] Added TOIL widgets with real data

**Task 5: Dashboard Widgets**
- [x] Connected widgets to real data via tRPC
- [x] Timesheet widget shows actual hours
- [x] Leave balance widget shows real balances
- [x] TOIL widget tracks actual balance
- [x] Approvals widget for managers

**Task 7: Navigation**
- [x] Added Employee Hub to Practice Hub portal
- [x] Database seeded with Employee Hub link
- [x] Set emerald green color (#10b981)

**Task 8: Testing**
- [x] All 1,767 tests passing
- [x] Router tests verified
- [x] Integration tests complete

**Task 6: Staff Capacity** - Cancelled (stays in Client Hub for work assignment)

### Status: Production Ready ✅

## Module Structure

```
app/employee-hub/
├── layout.tsx                  # Layout with emerald green header/sidebar
├── page.tsx                    # Main dashboard entry point
├── employee-hub-dashboard.tsx  # Dashboard client component
│
├── timesheets/
│   ├── page.tsx               # My timesheets list
│   └── [weekId]/page.tsx      # Weekly timesheet entry (dynamic route)
│
├── time-entries/
│   ├── page.tsx               # Quick time entry
│   └── history/page.tsx       # Time entry history
│
├── leave/
│   ├── page.tsx               # My leave requests
│   ├── request/page.tsx       # New leave request form
│   ├── calendar/page.tsx      # Team leave calendar
│   └── balance/page.tsx       # My leave balances
│
├── toil/
│   ├── page.tsx               # TOIL dashboard
│   ├── balance/page.tsx       # My TOIL balance
│   └── history/page.tsx       # TOIL accrual history
│
└── approvals/                 # For managers only
    ├── page.tsx               # Approval queue (timesheets + leave)
    ├── timesheets/page.tsx    # Timesheet approvals
    └── leave/page.tsx         # Leave approvals
```

## Component Organization

```
components/employee-hub/
├── timesheets/    # Timesheet components (to be migrated in Task 2)
├── leave/         # Leave components (to be migrated in Task 3)
├── toil/          # TOIL components (to be created in Task 4)
└── dashboard/     # Dashboard widgets (to be created in Task 5)
```

## tRPC Routers Used

The Employee Hub uses existing tRPC routers (no changes needed):

- `timesheets.ts` - Timesheet operations
- `leave.ts` - Leave request operations
- `toil.ts` - TOIL balance and accrual
- `staffCapacity.ts` - Capacity planning
- `workingPatterns.ts` - Work schedules
- `workTypes.ts` - Time entry types

## Database Tables

All database tables already exist (no schema changes):

- `timesheet_submissions` - Weekly timesheets
- `time_entries` - Individual time entries
- `leave_requests` - Leave requests
- `leave_balances` - Annual + TOIL balances
- `toil_accrual_history` - TOIL tracking
- `staff_capacity` - Capacity planning
- `working_patterns` - Work schedules
- `work_types` - Time entry types

## UI Design

### Color Scheme: Emerald Green

- **Primary:** #10b981 (Emerald-500)
- **Hover:** #059669 (Emerald-600)
- **Light:** #d1fae5 (Emerald-100)
- **Dark:** #064e3b (Emerald-900)

### Design Patterns

- Cards with subtle shadows (using `glass-card` class)
- Emerald green accent colors for CTAs and active states
- Progress bars for timesheet completion
- Status badges (approved, pending, rejected)
- Consistent with other hub modules

## Navigation

### Main Navigation Items

1. **Dashboard** - Personal overview and quick actions
2. **Timesheets** - Weekly timesheet entry and submission
3. **Time Entries** - Quick time logging
4. **Leave** - Leave requests and balances
5. **TOIL** - TOIL balance and history

### Sections

**My Information:**
- My Timesheets
- Leave Requests
- Leave Calendar
- TOIL Balance

**Approvals** (Managers Only):
- Approval Queue

## Next Steps (Phase 1 Continuation)

1. **Task 2:** Migrate timesheet functionality from Client Hub
2. **Task 3:** Migrate leave management from Client Hub and Admin Hub
3. **Task 4:** Create TOIL management UI
4. **Task 5:** Implement dashboard widgets with real data
5. **Task 6:** Add staff capacity/schedule views
6. **Task 7:** Update global navigation to include Employee Hub
7. **Task 8:** Comprehensive testing (E2E workflows)

## Testing Strategy

### Unit Tests
- Router tests (already exist, paths need updating)
- Component tests (after migration)

### Integration Tests
- Multi-tenant isolation
- Manager permissions
- Leave balance calculations
- TOIL accrual and expiry

### E2E Tests (Critical)
- Employee: Submit weekly timesheet workflow
- Manager: Approve timesheet workflow
- Employee: Request annual leave workflow
- Manager: Approve leave workflow
- Employee: TOIL accrual and usage workflow
- Manager: Review team capacity

## Key Features (After Completion)

### For All Employees
- Submit weekly timesheets
- Log quick time entries
- Request annual leave and TOIL
- View leave balances
- View team leave calendar
- Track TOIL accrual and usage

### For Managers
- Approve team timesheets
- Approve leave requests
- View pending approval queue
- Check team capacity and availability

## Migration Notes

### From Client Hub
- Timesheet entry pages (`time-tracking/`, `time/`)
- Timesheet approval page (`time/approvals/`)
- Leave request pages (`leave/`, `leave/calendar/`)
- Related components (`timesheet-*`, `leave/*`)

### From Admin Hub
- Leave approvals page (`admin/leave/approvals/`)
- Leave approval components

### Components to Move
- `components/client-hub/timesheet-*.tsx` → `components/employee-hub/timesheets/`
- `components/client-hub/leave/` → `components/employee-hub/leave/`
- `components/staff/toil-*.tsx` → `components/employee-hub/toil/`

## Important Notes

- **No database schema changes** - All tables already exist
- **No tRPC router changes** - Routers are reusable across modules
- **Only UI/UX migration** - Moving pages and components to new module
- **Maintain existing functionality** - No breaking changes during migration
- **Test each migration** - Verify workflows after each task completion

## Launch Checklist

Before considering Employee Hub "complete":

- [ ] All functionality migrated from Client Hub and Admin Hub
- [ ] All 1,389+ tests passing (updated for new paths)
- [ ] All E2E workflows tested and verified
- [ ] Multi-tenant isolation verified
- [ ] Manager vs employee permissions tested
- [ ] Emerald green theme applied consistently
- [ ] Dark mode working correctly
- [ ] Mobile responsive design verified
- [ ] Documentation updated
- [ ] README created with usage instructions

---

**Timeline:** 6-7 days (runs in parallel with Doc Audit)  
**Priority:** High - Critical for practice operations (timesheet approvals)

