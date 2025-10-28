[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/queue-processor](../README.md) / QueueProcessorOptions

# Interface: QueueProcessorOptions

Defined in: [lib/email/queue-processor.ts:31](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/email/queue-processor.ts#L31)

Email queue processing options

## Properties

### batchSize?

> `optional` **batchSize**: `number`

Defined in: [lib/email/queue-processor.ts:33](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/email/queue-processor.ts#L33)

Maximum number of emails to process in one batch (default: 100)

***

### respectNotificationPreferences?

> `optional` **respectNotificationPreferences**: `boolean`

Defined in: [lib/email/queue-processor.ts:35](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/email/queue-processor.ts#L35)

Whether to respect user notification preferences (default: true)

***

### sendDelay?

> `optional` **sendDelay**: `number`

Defined in: [lib/email/queue-processor.ts:37](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/email/queue-processor.ts#L37)

Delay between emails in milliseconds to avoid rate limits (default: 100ms)
