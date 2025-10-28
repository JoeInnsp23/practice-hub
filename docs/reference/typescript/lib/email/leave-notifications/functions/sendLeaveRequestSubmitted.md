[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/leave-notifications](../README.md) / sendLeaveRequestSubmitted

# Function: sendLeaveRequestSubmitted()

> **sendLeaveRequestSubmitted**(`data`): `Promise`\<\{ `error`: `string`; `success`: `boolean`; \} \| \{ `error?`: `undefined`; `success`: `boolean`; \}\>

Defined in: [lib/email/leave-notifications.ts:22](https://github.com/JoeInnsp23/practice-hub/blob/acab0e17ea4a394fff6649c0803f80d93f290c0b/lib/email/leave-notifications.ts#L22)

Send email notification when a leave request is submitted

## Parameters

### data

`Omit`\<[`LeaveNotificationData`](../interfaces/LeaveNotificationData.md), `"approverName"` \| `"comments"`\>

## Returns

`Promise`\<\{ `error`: `string`; `success`: `boolean`; \} \| \{ `error?`: `undefined`; `success`: `boolean`; \}\>
