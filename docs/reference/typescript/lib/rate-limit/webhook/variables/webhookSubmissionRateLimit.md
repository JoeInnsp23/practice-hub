[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / webhookSubmissionRateLimit

# Variable: webhookSubmissionRateLimit

> `const` **webhookSubmissionRateLimit**: `RegionRatelimit` \| `null`

Defined in: [lib/rate-limit/webhook.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/df180f9cfc127489877e096ef593182cb175824e/lib/rate-limit/webhook.ts#L55)

Submission-level rate limiter: 1 request/second

Prevents duplicate submission spam attacks.
Breach returns 409 Conflict (duplicate spam).
