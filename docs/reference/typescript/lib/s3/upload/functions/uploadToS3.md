[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / uploadToS3

# Function: uploadToS3()

> **uploadToS3**(`buffer`, `key`, `contentType`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:29](https://github.com/JoeInnsp23/practice-hub/blob/e3ddd192f92eb8cdb5213c023342cf95c314a8fb/lib/s3/upload.ts#L29)

Upload file to S3 (MinIO or Hetzner)

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

## Returns

`Promise`\<`string`\>

Public URL of the uploaded file
