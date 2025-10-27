[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / generateCSV

# Function: generateCSV()

> **generateCSV**\<`T`\>(`data`, `fields?`): `string`

Defined in: [lib/services/csv-parser.ts:248](https://github.com/JoeInnsp23/practice-hub/blob/a3dc67446cfc55d2f29bf75271eb5c98593aea17/lib/services/csv-parser.ts#L248)

Generate CSV from array of objects

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### data

`T`[]

Array of objects to convert to CSV

### fields?

`string`[]

Optional array of field names to include (defaults to all fields)

## Returns

`string`

CSV string

## Example

```ts
const csv = generateCSV(clients, ['name', 'email', 'type']);
```
