[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/cache](../README.md) / questionnaireResponsesCache

# Variable: questionnaireResponsesCache

> `const` **questionnaireResponsesCache**: `SimpleCache`\<`Record`\<`string`, \{ `extractedFromAi`: `boolean`; `value`: `unknown`; `verifiedByUser`: `boolean`; \}\>\>

Defined in: [lib/cache.ts:101](https://github.com/JoeInnsp23/practice-hub/blob/49fb3d52594bfe0a4b5b78917ca941048392595b/lib/cache.ts#L101)

Cache for onboarding questionnaire responses

TTL: 30 seconds (data can change frequently as users update fields)
