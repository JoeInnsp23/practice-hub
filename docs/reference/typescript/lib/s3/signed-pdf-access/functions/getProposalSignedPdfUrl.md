[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/s3/signed-pdf-access](../README.md) / getProposalSignedPdfUrl

# Function: getProposalSignedPdfUrl()

> **getProposalSignedPdfUrl**(`proposalId`, `ttlSeconds`): `Promise`\<`string` \| `null`\>

Defined in: [lib/s3/signed-pdf-access.ts:16](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/s3/signed-pdf-access.ts#L16)

Get presigned URL for signed proposal PDF

Generates a time-limited presigned URL for secure access to signed proposal PDFs.
Supports backward compatibility with old public URLs stored in the database.

## Parameters

### proposalId

`string`

Proposal UUID

### ttlSeconds

`number` = `...`

Time-to-live in seconds (default: 48 hours)

## Returns

`Promise`\<`string` \| `null`\>

Presigned URL with expiration, or null if no PDF available
