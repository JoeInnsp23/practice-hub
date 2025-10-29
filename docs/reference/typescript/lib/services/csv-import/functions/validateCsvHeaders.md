[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / validateCsvHeaders

# Function: validateCsvHeaders()

> **validateCsvHeaders**(`file`, `expectedFields`): `Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Defined in: [lib/services/csv-import.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/services/csv-import.ts#L276)

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
