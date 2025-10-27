[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / CSVParseResult

# Interface: CSVParseResult\<T\>

Defined in: [lib/services/csv-parser.ts:30](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/services/csv-parser.ts#L30)

Result of CSV parsing operation

## Type Parameters

### T

`T`

## Properties

### data

> **data**: `T`[]

Defined in: [lib/services/csv-parser.ts:31](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/services/csv-parser.ts#L31)

***

### errors

> **errors**: [`CSVRowError`](CSVRowError.md)[]

Defined in: [lib/services/csv-parser.ts:32](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/services/csv-parser.ts#L32)

***

### meta

> **meta**: `object`

Defined in: [lib/services/csv-parser.ts:33](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/services/csv-parser.ts#L33)

#### fields

> **fields**: `string`[]

#### invalidCount

> **invalidCount**: `number`

#### rowCount

> **rowCount**: `number`

#### validCount

> **validCount**: `number`
