[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / validateCsvHeaders

# Function: validateCsvHeaders()

> **validateCsvHeaders**(`file`, `expectedFields`): `Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Defined in: [lib/services/csv-import.ts:267](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/services/csv-import.ts#L267)

Validate CSV headers against expected fields

## Parameters

### file

CSV file to check

`string` | `File`

### expectedFields

`string`[]

Required field names

## Returns

`Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Validation result
