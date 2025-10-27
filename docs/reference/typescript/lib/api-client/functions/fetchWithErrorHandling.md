[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/api-client](../README.md) / fetchWithErrorHandling

# Function: fetchWithErrorHandling()

> **fetchWithErrorHandling**\<`T`\>(`fetcher`, `options?`): `Promise`\<`T` \| `null`\>

Defined in: [lib/api-client.ts:277](https://github.com/JoeInnsp23/practice-hub/blob/ec39bc47722fe13b1d3b24e2cb6c1d5ba6d1fb75/lib/api-client.ts#L277)

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
