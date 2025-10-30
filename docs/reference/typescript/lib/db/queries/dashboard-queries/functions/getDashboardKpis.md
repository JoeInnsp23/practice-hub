[**practice-hub v0.1.0**](../../../../../README.md)

***

[practice-hub](../../../../../README.md) / [lib/db/queries/dashboard-queries](../README.md) / getDashboardKpis

# Function: getDashboardKpis()

> **getDashboardKpis**(`tenantId`): `Promise`\<\{ `activeClients`: `number` \| `null`; `billableHours30d`: `string` \| `null`; `collectedRevenue`: `string` \| `null`; `completedTasks30d`: `number` \| `null`; `inProgressTasks`: `number` \| `null`; `newClients30d`: `number` \| `null`; `outstandingRevenue`: `string` \| `null`; `overdueCompliance`: `number` \| `null`; `overdueTasks`: `number` \| `null`; `pendingTasks`: `number` \| `null`; `tenantId`: `string`; `totalHours30d`: `string` \| `null`; `totalRevenue`: `string` \| `null`; `upcomingCompliance30d`: `number` \| `null`; \}\>

Defined in: [lib/db/queries/dashboard-queries.ts:9](https://github.com/JoeInnsp23/practice-hub/blob/400f6cb47eec7523d4762fc26198d406bae9fc52/lib/db/queries/dashboard-queries.ts#L9)

Fetch dashboard KPIs for a given tenant
Returns aggregated metrics from the dashboard_kpi_view

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `activeClients`: `number` \| `null`; `billableHours30d`: `string` \| `null`; `collectedRevenue`: `string` \| `null`; `completedTasks30d`: `number` \| `null`; `inProgressTasks`: `number` \| `null`; `newClients30d`: `number` \| `null`; `outstandingRevenue`: `string` \| `null`; `overdueCompliance`: `number` \| `null`; `overdueTasks`: `number` \| `null`; `pendingTasks`: `number` \| `null`; `tenantId`: `string`; `totalHours30d`: `string` \| `null`; `totalRevenue`: `string` \| `null`; `upcomingCompliance30d`: `number` \| `null`; \}\>
