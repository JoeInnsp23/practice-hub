[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/questionnaire-prefill](../README.md) / getPrefilledQuestionnaire

# Function: getPrefilledQuestionnaire()

> **getPrefilledQuestionnaire**(`onboardingSessionId`): `Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>

Defined in: [lib/ai/questionnaire-prefill.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/fa9296e7bbc6822b06362f435d4ecdcd4d0a431c/lib/ai/questionnaire-prefill.ts#L276)

Get pre-filled questionnaire for an onboarding session

Uses in-memory cache (30s TTL) to reduce database reads

## Parameters

### onboardingSessionId

`string`

## Returns

`Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>
