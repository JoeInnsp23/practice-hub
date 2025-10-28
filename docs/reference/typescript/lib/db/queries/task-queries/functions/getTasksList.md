[**practice-hub v0.1.0**](../../../../../README.md)

***

[practice-hub](../../../../../README.md) / [lib/db/queries/task-queries](../README.md) / getTasksList

# Function: getTasksList()

> **getTasksList**(`tenantId`, `filters`): `Promise`\<`object`[]\>

Defined in: [lib/db/queries/task-queries.ts:9](https://github.com/JoeInnsp23/practice-hub/blob/2134b7d84e9ea0b2fafa4fc72904258cfbae4a7c/lib/db/queries/task-queries.ts#L9)

Fetch tasks list with filters
Uses task_details_view for joined data

## Parameters

### tenantId

`string`

### filters

#### assigneeId?

`string`

#### clientId?

`string`

#### overdue?

`boolean`

#### priority?

`string`

#### search?

`string`

#### status?

`string`

## Returns

`Promise`\<`object`[]\>
