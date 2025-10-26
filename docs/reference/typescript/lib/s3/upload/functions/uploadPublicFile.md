[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / uploadPublicFile

# Function: uploadPublicFile()

> **uploadPublicFile**(`buffer`, `key`, `contentType`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:61](https://github.com/JoeInnsp23/practice-hub/blob/7fec9eba7e45b7f3789317f983edb1361575ad94/lib/s3/upload.ts#L61)

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
