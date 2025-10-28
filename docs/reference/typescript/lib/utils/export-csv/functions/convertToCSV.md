[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/export-csv](../README.md) / convertToCSV

# Function: convertToCSV()

> **convertToCSV**\<`T`\>(`data`, `headers?`): `string`

Defined in: [lib/utils/export-csv.ts:12](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/utils/export-csv.ts#L12)

Convert array of objects to CSV string

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### data

`T`[]

Array of objects to convert

### headers?

`string`[]

Optional custom headers (uses object keys if not provided)

## Returns

`string`

CSV formatted string
