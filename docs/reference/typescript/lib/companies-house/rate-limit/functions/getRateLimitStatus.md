[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/rate-limit](../README.md) / getRateLimitStatus

# Function: getRateLimitStatus()

> **getRateLimitStatus**(): `Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Defined in: [lib/companies-house/rate-limit.ts:129](https://github.com/JoeInnsp23/practice-hub/blob/624a835c80503036b953c653b801ebc1fc5dbf0f/lib/companies-house/rate-limit.ts#L129)

Get current rate limit status for monitoring

## Returns

`Promise`\<\{ `remainingRequests`: `number`; `requestsCount`: `number`; `windowResetIn`: `number`; `windowStart`: `Date`; \}\>

Promise<{ requestsCount: number; windowStart: Date; remainingRequests: number; windowResetIn: number }>
