[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/queue-processor](../README.md) / queueEmail

# Function: queueEmail()

> **queueEmail**(`params`): `Promise`\<\{ `attempts`: `number`; `bodyHtml`: `string`; `bodyText`: `string` \| `null`; `createdAt`: `Date`; `emailTemplateId`: `string` \| `null`; `errorMessage`: `string` \| `null`; `id`: `string`; `maxAttempts`: `number`; `recipientEmail`: `string`; `recipientName`: `string` \| `null`; `sendAt`: `Date`; `sentAt`: `Date` \| `null`; `status`: `string`; `subject`: `string`; `tenantId`: `string`; `updatedAt`: `Date`; `variables`: `unknown`; \}\>

Defined in: [lib/email/queue-processor.ts:340](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/email/queue-processor.ts#L340)

Queues an email for sending

Helper function to add emails to the queue

## Parameters

### params

Email parameters

#### bodyHtml

`string`

#### bodyText?

`string` \| `null`

#### emailTemplateId?

`string` \| `null`

#### maxAttempts?

`number`

#### recipientEmail

`string`

#### recipientName?

`string` \| `null`

#### sendAt?

`Date`

#### subject

`string`

#### tenantId

`string`

#### variables?

`Record`\<`string`, `unknown`\> \| `null`

## Returns

`Promise`\<\{ `attempts`: `number`; `bodyHtml`: `string`; `bodyText`: `string` \| `null`; `createdAt`: `Date`; `emailTemplateId`: `string` \| `null`; `errorMessage`: `string` \| `null`; `id`: `string`; `maxAttempts`: `number`; `recipientEmail`: `string`; `recipientName`: `string` \| `null`; `sendAt`: `Date`; `sentAt`: `Date` \| `null`; `status`: `string`; `subject`: `string`; `tenantId`: `string`; `updatedAt`: `Date`; `variables`: `unknown`; \}\>

Created email queue record
