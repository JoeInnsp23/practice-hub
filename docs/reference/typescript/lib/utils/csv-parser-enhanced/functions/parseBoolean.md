[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / parseBoolean

# Function: parseBoolean()

> **parseBoolean**(`value`, `defaultValue`): `boolean`

Defined in: [lib/utils/csv-parser-enhanced.ts:350](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/lib/utils/csv-parser-enhanced.ts#L350)

Parse boolean string to boolean

Recognizes: true/false, yes/no, 1/0, on/off (case-insensitive)

## Parameters

### value

`string`

String to parse

### defaultValue

`boolean` = `false`

Default value if parsing fails (default: false)

## Returns

`boolean`

Boolean value

## Example

```ts
parseBoolean("yes"); // true
parseBoolean("1"); // true
parseBoolean("false"); // false
parseBoolean("invalid"); // false
```
