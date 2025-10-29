[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/webhook-processor](../README.md) / processWebhookEvents

# Function: processWebhookEvents()

> **processWebhookEvents**(): `Promise`\<\{ `failed`: `number`; `processed`: `number`; \}\>

Defined in: [lib/xero/webhook-processor.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/6fb9b8384d137e195384abb23927b89eacc534ff/lib/xero/webhook-processor.ts#L40)

Process webhook events

Fetches unprocessed events and handles them based on category
Runs in background worker or on-demand via API

## Returns

`Promise`\<\{ `failed`: `number`; `processed`: `number`; \}\>
