[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / decryptObject

# Function: decryptObject()

> **decryptObject**\<`T`\>(`encryptedText`): `T`

Defined in: [lib/services/encryption.ts:180](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/lib/services/encryption.ts#L180)

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
