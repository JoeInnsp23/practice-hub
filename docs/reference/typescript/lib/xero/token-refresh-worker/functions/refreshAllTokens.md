[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/token-refresh-worker](../README.md) / refreshAllTokens

# Function: refreshAllTokens()

> **refreshAllTokens**(`daysBeforeExpiry`): `Promise`\<\{ `failed`: `number`; `refreshed`: `number`; `skipped`: `number`; \}\>

Defined in: [lib/xero/token-refresh-worker.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/xero/token-refresh-worker.ts#L40)

Refresh all Xero tokens that are about to expire

## Parameters

### daysBeforeExpiry

`number` = `10`

Refresh tokens expiring within this many days (default: 10)

## Returns

`Promise`\<\{ `failed`: `number`; `refreshed`: `number`; `skipped`: `number`; \}\>
