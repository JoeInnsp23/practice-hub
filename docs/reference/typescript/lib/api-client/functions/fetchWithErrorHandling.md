[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/api-client](../README.md) / fetchWithErrorHandling

# Function: fetchWithErrorHandling()

> **fetchWithErrorHandling**\<`T`\>(`fetcher`, `options?`): `Promise`\<`T` \| `null`\>

Defined in: [lib/api-client.ts:277](https://github.com/JoeInnsp23/practice-hub/blob/6fb9b8384d137e195384abb23927b89eacc534ff/lib/api-client.ts#L277)

## Type Parameters

### T

`T` = `unknown`

## Parameters

### fetcher

() => `Promise`\<`T`\>

### options?

#### errorMessage?

`string`

#### retryable?

`boolean`

#### showError?

`boolean`

## Returns

`Promise`\<`T` \| `null`\>
