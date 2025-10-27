[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/docuseal/client](../README.md) / DocuSealClient

# Class: DocuSealClient

Defined in: [lib/docuseal/client.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L47)

## Constructors

### Constructor

> **new DocuSealClient**(): `DocuSealClient`

Defined in: [lib/docuseal/client.ts:51](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L51)

#### Returns

`DocuSealClient`

## Methods

### createSubmission()

> **createSubmission**(`params`): `Promise`\<`any`\>

Defined in: [lib/docuseal/client.ts:80](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L80)

Create a submission for signing

#### Parameters

##### params

[`CreateSubmissionParams`](../interfaces/CreateSubmissionParams.md)

#### Returns

`Promise`\<`any`\>

***

### createTemplate()

> **createTemplate**(`params`): `Promise`\<`any`\>

Defined in: [lib/docuseal/client.ts:72](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L72)

Create a new template with specified fields

#### Parameters

##### params

[`CreateTemplateParams`](../interfaces/CreateTemplateParams.md)

#### Returns

`Promise`\<`any`\>

***

### deleteTemplate()

> **deleteTemplate**(`templateId`): `Promise`\<`any`\>

Defined in: [lib/docuseal/client.ts:124](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L124)

Delete a template

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`any`\>

***

### downloadSignedPdf()

> **downloadSignedPdf**(`submissionId`): `Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

Defined in: [lib/docuseal/client.ts:96](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L96)

Download signed PDF as buffer

#### Parameters

##### submissionId

`string`

#### Returns

`Promise`\<`Buffer`\<`ArrayBufferLike`\>\>

***

### getEmbedUrl()

> **getEmbedUrl**(`submissionId`, `email`): `string`

Defined in: [lib/docuseal/client.ts:109](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L109)

Get embedded signing URL for a specific submitter

#### Parameters

##### submissionId

`string`

##### email

`string`

#### Returns

`string`

***

### getSubmission()

> **getSubmission**(`submissionId`): `Promise`\<[`DocuSealSubmission`](../interfaces/DocuSealSubmission.md)\>

Defined in: [lib/docuseal/client.ts:88](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L88)

Get submission details by ID

#### Parameters

##### submissionId

`string`

#### Returns

`Promise`\<[`DocuSealSubmission`](../interfaces/DocuSealSubmission.md)\>

***

### getTemplate()

> **getTemplate**(`templateId`): `Promise`\<`any`\>

Defined in: [lib/docuseal/client.ts:132](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L132)

Get template by ID

#### Parameters

##### templateId

`string`

#### Returns

`Promise`\<`any`\>

***

### listTemplates()

> **listTemplates**(): `Promise`\<`any`\>

Defined in: [lib/docuseal/client.ts:116](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/docuseal/client.ts#L116)

List all templates

#### Returns

`Promise`\<`any`\>
