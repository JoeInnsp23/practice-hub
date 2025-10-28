[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / checkRateLimit

# Function: checkRateLimit()

> **checkRateLimit**(`identifier`, `config`): [`RateLimitResult`](../interfaces/RateLimitResult.md)

Defined in: [lib/rate-limit.ts:142](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/rate-limit.ts#L142)

Check if identifier is within rate limit

Uses Upstash Redis in production, falls back to in-memory in development

## Parameters

### identifier

`string`

### config

[`RateLimitConfig`](../interfaces/RateLimitConfig.md)

## Returns

[`RateLimitResult`](../interfaces/RateLimitResult.md)
