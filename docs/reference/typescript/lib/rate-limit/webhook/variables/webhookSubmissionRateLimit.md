[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / webhookSubmissionRateLimit

# Variable: webhookSubmissionRateLimit

> `const` **webhookSubmissionRateLimit**: `RegionRatelimit` \| `null`

Defined in: [lib/rate-limit/webhook.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/2195d8502914b90f0cfc488db93d3fa6bc1a5b9f/lib/rate-limit/webhook.ts#L55)

Submission-level rate limiter: 1 request/second

Prevents duplicate submission spam attacks.
Breach returns 409 Conflict (duplicate spam).
