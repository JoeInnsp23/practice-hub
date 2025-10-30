[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/questionnaire-prefill](../README.md) / getPrefilledQuestionnaire

# Function: getPrefilledQuestionnaire()

> **getPrefilledQuestionnaire**(`onboardingSessionId`): `Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>

Defined in: [lib/ai/questionnaire-prefill.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/lib/ai/questionnaire-prefill.ts#L276)

Get pre-filled questionnaire for an onboarding session

Uses in-memory cache (30s TTL) to reduce database reads

## Parameters

### onboardingSessionId

`string`

## Returns

`Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>
