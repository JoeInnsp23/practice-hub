[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / encrypt

# Function: encrypt()

> **encrypt**(`text`): `string`

Defined in: [lib/services/encryption.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/services/encryption.ts#L54)

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
