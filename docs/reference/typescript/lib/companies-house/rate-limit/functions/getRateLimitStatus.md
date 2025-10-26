[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/rate-limit](../README.md) / getRateLimitStatus

# Function: getRateLimitStatus()

> **getRateLimitStatus**(): `Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Defined in: [lib/companies-house/rate-limit.ts:129](https://github.com/JoeInnsp23/practice-hub/blob/9ffe11ce62534511f8e0911416af99f9975bb246/lib/companies-house/rate-limit.ts#L129)

Get current rate limit status for monitoring

## Returns

`Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Promise<{ requestsCount: number; windowStart: Date; remainingRequests: number; windowResetIn: number }>
