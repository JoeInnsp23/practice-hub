[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / webhookTenantRateLimit

# Variable: webhookTenantRateLimit

> `const` **webhookTenantRateLimit**: `RegionRatelimit` \| `null`

Defined in: [lib/rate-limit/webhook.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/3938b1e4aa281b3143a14c67c33d5b24dfa44fca/lib/rate-limit/webhook.ts#L40)

Tenant-level rate limiter: 10 requests/second

Prevents a single tenant from overwhelming the webhook endpoint.
Breach returns 429 Too Many Requests.
