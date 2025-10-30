[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/webhook-processor](../README.md) / processWebhookEvents

# Function: processWebhookEvents()

> **processWebhookEvents**(): `Promise`\<\{ `failed`: `number`; `processed`: `number`; \}\>

Defined in: [lib/xero/webhook-processor.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/lib/xero/webhook-processor.ts#L40)

Process webhook events

Fetches unprocessed events and handles them based on category
Runs in background worker or on-demand via API

## Returns

`Promise`\<\{ `failed`: `number`; `processed`: `number`; \}\>
