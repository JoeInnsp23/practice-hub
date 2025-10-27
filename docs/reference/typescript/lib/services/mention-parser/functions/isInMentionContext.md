[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / isInMentionContext

# Function: isInMentionContext()

> **isInMentionContext**(`text`, `cursorPosition`): `boolean`

Defined in: [lib/services/mention-parser.ts:211](https://github.com/JoeInnsp23/practice-hub/blob/a3dc67446cfc55d2f29bf75271eb5c98593aea17/lib/services/mention-parser.ts#L211)

Check if cursor is in a mention context (after @ symbol)

## Parameters

### text

`string`

Current text content

### cursorPosition

`number`

Current cursor position

## Returns

`boolean`

True if cursor is after @ symbol and before whitespace

## Example

```ts
isInMentionContext("Hello @jo", 9) // Returns: true
isInMentionContext("Hello
```

## John

", 12) // Returns: false (space after mention)
