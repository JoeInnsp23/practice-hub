[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/encryption](../README.md) / encrypt

# Function: encrypt()

> **encrypt**(`text`): `string`

Defined in: [lib/services/encryption.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/3938b1e4aa281b3143a14c67c33d5b24dfa44fca/lib/services/encryption.ts#L54)

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
