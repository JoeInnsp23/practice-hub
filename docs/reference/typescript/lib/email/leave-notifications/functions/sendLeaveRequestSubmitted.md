[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/email/leave-notifications](../README.md) / sendLeaveRequestSubmitted

# Function: sendLeaveRequestSubmitted()

> **sendLeaveRequestSubmitted**(`data`): `Promise`\<\{ `error`: `string`; `success`: `boolean`; \} \| \{ `error?`: `undefined`; `success`: `boolean`; \}\>

Defined in: [lib/email/leave-notifications.ts:22](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/email/leave-notifications.ts#L22)

Send email notification when a leave request is submitted

## Parameters

### data

`Omit`\<[`LeaveNotificationData`](../interfaces/LeaveNotificationData.md), `"approverName"` \| `"comments"`\>

## Returns

`Promise`\<\{ `error`: `string`; `success`: `boolean`; \} \| \{ `error?`: `undefined`; `success`: `boolean`; \}\>
