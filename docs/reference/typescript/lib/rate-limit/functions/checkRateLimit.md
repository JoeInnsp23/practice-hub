[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / checkRateLimit

# Function: checkRateLimit()

> **checkRateLimit**(`identifier`, `config`): [`RateLimitResult`](../interfaces/RateLimitResult.md)

Defined in: [lib/rate-limit.ts:142](https://github.com/JoeInnsp23/practice-hub/blob/e0eeb99bc1dd61707be1ca896330969c20a59d27/lib/rate-limit.ts#L142)

Check if identifier is within rate limit

Uses Upstash Redis in production, falls back to in-memory in development

## Parameters

### identifier

`string`

### config

[`RateLimitConfig`](../interfaces/RateLimitConfig.md)

## Returns

[`RateLimitResult`](../interfaces/RateLimitResult.md)
