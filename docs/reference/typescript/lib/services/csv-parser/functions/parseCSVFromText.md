[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / parseCSVFromText

# Function: parseCSVFromText()

> **parseCSVFromText**\<`T`\>(`csvText`, `options`): `Promise`\<[`CSVParseResult`](../interfaces/CSVParseResult.md)\<`T`\>\>

Defined in: [lib/services/csv-parser.ts:163](https://github.com/JoeInnsp23/practice-hub/blob/d148037f52e455f83c3f32f11b0d4bdd2976ba75/lib/services/csv-parser.ts#L163)

Parse CSV from text string (alternative to file upload)

## Type Parameters

### T

`T`

## Parameters

### csvText

`string`

CSV content as string

### options

[`CSVParseOptions`](../interfaces/CSVParseOptions.md)\<`T`\>

Parsing and validation options

## Returns

`Promise`\<[`CSVParseResult`](../interfaces/CSVParseResult.md)\<`T`\>\>

Promise resolving to parsed result
