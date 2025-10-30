[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/save-extracted-data](../README.md) / updateExtractedResponse

# Function: updateExtractedResponse()

> **updateExtractedResponse**(`onboardingSessionId`, `questionKey`, `newValue`, `tenantId?`): `Promise`\<`void`\>

Defined in: [lib/ai/save-extracted-data.ts:123](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/lib/ai/save-extracted-data.ts#L123)

Update extracted data with user edits

When a user edits an AI-extracted field, update the value
and mark as verified.

## Parameters

### onboardingSessionId

`string`

### questionKey

`string`

### newValue

[`QuestionnaireValue`](../../extract-client-data/type-aliases/QuestionnaireValue.md)

### tenantId?

`string`

## Returns

`Promise`\<`void`\>
