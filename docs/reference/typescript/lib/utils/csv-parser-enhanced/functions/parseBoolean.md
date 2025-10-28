[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / parseBoolean

# Function: parseBoolean()

> **parseBoolean**(`value`, `defaultValue`): `boolean`

Defined in: [lib/utils/csv-parser-enhanced.ts:350](https://github.com/JoeInnsp23/practice-hub/blob/e3ddd192f92eb8cdb5213c023342cf95c314a8fb/lib/utils/csv-parser-enhanced.ts#L350)

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
