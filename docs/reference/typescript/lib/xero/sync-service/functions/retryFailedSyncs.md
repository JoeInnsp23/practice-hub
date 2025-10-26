[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / retryFailedSyncs

# Function: retryFailedSyncs()

> **retryFailedSyncs**(`tenantId`): `Promise`\<\{ `clientsRetried`: `number`; `invoicesRetried`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:393](https://github.com/JoeInnsp23/practice-hub/blob/d95822c6b7b70406089448c0731a89c79d9d915e/lib/xero/sync-service.ts#L393)

Retry failed syncs

Queries for entities with sync errors and retries them

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsRetried`: `number`; `invoicesRetried`: `number`; \}\>
