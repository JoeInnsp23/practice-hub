[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/notifications/check-preferences](../README.md) / shouldSendNotification

# Function: shouldSendNotification()

> **shouldSendNotification**(`userId`, `notificationType`, `channel`): `Promise`\<`boolean`\>

Defined in: [lib/notifications/check-preferences.ts:24](https://github.com/JoeInnsp23/practice-hub/blob/b86ef329c1a1af142a431fcce71cc8e646e0efa2/lib/notifications/check-preferences.ts#L24)

Check if a notification should be sent to a user based on their preferences

## Parameters

### userId

`string`

The user to check preferences for

### notificationType

[`NotificationType`](../type-aliases/NotificationType.md)

The type of notification to check

### channel

The notification channel (email or in_app)

`"email"` | `"in_app"`

## Returns

`Promise`\<`boolean`\>

true if the notification should be sent, false otherwise
