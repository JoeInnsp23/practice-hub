[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/storage/s3](../README.md) / getPresignedUrl

# Function: getPresignedUrl()

> **getPresignedUrl**(`fileName`, `expiresIn`): `Promise`\<`string`\>

Defined in: [lib/storage/s3.ts:74](https://github.com/JoeInnsp23/practice-hub/blob/e0ef571226578854c741d6e06926dc89b19fe27e/lib/storage/s3.ts#L74)

Generate a presigned URL for temporary access to a private file

## Parameters

### fileName

`string`

Name of the file in S3

### expiresIn

`number` = `3600`

URL expiration time in seconds (default: 3600 = 1 hour)

## Returns

`Promise`\<`string`\>

Presigned URL
