[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / getClientIdentifier

# Function: getClientIdentifier()

> **getClientIdentifier**(`request`): `string`

Defined in: [lib/rate-limit.ts:164](https://github.com/JoeInnsp23/practice-hub/blob/739e003b58036a40f8386fec9007b193ffe02d1f/lib/rate-limit.ts#L164)

Get client identifier from request

Uses IP address as identifier with fallback to x-forwarded-for header

## Parameters

### request

`Request`

## Returns

`string`
