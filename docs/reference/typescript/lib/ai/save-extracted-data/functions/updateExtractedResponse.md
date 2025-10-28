[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/save-extracted-data](../README.md) / updateExtractedResponse

# Function: updateExtractedResponse()

> **updateExtractedResponse**(`onboardingSessionId`, `questionKey`, `newValue`, `tenantId?`): `Promise`\<`void`\>

Defined in: [lib/ai/save-extracted-data.ts:123](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/ai/save-extracted-data.ts#L123)

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
