[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/upload](../README.md) / getPresignedUrl

# Function: getPresignedUrl()

> **getPresignedUrl**(`key`, `expiresIn`): `Promise`\<`string`\>

Defined in: [lib/s3/upload.ts:97](https://github.com/JoeInnsp23/practice-hub/blob/400f6cb47eec7523d4762fc26198d406bae9fc52/lib/s3/upload.ts#L97)

Generate presigned URL for secure document access

Creates a temporary URL that expires after a set time (default 1 hour).
Use this for sensitive documents like KYC verification files.

## Parameters

### key

`string`

S3 object key (file path in bucket)

### expiresIn

`number` = `3600`

Expiration time in seconds (default: 3600 = 1 hour)

## Returns

`Promise`\<`string`\>

Presigned URL with expiration
