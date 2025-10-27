[**practice-hub v0.1.0**](../../../../../README.md)

***

[practice-hub](../../../../../README.md) / [lib/db/queries/reports-queries](../README.md) / getReportsDashboardKpis

# Function: getReportsDashboardKpis()

> **getReportsDashboardKpis**(`tenantId`): `Promise`\<\{ `activeClients`: `number` \| `null`; `billableHours30d`: `string` \| `null`; `collectedRevenue`: `string` \| `null`; `completedTasks30d`: `number` \| `null`; `inProgressTasks`: `number` \| `null`; `newClients30d`: `number` \| `null`; `outstandingRevenue`: `string` \| `null`; `overdueCompliance`: `number` \| `null`; `overdueTasks`: `number` \| `null`; `pendingTasks`: `number` \| `null`; `tenantId`: `string`; `totalHours30d`: `string` \| `null`; `totalRevenue`: `string` \| `null`; `upcomingCompliance30d`: `number` \| `null`; \}\>

Defined in: [lib/db/queries/reports-queries.ts:17](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/db/queries/reports-queries.ts#L17)

Fetch dashboard KPIs for reports page
Returns aggregated metrics from the dashboard_kpi_view

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `activeClients`: `number` \| `null`; `billableHours30d`: `string` \| `null`; `collectedRevenue`: `string` \| `null`; `completedTasks30d`: `number` \| `null`; `inProgressTasks`: `number` \| `null`; `newClients30d`: `number` \| `null`; `outstandingRevenue`: `string` \| `null`; `overdueCompliance`: `number` \| `null`; `overdueTasks`: `number` \| `null`; `pendingTasks`: `number` \| `null`; `tenantId`: `string`; `totalHours30d`: `string` \| `null`; `totalRevenue`: `string` \| `null`; `upcomingCompliance30d`: `number` \| `null`; \}\>
