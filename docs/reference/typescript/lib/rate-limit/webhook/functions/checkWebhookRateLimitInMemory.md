[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkWebhookRateLimitInMemory

# Function: checkWebhookRateLimitInMemory()

> **checkWebhookRateLimitInMemory**(`key`, `maxRequests`, `windowMs`): `object`

Defined in: [lib/rate-limit/webhook.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/7fec9eba7e45b7f3789317f983edb1361575ad94/lib/rate-limit/webhook.ts#L77)

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
