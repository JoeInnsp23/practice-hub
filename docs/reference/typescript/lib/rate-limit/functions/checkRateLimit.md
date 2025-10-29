[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / checkRateLimit

# Function: checkRateLimit()

> **checkRateLimit**(`identifier`, `config`): [`RateLimitResult`](../interfaces/RateLimitResult.md)

Defined in: [lib/rate-limit.ts:142](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/rate-limit.ts#L142)

Check if identifier is within rate limit

Uses Upstash Redis in production, falls back to in-memory in development

## Parameters

### identifier

`string`

### config

[`RateLimitConfig`](../interfaces/RateLimitConfig.md)

## Returns

[`RateLimitResult`](../interfaces/RateLimitResult.md)
