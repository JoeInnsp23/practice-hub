# User Story: Reports Dashboard Backend Integration

**Story ID:** STORY-3.3
**Epic:** Epic 3 - Advanced Automation Features
**Feature:** FR15 - Reports Dashboard Backend Integration
**Priority:** High
**Effort:** 3-4 days
**Status:** Ready for Development

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
