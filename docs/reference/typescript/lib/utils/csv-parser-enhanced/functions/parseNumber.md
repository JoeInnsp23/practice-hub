[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / parseNumber

# Function: parseNumber()

> **parseNumber**(`value`): `number` \| `null`

Defined in: [lib/utils/csv-parser-enhanced.ts:318](https://github.com/JoeInnsp23/practice-hub/blob/116a6c755666afa836e10cee1a53f3879afcc423/lib/utils/csv-parser-enhanced.ts#L318)

Parse numeric string to number

Handles various formats: "1,234.56", "1 234.56", etc.

## Parameters

### value

`string`

String to parse

## Returns

`number` \| `null`

Parsed number or null

## Example

```ts
parseNumber("1,234.56"); // 1234.56
parseNumber("€ 500.00"); // 500
parseNumber("invalid"); // null
```
