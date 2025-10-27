[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/rate-limit](../README.md) / getRateLimitStatus

# Function: getRateLimitStatus()

> **getRateLimitStatus**(): `Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Defined in: [lib/companies-house/rate-limit.ts:129](https://github.com/JoeInnsp23/practice-hub/blob/1c2bcbdc3a1f5b59e304e10e04459722a22a960d/lib/companies-house/rate-limit.ts#L129)

Get current rate limit status for monitoring

## Returns

`Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Promise<{ requestsCount: number; windowStart: Date; remainingRequests: number; windowResetIn: number }>
