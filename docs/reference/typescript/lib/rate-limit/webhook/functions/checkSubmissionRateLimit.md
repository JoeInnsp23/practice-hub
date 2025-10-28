[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/webhook](../README.md) / checkSubmissionRateLimit

# Function: checkSubmissionRateLimit()

> **checkSubmissionRateLimit**(`submissionId`): `Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>

Defined in: [lib/rate-limit/webhook.ts:162](https://github.com/JoeInnsp23/practice-hub/blob/acab0e17ea4a394fff6649c0803f80d93f290c0b/lib/rate-limit/webhook.ts#L162)

Check submission rate limit (1 req/sec)

Returns rate limit result with success/failure and metadata

## Parameters

### submissionId

`string`

## Returns

`Promise`\<\{ `limit`: `number`; `remaining`: `number`; `reset`: `number`; `success`: `boolean`; \}\>
