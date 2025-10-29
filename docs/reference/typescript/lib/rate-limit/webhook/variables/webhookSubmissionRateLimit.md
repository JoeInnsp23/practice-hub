[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / webhookSubmissionRateLimit

# Variable: webhookSubmissionRateLimit

> `const` **webhookSubmissionRateLimit**: `RegionRatelimit` \| `null`

Defined in: [lib/rate-limit/webhook.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/e67f2d7c2aef25e0a7c52e201483873b6d5f88c3/lib/rate-limit/webhook.ts#L55)

Submission-level rate limiter: 1 request/second

Prevents duplicate submission spam attacks.
Breach returns 409 Conflict (duplicate spam).
