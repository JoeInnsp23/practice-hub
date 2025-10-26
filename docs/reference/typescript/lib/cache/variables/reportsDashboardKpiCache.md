[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/cache](../README.md) / reportsDashboardKpiCache

# Variable: reportsDashboardKpiCache

> `const` **reportsDashboardKpiCache**: `SimpleCache`\<\{ `activeClients`: `number`; `activeTasks`: `number`; `billableHours30d`: `number`; `collectedRevenue`: `number`; `collectionRate`: `number`; `newClients30d`: `number`; `outstandingRevenue`: `number`; `overdueTasks`: `number`; `totalHours30d`: `number`; `totalRevenue`: `number`; `utilizationRate`: `number`; \}\>

Defined in: [lib/cache.ts:124](https://github.com/JoeInnsp23/practice-hub/blob/624a835c80503036b953c653b801ebc1fc5dbf0f/lib/cache.ts#L124)

Cache for reports dashboard KPIs

TTL: 5 minutes (300000ms) - KPIs don't change frequently enough to warrant real-time queries
