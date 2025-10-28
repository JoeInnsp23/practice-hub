[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/export-csv](../README.md) / convertToCSV

# Function: convertToCSV()

> **convertToCSV**\<`T`\>(`data`, `headers?`): `string`

Defined in: [lib/utils/export-csv.ts:12](https://github.com/JoeInnsp23/practice-hub/blob/187ff0364e4e6bbfe8c3d262140a678e354e4593/lib/utils/export-csv.ts#L12)

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
