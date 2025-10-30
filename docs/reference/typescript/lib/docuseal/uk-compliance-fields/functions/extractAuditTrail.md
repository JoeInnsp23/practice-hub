[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/docuseal/uk-compliance-fields](../README.md) / extractAuditTrail

# Function: extractAuditTrail()

> **extractAuditTrail**(`submission`): `object`

Defined in: [lib/docuseal/uk-compliance-fields.ts:128](https://github.com/JoeInnsp23/practice-hub/blob/b0b909866b95eed49104c62378b0a329433cddfb/lib/docuseal/uk-compliance-fields.ts#L128)

Extract audit trail data from DocuSeal submission

## Parameters

### submission

#### completed_at?

`string`

#### id

`string`

#### status

`string`

#### submitters?

`object`[]

#### template_id

`string`

## Returns

`object`

### authorityConfirmed

> **authorityConfirmed**: `boolean`

### companyName

> **companyName**: `unknown` = `submitter.values.company_name`

### companyNumber

> **companyNumber**: `unknown` = `submitter.values.company_number`

### consentConfirmed

> **consentConfirmed**: `boolean`

### ipAddress

> **ipAddress**: `string` \| `undefined` = `submitter.ip`

### sessionMetadata

> **sessionMetadata**: `object`

#### sessionMetadata.status

> **status**: `string` = `submission.status`

#### sessionMetadata.submissionId

> **submissionId**: `string` = `submission.id`

#### sessionMetadata.templateId

> **templateId**: `string` = `submission.template_id`

### signedAt

> **signedAt**: `string` \| `undefined`

### signerEmail

> **signerEmail**: `string`

### signerName

> **signerName**: `string`

### signingCapacity

> **signingCapacity**: `unknown` = `submitter.values.signing_capacity`

### userAgent

> **userAgent**: `string` \| `undefined` = `submitter.user_agent`

### viewedAt

> **viewedAt**: `string` \| `undefined` = `submitter.opened_at`
