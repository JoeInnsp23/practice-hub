[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / stripBOM

# Function: stripBOM()

> **stripBOM**(`content`): `string`

Defined in: [lib/utils/csv-parser-enhanced.ts:91](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/utils/csv-parser-enhanced.ts#L91)

Strip Byte Order Mark (BOM) from CSV content

Handles UTF-8, UTF-16BE, and UTF-16LE BOMs

## Parameters

### content

`string`

CSV content string

## Returns

`string`

Content with BOM removed

## Example

```ts
const cleaned = stripBOM("\uFEFFname,email\nJohn,john@example.com");
// Returns: "name,email\nJohn,john@example.com"
```
