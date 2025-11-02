[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/queue-processor](../README.md) / processEmailQueue

# Function: processEmailQueue()

> **processEmailQueue**(`options`): `Promise`\<\{ `failed`: `number`; `processed`: `number`; `retrying`: `number`; `sent`: `number`; \}\>

Defined in: [lib/email/queue-processor.ts:268](https://github.com/JoeInnsp23/practice-hub/blob/897f162ed11263f92c9b7f58ca58e3feb1830bb2/lib/email/queue-processor.ts#L268)

Processes pending emails from the queue

Main entry point for the queue processor.
Should be called periodically (e.g., every 60 seconds) by a background worker.

## Parameters

### options

[`QueueProcessorOptions`](../interfaces/QueueProcessorOptions.md) = `{}`

Processing options

## Returns

`Promise`\<\{ `failed`: `number`; `processed`: `number`; `retrying`: `number`; `sent`: `number`; \}\>

Processing summary

## Example

```typescript
// Run every 60 seconds
setInterval(async () => {
  const result = await processEmailQueue({ batchSize: 100 });
  console.log(`Processed ${result.processed} emails, ${result.sent} sent, ${result.failed} failed`);
}, 60000);
```
