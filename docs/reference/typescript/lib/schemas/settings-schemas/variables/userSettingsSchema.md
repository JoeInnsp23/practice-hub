[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/schemas/settings-schemas](../README.md) / userSettingsSchema

# Variable: userSettingsSchema

> `const` **userSettingsSchema**: `ZodObject`\<\{ `digestEmail`: `ZodDefault`\<`ZodEnum`\<\{ `daily`: `"daily"`; `never`: `"never"`; `weekly`: `"weekly"`; \}\>\>; `emailNotifications`: `ZodDefault`\<`ZodBoolean`\>; `inAppNotifications`: `ZodDefault`\<`ZodBoolean`\>; `language`: `ZodDefault`\<`ZodEnum`\<\{ `de`: `"de"`; `en`: `"en"`; `es`: `"es"`; `fr`: `"fr"`; \}\>\>; `notifApprovalNeeded`: `ZodDefault`\<`ZodBoolean`\>; `notifClientMessage`: `ZodDefault`\<`ZodBoolean`\>; `notifDeadlineApproaching`: `ZodDefault`\<`ZodBoolean`\>; `notifTaskAssigned`: `ZodDefault`\<`ZodBoolean`\>; `notifTaskMention`: `ZodDefault`\<`ZodBoolean`\>; `notifTaskReassigned`: `ZodDefault`\<`ZodBoolean`\>; `theme`: `ZodDefault`\<`ZodEnum`\<\{ `dark`: `"dark"`; `light`: `"light"`; `system`: `"system"`; \}\>\>; `timezone`: `ZodDefault`\<`ZodString`\>; \}, `$strip`\>

Defined in: [lib/schemas/settings-schemas.ts:36](https://github.com/JoeInnsp23/practice-hub/blob/1880350608077cd291749d4e46e12f3fb3757d2b/lib/schemas/settings-schemas.ts#L36)

Schema for user-scoped settings stored in userSettings table
