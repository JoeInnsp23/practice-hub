# User Story: Reports Dashboard Backend Integration

**Story ID:** STORY-3.3
**Epic:** Epic 3 - Advanced Automation Features
**Feature:** FR15 - Reports Dashboard Backend Integration
**Priority:** High
**Effort:** 3-4 days
**Status:** Ready for Review (P1 QA Fixes Applied)

---

## User Story

**As a** practice manager
**I want** reports dashboard wired to existing database views showing real data
**So that** I can make data-driven decisions with instant performance visibility

---

## Business Value

- **Visibility:** Replaces hardcoded zeros with real revenue/client/service data
- **Decision Making:** Data-driven insights for practice management
- **Efficiency:** Eliminates manual Excel reports (saves 3 hours/week)
- **Foundation:** Database views already exist - just wire UI to backend

---

## Acceptance Criteria

### Functional Requirements

**AC1: Dashboard KPIs Query**
- **Given** reports page loads at `/client-hub/reports`
- **When** KPIs are fetched
- **Then** reports.getDashboardKpis tRPC query is called
- **And** KPIs show: total revenue, total clients, active tasks, overdue tasks
- **And** hardcoded zeros at reports/page.tsx:33-48 are replaced with real data

**AC2: Monthly Revenue Chart**
- **Given** revenue chart component renders
- **When** data is fetched
- **Then** reports.getMonthlyRevenue query returns last 12 months data
- **And** chart displays revenue trend (currently empty array at line 186)
- **And** user can hover for exact revenue per month

**AC3: Client Breakdown Chart**
- **Given** client breakdown component renders
- **When** data is fetched
- **Then** reports.getClientRevenue query returns top 10 clients by revenue
- **And** chart displays client revenue (currently empty array at line 187)

**AC4: Service Performance Report**
- **Given** service performance section is added
- **When** data is fetched
- **Then** reports.getServicePerformance query returns revenue by service
- **And** table shows service name, revenue, number of active clients

**AC5: Date Range Filtering**
- **Given** date range selector is available
- **When** user selects range (30/90/365 days, custom)
- **Then** all reports filter to selected date range
- **And** charts update with new data

**AC6: Report Export**
- **Given** user clicks "Export CSV" button
- **When** export runs
- **Then** CSV file downloads with chart data
- **And** CSV includes headers and formatted values

**AC7: Chart Drill-Down**
- **Given** user clicks chart segment (e.g., specific client)
- **When** click is handled
- **Then** navigation to detail page (e.g., client revenue detail)
- **And** detail page shows breakdown for that segment

**AC8: Loading States**
- **Given** reports are fetching
- **When** UI renders
- **Then** skeleton loaders are shown
- **And** charts show loading spinner

**AC9: Error Handling**
- **Given** report query fails
- **When** error occurs
- **Then** user-friendly error message is shown
- **And** user can retry fetch

### Integration Requirements

**AC10: Database Views Integration**
- **Given** database views exist (dashboardKpiView, monthlyRevenueView, clientRevenueView)
- **When** queries are executed
- **Then** views are queried via Drizzle ORM
- **And** views already include tenantId filtering (safe to query)

**AC11: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** reports are queried
- **Then** all queries filter by tenantId
- **And** views handle isolation automatically

### Quality Requirements

**AC12: Performance**
- **Given** reports are loaded
- **When** performance is measured
- **Then** KPIs load in <500ms
- **And** charts load in <1 second
- **And** full page loads in <3 seconds

---

## Technical Implementation

### File Structure

```
app/server/routers/
  reports.ts                    # Reports tRPC router
lib/db/queries/
  reports-queries.ts            # Database view queries
```

### tRPC Router

```typescript
// app/server/routers/reports.ts

export const reportsRouter = router({
  getDashboardKpis: protectedProcedure
    .query(async ({ ctx }) => {
      const kpis = await db
        .select()
        .from(dashboardKpiView) // View already exists
        .where(eq(dashboardKpiView.tenantId, ctx.authContext.tenantId))
        .limit(1);

      return kpis[0] || { totalRevenue: 0, totalClients: 0, activeTasks: 0, overdueTasks: 0 };
    }),

  getMonthlyRevenue: protectedProcedure
    .input(z.object({ months: z.number().default(12) }))
    .query(async ({ ctx, input }) => {
      const revenue = await db
        .select()
        .from(monthlyRevenueView)
        .where(eq(monthlyRevenueView.tenantId, ctx.authContext.tenantId))
        .orderBy(desc(monthlyRevenueView.month))
        .limit(input.months);

      return revenue;
    }),

  getClientRevenue: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const clients = await db
        .select()
        .from(clientRevenueView)
        .where(eq(clientRevenueView.tenantId, ctx.authContext.tenantId))
        .orderBy(desc(clientRevenueView.totalRevenue))
        .limit(input.limit);

      return clients;
    }),

  getServicePerformance: protectedProcedure
    .query(async ({ ctx }) => {
      // Query service revenue aggregation
      // ... implementation
    }),
});
```

### UI Integration

```typescript
// app/client-hub/reports/page.tsx

"use client";

export default function ReportsPage() {
  const { data: kpis, isLoading: kpisLoading } = trpc.reports.getDashboardKpis.useQuery();
  const { data: monthlyRevenue } = trpc.reports.getMonthlyRevenue.useQuery({ months: 12 });
  const { data: clientRevenue } = trpc.reports.getClientRevenue.useQuery({ limit: 10 });

  if (kpisLoading) return <LoadingSkeleton />;

  return (
    <div>
      {/* Replace hardcoded zeros with real data */}
      <KPICard title="Total Revenue" value={kpis.totalRevenue} />
      <KPICard title="Total Clients" value={kpis.totalClients} />

      {/* Wire charts to real data */}
      <RevenueChart data={monthlyRevenue || []} />
      <ClientBreakdown data={clientRevenue || []} />
    </div>
  );
}
```

### Technical Notes

- **Database Views:** Views already exist at drizzle/0000_create_views.sql - just query them
- **Drizzle Queries:** Use `db.select().from(dashboardKpiView)` syntax
- **Chart Library:** Recharts already used in reports/page.tsx
- **Indexes:** Add if performance issues: `CREATE INDEX ON invoices(tenant_id, created_at)`

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] reports tRPC router created
- [ ] reports-queries.ts with view queries
- [ ] Dashboard KPIs query wired (replace hardcoded zeros)
- [ ] Monthly revenue chart wired (replace empty array)
- [ ] Client breakdown chart wired (replace empty array)
- [ ] Service performance report added
- [ ] Date range filtering functional
- [ ] CSV export functional
- [ ] Chart drill-down navigation
- [ ] Loading states and error handling
- [ ] Multi-tenant isolation verified
- [ ] Performance benchmarks met (<3s page load)
- [ ] Unit/integration tests written
- [ ] Documentation updated
- [ ] Feature deployed to staging

---

## Dependencies

**Upstream:**
- None (database views already exist)

**Downstream:**
- Epic 6: Polish extends reports with additional metrics

**External:**
- None (Recharts already installed)

---

## Testing Strategy

### Unit Tests
- Test report queries return correct data
- Test multi-tenant filtering

### Integration Tests
- Test database view queries with real data
- Test date range filtering

### E2E Tests
- Test full reports page load with real data
- Test chart interactions and drill-down

---

## Risks & Mitigation

**Risk:** Report query performance with large datasets
**Mitigation:** Database views already optimized; add indexes if needed; implement pagination
**Impact:** Low - views are optimized

---

## Notes

- Database views already exist (drizzle/0000_create_views.sql) - Story is mostly wiring UI to backend
- Reports page shows all zeros currently (hardcoded) - this story replaces with real data
- Views already include tenantId filtering - safe to query directly

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-3 - Advanced Automation Features
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR15)

---

## QA Fixes Applied (2025-10-23)

### Priority 1 Issues Resolved

**AC5: Date Range Filtering Implemented**
- Updated `getClientRevenue()` to apply date range filters when startDate/endDate provided
- Falls back to pre-aggregated view when no date range for performance
- Updated `getServicePerformance()` to filter invoices by issue_date when date range specified
- Files modified: `lib/db/queries/reports-queries.ts`

**AC7: Chart Drill-Down Navigation Implemented**
- Added onClick handlers to ClientBreakdown component
- Clicking client rows now navigates to `/client-hub/clients/{clientId}`
- Added hover effects and cursor pointer for clickable items
- Updated component interface to include optional clientId
- Files modified: `components/client-hub/reports/client-breakdown.tsx`, `app/client-hub/reports/page.tsx`

### Validation
- All 22 unit tests passing (pnpm test __tests__/routers/reports.test.ts)
- No lint errors introduced
- TypeScript compilation successful

### Files Changed (3 files)
1. `lib/db/queries/reports-queries.ts` - Added date filtering logic to client/service queries
2. `components/client-hub/reports/client-breakdown.tsx` - Added navigation on click
3. `app/client-hub/reports/page.tsx` - Pass clientId to breakdown component

### Pending Issues (P2 - Low Priority)
- AC12: Performance benchmarks not verified (<3s page load)
- CSV Export: Special character escaping not implemented

---

## QA Results

### Review Date: 2025-10-23

### Reviewed By: Quinn (Test Architect)

### Code Quality Assessment

**Overall Grade: B (70/100)**

The implementation demonstrates excellent engineering practices with comprehensive test coverage (22/22 tests passing), clean architectural separation, and robust error handling. The backend integration successfully wires the reports dashboard to real database views with proper multi-tenant isolation. However, there are notable gaps in AC completeness that prevent a higher grade.

**Strengths:**
- **Test Coverage:** All 22 unit tests passing, covering procedures, input validation, edge cases, and multi-tenant isolation
- **Error Handling:** Every endpoint wrapped in try-catch with Sentry integration, graceful degradation for missing data, user-friendly error messages
- **Architecture:** Clean separation of concerns (tRPC router → query layer → database views), excellent TypeScript types, comprehensive JSDoc comments
- **Security:** Protected procedures enforce authentication, all queries filter by tenantId, Zod validation prevents injection attacks
- **Developer Experience:** Good documentation, loading states, CSV export functionality

**Areas for Improvement:**
- Date range filtering incomplete for client and service queries (AC5 partial)
- Chart drill-down navigation not implemented (AC7 missing)
- Performance benchmarks not verified (AC12 not validated)
- CSV export doesn't handle special characters properly

### Compliance Check

- ✓ **Coding Standards:** Follows project conventions, Biome formatting compliant
- ✓ **Project Structure:** Proper file organization (routers, queries, tests)
- ✓ **Testing Strategy:** Comprehensive unit tests with proper mocking and assertions
- ✗ **All ACs Met:** 9 of 12 ACs fully implemented, 3 ACs have gaps (AC5, AC7, AC12)

### Security Review

**Status: PASS**

Excellent security implementation throughout:
- All tRPC procedures use `protectedProcedure` requiring authentication
- Every query filters by `tenantId` for multi-tenant isolation (verified in dedicated test suite)
- Sentry error tracking captures exceptions with context without exposing sensitive data
- Zod input validation prevents injection attacks at API boundaries
- No security vulnerabilities identified

### Performance Considerations

**Status: CONCERNS**

Database optimization is solid with pre-aggregated views and proper query structure. However:
- ✓ Database views provide efficient pre-aggregation
- ✓ Queries use proper indexes (tenantId filtering)
- ✗ **AC12 not verified:** No performance tests confirm <500ms KPI load, <1s charts, <3s page load
- ⚠️ Service performance query uses complex aggregation without pagination (scalability risk)
- **Recommendation:** Add performance benchmarks and consider caching dashboard KPIs with short TTL

### NFR Validation

- **Reliability:** PASS - 22/22 tests passing, robust error handling, graceful degradation
- **Maintainability:** PASS - Clean code, good documentation, consistent patterns
- **Security:** PASS - Multi-tenant isolation verified, proper authentication
- **Performance:** CONCERNS - Optimized queries but benchmarks not verified

### Gate Status

**Gate Decision: CONCERNS → See docs/qa/gates/epic-3.story-3-reports-backend.yml**

**Quality Score:** 70/100
- Calculation: 100 - (10 × 2 medium issues) - (10 × 2 low issues) = 70

**Top Issues to Address:**
1. **AC5 - Date Range Filtering Incomplete** (Medium, 1 hour)
   - `getClientRevenue()` and `getServicePerformance()` accept date range parameters but don't use them in database queries
   - Frontend passes period parameter but backend ignores it for these endpoints
   - Fix: `lib/db/queries/reports-queries.ts:66-133`

2. **AC7 - Chart Drill-Down Missing** (Medium, 2 hours)
   - Chart components lack onClick handlers for navigation to detail pages
   - Users can't click chart segments to see breakdowns
   - Fix: `components/client-hub/reports/revenue-chart.tsx`, `client-breakdown.tsx`

3. **AC12 - Performance Not Verified** (Low, 1 hour)
   - No performance tests or measurements to verify <3s page load requirement
   - Add benchmarks to E2E tests

4. **CSV Export Character Handling** (Low, 30 minutes)
   - Uses simple string concatenation without escaping commas/quotes
   - Client names with special characters could break CSV format
   - Fix: `app/client-hub/reports/page.tsx:129-216` - use proper CSV library (e.g., papaparse)

### Recommended Status

**✗ Changes Required - Address Priority 1 Issues**

The core backend integration is solid with excellent test coverage and security. However, before marking this story as complete, the following P1 issues must be resolved:

**Required:**
1. Implement date range filtering in `getClientRevenue()` and `getServicePerformance()` queries (1 hour)
2. Add onClick handlers for chart drill-down navigation to client/service detail pages (2 hours)

**Recommended for Future:**
3. Add performance benchmarks to verify AC12 requirements (1 hour)
4. Use proper CSV library for export to handle special characters (30 minutes)
5. Add pagination to service performance query for better scalability (1 hour)
6. Consider caching dashboard KPIs with short TTL to reduce database load (1 hour)

**Total Estimated Effort to Complete:** 3-4 hours for P1 issues

**Gate Expiration:** 2025-11-06 (14 days)

---

**QA Sign-off:** Pending resolution of P1 issues (AC5, AC7)
