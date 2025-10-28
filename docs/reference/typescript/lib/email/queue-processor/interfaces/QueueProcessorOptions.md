[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/queue-processor](../README.md) / QueueProcessorOptions

# Interface: QueueProcessorOptions

Defined in: [lib/email/queue-processor.ts:31](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/email/queue-processor.ts#L31)

Email queue processing options

## Properties

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [lib/email/queue-processor.ts:33](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/email/queue-processor.ts#L33)

Maximum number of emails to process in one batch (default: 100)

***

### respectNotificationPreferences?

> `optional` **respectNotificationPreferences**: `boolean`

Defined in: [lib/email/queue-processor.ts:35](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/email/queue-processor.ts#L35)

Whether to respect user notification preferences (default: true)

***

### sendDelay?

> `optional` **sendDelay**: `number`

Defined in: [lib/email/queue-processor.ts:37](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/email/queue-processor.ts#L37)

Delay between emails in milliseconds to avoid rate limits (default: 100ms)
