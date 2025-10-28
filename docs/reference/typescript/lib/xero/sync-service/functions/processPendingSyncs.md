[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / processPendingSyncs

# Function: processPendingSyncs()

> **processPendingSyncs**(`tenantId`): `Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:458](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/xero/sync-service.ts#L458)

Process pending syncs

Queries for entities marked as "pending" and syncs them to Xero

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>
