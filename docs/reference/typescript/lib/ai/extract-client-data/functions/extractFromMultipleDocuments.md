[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/extract-client-data](../README.md) / extractFromMultipleDocuments

# Function: extractFromMultipleDocuments()

> **extractFromMultipleDocuments**(`documents`): `Promise`\<\{ `confidence`: `"medium"` \| `"low"` \| `"high"`; `extractions`: [`DocumentExtractionResult`](../interfaces/DocumentExtractionResult.md)[]; `mergedData`: [`QuestionnaireResponses`](../type-aliases/QuestionnaireResponses.md); \}\>

Defined in: [lib/ai/extract-client-data.ts:323](https://github.com/JoeInnsp23/practice-hub/blob/96e5a8086382bfbabc21e606dd26df6ef63e02dd/lib/ai/extract-client-data.ts#L323)

Batch extract data from multiple documents

Useful for processing all uploaded documents at once

## Parameters

### documents

`object`[]

## Returns

`Promise`\<\{ `confidence`: `"medium"` \| `"low"` \| `"high"`; `extractions`: [`DocumentExtractionResult`](../interfaces/DocumentExtractionResult.md)[]; `mergedData`: [`QuestionnaireResponses`](../type-aliases/QuestionnaireResponses.md); \}\>
