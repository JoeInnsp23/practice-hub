[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / formatUserForMention

# Function: formatUserForMention()

> **formatUserForMention**(`user`): `string`

Defined in: [lib/services/mention-parser.ts:147](https://github.com/JoeInnsp23/practice-hub/blob/e3ddd192f92eb8cdb5213c023342cf95c314a8fb/lib/services/mention-parser.ts#L147)

Format a user object for display in

## Parameters

### user

User object with name and email

#### email?

`string`

#### firstName

`string` \| `null`

#### lastName

`string` \| `null`

## Returns

`string`

Formatted string for display

## Mention

autocomplete

## Example

```ts
formatUserForMention({ firstName: "John", lastName: "Doe", email: "john@example.com" })
// Returns: "John Doe (john@example.com)"
```
