[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / insertMention

# Function: insertMention()

> **insertMention**(`text`, `cursorPosition`, `userName`): `object`

Defined in: [lib/services/mention-parser.ts:168](https://github.com/JoeInnsp23/practice-hub/blob/eff6b04e3024369473845314332b9fed12a0e0c8/lib/services/mention-parser.ts#L168)

Insert a mention at the cursor position in text

## Parameters

### text

`string`

Current text content

### cursorPosition

`number`

Current cursor position in text

### userName

`string`

Name to mention (will be formatted as @[Name])

## Returns

`object`

Object with new text and new cursor position

### cursorPosition

> **cursorPosition**: `number`

### text

> **text**: `string`

## Example

```ts
insertMention("Hello ", 6, "John Doe")
// Returns: { text: "Hello @[John Doe] ", cursorPosition: 17 }
```
