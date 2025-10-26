[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/schemas/settings-schemas](../README.md) / userSettingsSchema

# Variable: userSettingsSchema

> `const` **userSettingsSchema**: `ZodObject`\<\{ `digestEmail`: `ZodDefault`\<`ZodEnum`\<\{ `daily`: `"daily"`; `never`: `"never"`; `weekly`: `"weekly"`; \}\>\>; `emailNotifications`: `ZodDefault`\<`ZodBoolean`\>; `inAppNotifications`: `ZodDefault`\<`ZodBoolean`\>; `language`: `ZodDefault`\<`ZodEnum`\<\{ `de`: `"de"`; `en`: `"en"`; `es`: `"es"`; `fr`: `"fr"`; \}\>\>; `theme`: `ZodDefault`\<`ZodEnum`\<\{ `dark`: `"dark"`; `light`: `"light"`; `system`: `"system"`; \}\>\>; `timezone`: `ZodDefault`\<`ZodString`\>; \}, `$strip`\>

Defined in: [lib/schemas/settings-schemas.ts:36](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/schemas/settings-schemas.ts#L36)

Schema for user-scoped settings stored in userSettings table
