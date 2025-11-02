[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / encrypt

# Function: encrypt()

> **encrypt**(`text`): `string`

Defined in: [lib/services/encryption.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/services/encryption.ts#L54)

Encrypt text using AES-256-GCM

## Parameters

### text

`string`

Plain text to encrypt

## Returns

`string`

Encrypted text in format: iv:authTag:encryptedData (all hex-encoded)

## Example

```ts
const encrypted = encrypt(JSON.stringify({ apiKey: 'secret' }));
// Returns: "a1b2c3....:d4e5f6....:g7h8i9...."
```
