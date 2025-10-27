[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/utils/csv-parser-enhanced](../README.md) / detectDelimiterRobust

# Function: detectDelimiterRobust()

> **detectDelimiterRobust**(`content`, `linesToCheck`): [`Delimiter`](../type-aliases/Delimiter.md)

Defined in: [lib/utils/csv-parser-enhanced.ts:179](https://github.com/JoeInnsp23/practice-hub/blob/49fb3d52594bfe0a4b5b78917ca941048392595b/lib/utils/csv-parser-enhanced.ts#L179)

Analyze delimiter usage across multiple lines for better detection

More robust than single-line detection - checks consistency across rows

## Parameters

### content

`string`

CSV content

### linesToCheck

`number` = `5`

Number of lines to analyze (default: 5)

## Returns

[`Delimiter`](../type-aliases/Delimiter.md)

Detected delimiter
