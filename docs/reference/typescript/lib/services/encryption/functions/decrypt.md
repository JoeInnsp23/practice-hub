[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / decrypt

# Function: decrypt()

> **decrypt**(`encryptedText`): `string`

Defined in: [lib/services/encryption.ts:93](https://github.com/JoeInnsp23/practice-hub/blob/7c932d85a4ffc59abe78e386db0d258f6398fe91/lib/services/encryption.ts#L93)

Decrypt text encrypted with AES-256-GCM

## Parameters

### encryptedText

`string`

Encrypted text in format: iv:authTag:encryptedData

## Returns

`string`

Decrypted plain text

## Throws

Error if decryption fails or data is tampered

## Example

```ts
const decrypted = decrypt(encrypted);
const credentials = JSON.parse(decrypted);
```
