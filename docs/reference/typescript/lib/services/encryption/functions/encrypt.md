[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / encrypt

# Function: encrypt()

> **encrypt**(`text`): `string`

Defined in: [lib/services/encryption.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/7fec9eba7e45b7f3789317f983edb1361575ad94/lib/services/encryption.ts#L54)

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
