[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / extractUserIds

# Function: extractUserIds()

> **extractUserIds**(`mentionedNames`, `availableUsers`): `string`[]

Defined in: [lib/services/mention-parser.ts:103](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/services/mention-parser.ts#L103)

Extract user IDs from an array of user objects based on mentioned names

This function maps mentioned names (extracted via parseMentions) to actual
user IDs from the tenant's user list. It performs case-insensitive matching
on full names.

## Parameters

### mentionedNames

`string`[]

Array of names extracted from

### availableUsers

`object`[]

Array of user objects with id, firstName, and lastName

## Returns

`string`[]

Array of user IDs for matched mentions

## Mentions

## Example

```ts
const mentioned = parseMentions("@[John Doe] @[Jane Smith]");
const userIds = extractUserIds(mentioned, users);
// Returns: ["user-id-1", "user-id-2"]
```
