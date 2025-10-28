[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / validateCsvHeaders

# Function: validateCsvHeaders()

> **validateCsvHeaders**(`file`, `expectedFields`): `Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Defined in: [lib/services/csv-import.ts:267](https://github.com/JoeInnsp23/practice-hub/blob/4fe03302d31fda58a2d1c027a01e2406bc41c750/lib/services/csv-import.ts#L267)

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
