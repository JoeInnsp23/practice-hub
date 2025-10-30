[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/cache](../README.md) / reportsDashboardKpiCache

# Variable: reportsDashboardKpiCache

> `const` **reportsDashboardKpiCache**: `SimpleCache`\<\{ `activeClients`: `number`; `activeTasks`: `number`; `billableHours30d`: `number`; `collectedRevenue`: `number`; `collectionRate`: `number`; `newClients30d`: `number`; `outstandingRevenue`: `number`; `overdueTasks`: `number`; `totalHours30d`: `number`; `totalRevenue`: `number`; `utilizationRate`: `number`; \}\>

Defined in: [lib/cache.ts:124](https://github.com/JoeInnsp23/practice-hub/blob/0abc606c646ff806e99f12f8c16d74528f5b19b4/lib/cache.ts#L124)

Cache for reports dashboard KPIs

TTL: 5 minutes (300000ms) - KPIs don't change frequently enough to warrant real-time queries
