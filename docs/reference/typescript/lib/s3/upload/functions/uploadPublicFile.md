[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / uploadPublicFile

# Function: uploadPublicFile()

> **uploadPublicFile**(`buffer`, `key`, `contentType`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:61](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/s3/upload.ts#L61)

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
