[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / uploadPublicFile

# Function: uploadPublicFile()

> **uploadPublicFile**(`buffer`, `key`, `contentType`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:61](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/s3/upload.ts#L61)

Upload file with automatic public read ACL (for MinIO)

## Parameters

### buffer

`Buffer`

### key

`string`

### contentType

`string` = `"application/octet-stream"`

## Returns

`Promise`\<`string`\>
