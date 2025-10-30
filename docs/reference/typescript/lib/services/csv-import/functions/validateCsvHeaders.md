[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / validateCsvHeaders

# Function: validateCsvHeaders()

> **validateCsvHeaders**(`file`, `expectedFields`): `Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Defined in: [lib/services/csv-import.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/7cf57c0e0f79c8ff999f48b52fd2e2e285c0f23e/lib/services/csv-import.ts#L276)

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
