[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/save-extracted-data](../README.md) / saveExtractedDataToOnboarding

# Function: saveExtractedDataToOnboarding()

> **saveExtractedDataToOnboarding**(`tenantId`, `onboardingSessionId`, `extractedData`, `documentType`): `Promise`\<`void`\>

Defined in: [lib/ai/save-extracted-data.ts:35](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/ai/save-extracted-data.ts#L35)

Save extracted data to onboarding_responses table

Each field from the extraction is saved as a separate response record
with extractedFromAi = true and verifiedByUser = false.

The client will later verify/edit these values in the questionnaire UI.

## Parameters

### tenantId

`string`

### onboardingSessionId

`string`

### extractedData

[`QuestionnaireResponses`](../../extract-client-data/type-aliases/QuestionnaireResponses.md)

### documentType

`string`

## Returns

`Promise`\<`void`\>
