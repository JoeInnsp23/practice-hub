[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / decryptObject

# Function: decryptObject()

> **decryptObject**\<`T`\>(`encryptedText`): `T`

Defined in: [lib/services/encryption.ts:180](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/services/encryption.ts#L180)

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
