[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / parseCSVFromText

# Function: parseCSVFromText()

> **parseCSVFromText**\<`T`\>(`csvText`, `options`): `Promise`\<[`CSVParseResult`](../interfaces/CSVParseResult.md)\<`T`\>\>

Defined in: [lib/services/csv-parser.ts:163](https://github.com/JoeInnsp23/practice-hub/blob/2a46204a681094906843b7345518f00183c7c289/lib/services/csv-parser.ts#L163)

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
