[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / parseCsvFile

# Function: parseCsvFile()

> **parseCsvFile**\<`T`\>(`file`, `schema`, `options`): `Promise`\<[`ParseResult`](../interfaces/ParseResult.md)\<`T`\>\>

Defined in: [lib/services/csv-import.ts:56](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/services/csv-import.ts#L56)

Parse and validate CSV file

## Type Parameters

### T

`T`

## Parameters

### file

File or string content to parse

`string` | `File`

### schema

`ZodType`\<`T`\>

Zod schema for validation

### options

[`CsvParseOptions`](../interfaces/CsvParseOptions.md) = `{}`

Papa Parse configuration options

## Returns

`Promise`\<[`ParseResult`](../interfaces/ParseResult.md)\<`T`\>\>

Parsed and validated data with errors
