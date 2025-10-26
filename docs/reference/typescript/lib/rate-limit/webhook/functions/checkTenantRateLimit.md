[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkTenantRateLimit

# Function: checkTenantRateLimit()

> **checkTenantRateLimit**(`tenantId`): `Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>

Defined in: [lib/rate-limit/webhook.ts:136](https://github.com/JoeInnsp23/practice-hub/blob/d148037f52e455f83c3f32f11b0d4bdd2976ba75/lib/rate-limit/webhook.ts#L136)

Check tenant rate limit (10 req/sec)

Returns rate limit result with success/failure and metadata

## Parameters

### tenantId

`string`

## Returns

`Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>
