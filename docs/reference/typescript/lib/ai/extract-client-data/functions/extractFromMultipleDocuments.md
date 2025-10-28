[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/extract-client-data](../README.md) / extractFromMultipleDocuments

# Function: extractFromMultipleDocuments()

> **extractFromMultipleDocuments**(`documents`): `Promise`\<\{ `confidence`: `"medium"` \| `"low"` \| `"high"`; `extractions`: [`DocumentExtractionResult`](../interfaces/DocumentExtractionResult.md)[]; `mergedData`: [`QuestionnaireResponses`](../type-aliases/QuestionnaireResponses.md); \}\>

Defined in: [lib/ai/extract-client-data.ts:323](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/ai/extract-client-data.ts#L323)

Batch extract data from multiple documents

Useful for processing all uploaded documents at once

## Parameters

### documents

`object`[]

## Returns

`Promise`\<\{ `confidence`: `"medium"` \| `"low"` \| `"high"`; `extractions`: [`DocumentExtractionResult`](../interfaces/DocumentExtractionResult.md)[]; `mergedData`: [`QuestionnaireResponses`](../type-aliases/QuestionnaireResponses.md); \}\>
