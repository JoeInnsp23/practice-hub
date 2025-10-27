[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / webhookTenantRateLimit

# Variable: webhookTenantRateLimit

> `const` **webhookTenantRateLimit**: `RegionRatelimit` \| `null`

Defined in: [lib/rate-limit/webhook.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/e884ea9f5209b5419fb4ebc2881f2b55c91706c8/lib/rate-limit/webhook.ts#L40)

Tenant-level rate limiter: 10 requests/second

Prevents a single tenant from overwhelming the webhook endpoint.
Breach returns 429 Too Many Requests.
