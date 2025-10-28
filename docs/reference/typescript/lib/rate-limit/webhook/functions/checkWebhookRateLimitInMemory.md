[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkWebhookRateLimitInMemory

# Function: checkWebhookRateLimitInMemory()

> **checkWebhookRateLimitInMemory**(`key`, `maxRequests`, `windowMs`): `object`

Defined in: [lib/rate-limit/webhook.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/54f5035264e4959e30e66735bafe0dd45318ed48/lib/rate-limit/webhook.ts#L77)

In-memory rate limit check (fallback for development)

## Parameters

### key

`string`

### maxRequests

`number`

### windowMs

`number`

## Returns

`object`

### limit

> **limit**: `number`

### remaining

> **remaining**: `number`

### reset

> **reset**: `number`

### success

> **success**: `boolean`
