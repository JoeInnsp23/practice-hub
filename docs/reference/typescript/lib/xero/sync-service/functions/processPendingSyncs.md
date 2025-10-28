[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / processPendingSyncs

# Function: processPendingSyncs()

> **processPendingSyncs**(`tenantId`): `Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:458](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/xero/sync-service.ts#L458)

Process pending syncs

Queries for entities marked as "pending" and syncs them to Xero

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsSynced`: `number`; `invoicesSynced`: `number`; \}\>
