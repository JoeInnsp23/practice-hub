[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / CSVParseOptions

# Interface: CSVParseOptions\<T\>

Defined in: [lib/services/csv-parser.ts:44](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/services/csv-parser.ts#L44)

Options for CSV parsing

## Type Parameters

### T

`T`

## Properties

### skipEmptyLines?

> `optional` **skipEmptyLines**: `boolean`

Defined in: [lib/services/csv-parser.ts:50](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/services/csv-parser.ts#L50)

Skip empty lines (default: true)

***

### transform()?

> `optional` **transform**: (`row`) => `T`

Defined in: [lib/services/csv-parser.ts:48](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/services/csv-parser.ts#L48)

Transform function to convert validated row to typed object (optional)

#### Parameters

##### row

`Record`\<`string`, `unknown`\>

#### Returns

`T`

***

### trimValues?

> `optional` **trimValues**: `boolean`

Defined in: [lib/services/csv-parser.ts:52](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/services/csv-parser.ts#L52)

Trim whitespace from values (default: true)

***

### validator()

> **validator**: (`row`) => [`RowValidationResult`](RowValidationResult.md)

Defined in: [lib/services/csv-parser.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/services/csv-parser.ts#L46)

Validator function for each row

#### Parameters

##### row

`Record`\<`string`, `unknown`\>

#### Returns

[`RowValidationResult`](RowValidationResult.md)
