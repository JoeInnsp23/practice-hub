[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/cache](../README.md) / questionnaireResponsesCache

# Variable: questionnaireResponsesCache

> `const` **questionnaireResponsesCache**: `SimpleCache`\<`Record`\<`string`, \{ `extractedFromAi`: `boolean`; `value`: `unknown`; `verifiedByUser`: `boolean`; \}\>\>

Defined in: [lib/cache.ts:101](https://github.com/JoeInnsp23/practice-hub/blob/eff6b04e3024369473845314332b9fed12a0e0c8/lib/cache.ts#L101)

Cache for onboarding questionnaire responses

TTL: 30 seconds (data can change frequently as users update fields)
