[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-import](../README.md) / parseCsvFile

# Function: parseCsvFile()

> **parseCsvFile**\<`T`\>(`file`, `schema`, `options`): `Promise`\<[`ParseResult`](../interfaces/ParseResult.md)\<`T`\>\>

Defined in: [lib/services/csv-import.ts:56](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/services/csv-import.ts#L56)

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
