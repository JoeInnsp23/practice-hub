[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / processPendingSyncs

# Function: processPendingSyncs()

> **processPendingSyncs**(`tenantId`): `Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:458](https://github.com/JoeInnsp23/practice-hub/blob/b86ef329c1a1af142a431fcce71cc8e646e0efa2/lib/xero/sync-service.ts#L458)

Process pending syncs

Queries for entities marked as "pending" and syncs them to Xero

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>
