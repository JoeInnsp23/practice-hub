[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hooks/use-time-entries](../README.md) / useUpdateTimeEntry

# Function: useUpdateTimeEntry()

> **useUpdateTimeEntry**(): `object`

Defined in: [lib/hooks/use-time-entries.ts:172](https://github.com/JoeInnsp23/practice-hub/blob/e059937d61d3f0e96a8f73dacfebfa9ce61a962f/lib/hooks/use-time-entries.ts#L172)

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
