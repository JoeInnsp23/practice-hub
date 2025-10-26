[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/middleware](../README.md) / withXeroCredentials

# Function: withXeroCredentials()

> **withXeroCredentials**\<`T`\>(`tenantId`, `callback`): `Promise`\<`T`\>

Defined in: [lib/xero/middleware.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/502210854a7c20570dc1f03ece87fce3c6b533f0/lib/xero/middleware.ts#L47)

Middleware wrapper for API routes that need Xero credentials

Ensures credentials are valid and refreshed before executing callback
Auto-refreshes if token expires within 5 minutes

## Type Parameters

### T

`T`

## Parameters

### tenantId

`string`

Tenant ID to get credentials for

### callback

(`credentials`) => `Promise`\<`T`\>

Function to execute with valid credentials

## Returns

`Promise`\<`T`\>

Result of callback or error response
