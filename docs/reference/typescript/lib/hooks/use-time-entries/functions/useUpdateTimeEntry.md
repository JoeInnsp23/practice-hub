[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hooks/use-time-entries](../README.md) / useUpdateTimeEntry

# Function: useUpdateTimeEntry()

> **useUpdateTimeEntry**(): `object`

Defined in: [lib/hooks/use-time-entries.ts:172](https://github.com/JoeInnsp23/practice-hub/blob/9ffe11ce62534511f8e0911416af99f9975bb246/lib/hooks/use-time-entries.ts#L172)

## Returns

`object`

### isLoading

> **isLoading**: `boolean`

### mutateAsync()

> **mutateAsync**: (`id`, `updates`) => `Promise`\<\{ `billable?`: `boolean`; `billed?`: `boolean`; `client?`: `string`; `clientId?`: `string`; `date?`: `Date`; `description?`: `string`; `endTime?`: `string`; `hours?`: `number`; `id`: `string`; `startTime?`: `string`; `status?`: `"approved"` \| `"rejected"` \| `"draft"` \| `"submitted"`; `task?`: `string`; `taskId?`: `string`; `user?`: `string`; `userId?`: `string`; `workType?`: `string`; \}\>

#### Parameters

##### id

`string`

##### updates

`Partial`\<[`TimeEntry`](../interfaces/TimeEntry.md)\>

#### Returns

`Promise`\<\{ `billable?`: `boolean`; `billed?`: `boolean`; `client?`: `string`; `clientId?`: `string`; `date?`: `Date`; `description?`: `string`; `endTime?`: `string`; `hours?`: `number`; `id`: `string`; `startTime?`: `string`; `status?`: `"approved"` \| `"rejected"` \| `"draft"` \| `"submitted"`; `task?`: `string`; `taskId?`: `string`; `user?`: `string`; `userId?`: `string`; `workType?`: `string`; \}\>
