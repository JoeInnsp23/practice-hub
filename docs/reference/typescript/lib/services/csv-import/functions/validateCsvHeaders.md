[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / validateCsvHeaders

# Function: validateCsvHeaders()

> **validateCsvHeaders**(`file`, `expectedFields`): `Promise`\<\{ `extraFields`: `string`[]; `headers`: `string`[]; `missingFields`: `string`[]; `valid`: `boolean`; \}\>

Defined in: [lib/services/csv-import.ts:214](https://github.com/JoeInnsp23/practice-hub/blob/502210854a7c20570dc1f03ece87fce3c6b533f0/lib/services/csv-import.ts#L214)

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
