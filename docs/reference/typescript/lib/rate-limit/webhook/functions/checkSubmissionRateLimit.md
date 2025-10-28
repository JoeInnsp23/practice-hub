[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkSubmissionRateLimit

# Function: checkSubmissionRateLimit()

> **checkSubmissionRateLimit**(`submissionId`): `Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>

Defined in: [lib/rate-limit/webhook.ts:162](https://github.com/JoeInnsp23/practice-hub/blob/e059937d61d3f0e96a8f73dacfebfa9ce61a962f/lib/rate-limit/webhook.ts#L162)

Check submission rate limit (1 req/sec)

Returns rate limit result with success/failure and metadata

## Parameters

### submissionId

`string`

## Returns

`Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>
