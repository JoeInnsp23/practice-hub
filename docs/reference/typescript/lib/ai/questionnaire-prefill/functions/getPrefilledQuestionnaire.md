[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/questionnaire-prefill](../README.md) / getPrefilledQuestionnaire

# Function: getPrefilledQuestionnaire()

> **getPrefilledQuestionnaire**(`onboardingSessionId`): `Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>

Defined in: [lib/ai/questionnaire-prefill.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/d9496975b4531ee6b6c9f97767a80271c265ed85/lib/ai/questionnaire-prefill.ts#L276)

Get pre-filled questionnaire for an onboarding session

Uses in-memory cache (30s TTL) to reduce database reads

## Parameters

### onboardingSessionId

`string`

## Returns

`Promise`\<[`PrefilledQuestionnaireResponse`](../interfaces/PrefilledQuestionnaireResponse.md)\>
