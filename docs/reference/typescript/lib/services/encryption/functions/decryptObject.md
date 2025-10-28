[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / decryptObject

# Function: decryptObject()

> **decryptObject**\<`T`\>(`encryptedText`): `T`

Defined in: [lib/services/encryption.ts:180](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/services/encryption.ts#L180)

Decrypt a string back to an object

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### encryptedText

`string`

Encrypted string

## Returns

`T`

Decrypted object

## Example

```ts
const credentials = decryptObject<XeroCredentials>(encrypted);
console.log(credentials.accessToken);
```
