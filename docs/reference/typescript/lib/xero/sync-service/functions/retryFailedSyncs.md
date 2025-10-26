[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / retryFailedSyncs

# Function: retryFailedSyncs()

> **retryFailedSyncs**(`tenantId`): `Promise`\<\{ `clientsRetried`: `number`; `invoicesRetried`: `number`; \}\>

Defined in: [lib/xero/sync-service.ts:393](https://github.com/JoeInnsp23/practice-hub/blob/b1a6e9b4a505f41d42a9ddc98abf902faf54e35f/lib/xero/sync-service.ts#L393)

Retry failed syncs

Queries for entities with sync errors and retries them

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `clientsRetried`: `number`; `invoicesRetried`: `number`; \}\>
