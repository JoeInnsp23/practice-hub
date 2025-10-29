[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/questionnaire-prefill](../README.md) / getPrefilledQuestionnaire

# Function: getPrefilledQuestionnaire()

> **getPrefilledQuestionnaire**(`onboardingSessionId`): `Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>

Defined in: [lib/ai/questionnaire-prefill.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/ai/questionnaire-prefill.ts#L276)

Get pre-filled questionnaire for an onboarding session

Uses in-memory cache (30s TTL) to reduce database reads

## Parameters

### onboardingSessionId

`string`

## Returns

`Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>
