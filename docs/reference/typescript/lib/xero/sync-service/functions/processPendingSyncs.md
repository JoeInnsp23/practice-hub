[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / processPendingSyncs

# Function: processPendingSyncs()

> **processPendingSyncs**(`tenantId`): `Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:458](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/xero/sync-service.ts#L458)

Process pending syncs

Queries for entities marked as "pending" and syncs them to Xero

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>
