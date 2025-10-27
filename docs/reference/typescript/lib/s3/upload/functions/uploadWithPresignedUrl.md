[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / uploadWithPresignedUrl

# Function: uploadWithPresignedUrl()

> **uploadWithPresignedUrl**(`buffer`, `key`, `contentType`, `expiresIn`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:132](https://github.com/JoeInnsp23/practice-hub/blob/a3dc67446cfc55d2f29bf75271eb5c98593aea17/lib/s3/upload.ts#L132)

Upload file and return presigned URL instead of public URL

More secure alternative to uploadToS3() for sensitive documents.
The returned URL expires after the specified time.

## Parameters

### buffer

`Buffer`

File buffer to upload

### key

`string`

S3 object key (file path in bucket)

### contentType

`string` = `"application/octet-stream"`

MIME type of the file

### expiresIn

`number` = `3600`

URL expiration in seconds (default: 3600 = 1 hour)

## Returns

`Promise`\<`string`\>

Presigned URL with expiration
