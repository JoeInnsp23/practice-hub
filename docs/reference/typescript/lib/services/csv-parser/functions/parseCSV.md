[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/csv-parser](../README.md) / parseCSV

# Function: parseCSV()

> **parseCSV**\<`T`\>(`file`, `options`): `Promise`\<[`CSVParseResult`](../interfaces/CSVParseResult.md)\<`T`\>\>

Defined in: [lib/services/csv-parser.ts:72](https://github.com/JoeInnsp23/practice-hub/blob/eff6b04e3024369473845314332b9fed12a0e0c8/lib/services/csv-parser.ts#L72)

Parse a CSV file with validation

## Type Parameters

### T

`T`

## Parameters

### file

`File`

File object to parse (browser File API)

### options

[`CSVParseOptions`](../interfaces/CSVParseOptions.md)\<`T`\>

Parsing and validation options

## Returns

`Promise`\<[`CSVParseResult`](../interfaces/CSVParseResult.md)\<`T`\>\>

Promise resolving to parsed result with data and errors

## Example

```ts
const result = await parseCSV<ClientImportRow>(file, {
  validator: validateClientRow,
  transform: (row) => ({
    name: row.company_name as string,
    email: row.email as string,
    type: row.client_type as ClientType,
  }),
});
```
