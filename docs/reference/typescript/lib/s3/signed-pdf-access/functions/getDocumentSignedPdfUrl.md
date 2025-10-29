[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/signed-pdf-access](../README.md) / getDocumentSignedPdfUrl

# Function: getDocumentSignedPdfUrl()

> **getDocumentSignedPdfUrl**(`documentId`, `ttlSeconds`): `Promise`\<`string` \| `null`\>

Defined in: [lib/s3/signed-pdf-access.ts:68](https://github.com/JoeInnsp23/practice-hub/blob/258a32ea57b7584319db82afddb1d391c29a7fcb/lib/s3/signed-pdf-access.ts#L68)

Get presigned URL for signed document PDF

Generates a time-limited presigned URL for secure access to signed document PDFs.
Supports backward compatibility with old public URLs stored in the database.

## Parameters

### documentId

`string`

Document UUID

### ttlSeconds

`number` = `...`

Time-to-live in seconds (default: 48 hours)

## Returns

`Promise`\<`string` \| `null`\>

Presigned URL with expiration, or null if no PDF available
