[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkWebhookRateLimitInMemory

# Function: checkWebhookRateLimitInMemory()

> **checkWebhookRateLimitInMemory**(`key`, `maxRequests`, `windowMs`): `object`

Defined in: [lib/rate-limit/webhook.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/484e2e6b732b598a9304bb9946ce67fbb493d71e/lib/rate-limit/webhook.ts#L77)

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
