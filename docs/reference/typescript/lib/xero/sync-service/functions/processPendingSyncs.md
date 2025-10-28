[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / processPendingSyncs

# Function: processPendingSyncs()

> **processPendingSyncs**(`tenantId`): `Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:458](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/xero/sync-service.ts#L458)

Process pending syncs

Queries for entities marked as "pending" and syncs them to Xero

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>
