[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / detectDelimiter

# Function: detectDelimiter()

> **detectDelimiter**(`content`): [`Delimiter`](../type-aliases/Delimiter.md)

Defined in: [lib/utils/csv-parser-enhanced.ts:139](https://github.com/JoeInnsp23/practice-hub/blob/8c030e75712305d72d974d9770acc789b4e5297d/lib/utils/csv-parser-enhanced.ts#L139)

Detect the most likely delimiter from CSV content

Analyzes the first row to determine which delimiter appears most frequently.
Returns comma as default if no clear winner.

## Parameters

### content

`string`

CSV content (first few lines recommended)

## Returns

[`Delimiter`](../type-aliases/Delimiter.md)

Detected delimiter (comma, semicolon, or tab)

## Example

```ts
const delimiter = detectDelimiter("name;email;phone\nJohn;john@test.com;123");
// Returns: ";"
```
