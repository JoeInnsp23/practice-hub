[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / transformRow

# Function: transformRow()

> **transformRow**\<`T`\>(`row`, `fieldTypes`): `T`

Defined in: [lib/utils/csv-parser-enhanced.ts:426](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/utils/csv-parser-enhanced.ts#L426)

Transform CSV row values based on field types

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### row

`Record`\<`string`, `string`\>

CSV row data

### fieldTypes

`Record`\<`string`, `"date"` \| `"number"` \| `"boolean"` \| `"string"`\>

Map of field names to types

## Returns

`T`

Transformed row

## Example

```ts
const row = { name: "John", active: "yes", joined: "2025-01-15", age: "30" };
const types = { active: "boolean", joined: "date", age: "number" };
const transformed = transformRow(row, types);
// { name: "John", active: true, joined: Date(...), age: 30 }
```
