[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / parseDate

# Function: parseDate()

> **parseDate**(`value`, `formats`): `Date` \| `null`

Defined in: [lib/utils/csv-parser-enhanced.ts:247](https://github.com/JoeInnsp23/practice-hub/blob/1880350608077cd291749d4e46e12f3fb3757d2b/lib/utils/csv-parser-enhanced.ts#L247)

Parse date string with multiple format support

Tries each format in order until a valid date is found.
Returns null if no format matches.

## Parameters

### value

`string`

Date string to parse

### formats

`string`[] = `DEFAULT_DATE_FORMATS`

Array of date-fns format strings (optional, uses defaults)

## Returns

`Date` \| `null`

Parsed Date object or null

## Example

```ts
parseDate("31/12/2025"); // UK format
parseDate("2025-12-31"); // ISO format
parseDate("12/31/2025", ["MM/dd/yyyy"]); // US format explicitly
```
