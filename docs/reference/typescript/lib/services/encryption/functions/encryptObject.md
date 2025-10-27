[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / encryptObject

# Function: encryptObject()

> **encryptObject**\<`T`\>(`obj`): `string`

Defined in: [lib/services/encryption.ts:163](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/services/encryption.ts#L163)

Encrypt an object as JSON

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### obj

`T`

Object to encrypt

## Returns

`string`

Encrypted string

## Example

```ts
const encrypted = encryptObject({ accessToken: 'token123', refreshToken: 'refresh456' });
```
