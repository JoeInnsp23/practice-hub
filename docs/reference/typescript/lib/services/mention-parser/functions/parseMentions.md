[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / parseMentions

# Function: parseMentions()

> **parseMentions**(`text`): `string`[]

Defined in: [lib/services/mention-parser.ts:25](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/services/mention-parser.ts#L25)

Parse

## Parameters

### text

`string`

The text containing

## Returns

`string`[]

Array of mentioned names (without the @ symbol)

## Mentions

from text and extract mentioned usernames/names

Supports two formats:
- @[User Name] - Preferred format with full name in brackets
-

## Username

- Simple username format

## Mentions

## Example

```ts
parseMentions("Hey @[John Doe], can you review this?")
// Returns: ["John Doe"]

parseMentions("@john
```

## Mary

please help")
// Returns: ["john", "mary"]
