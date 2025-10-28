[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / getMentionQuery

# Function: getMentionQuery()

> **getMentionQuery**(`text`, `cursorPosition`): `string`

Defined in: [lib/services/mention-parser.ts:250](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/services/mention-parser.ts#L250)

Extract partial mention query from text at cursor position

Used for autocomplete to get the search query after @ symbol.

## Parameters

### text

`string`

Current text content

### cursorPosition

`number`

Current cursor position

## Returns

`string`

The partial mention query (text after @ symbol)

## Example

```ts
getMentionQuery("Hello @jo", 9) // Returns: "jo"
getMentionQuery("Hello @", 7) // Returns: ""
```
