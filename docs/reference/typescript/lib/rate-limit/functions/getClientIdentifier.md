[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / getClientIdentifier

# Function: getClientIdentifier()

> **getClientIdentifier**(`request`): `string`

Defined in: [lib/rate-limit.ts:164](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/rate-limit.ts#L164)

Get client identifier from request

Uses IP address as identifier with fallback to x-forwarded-for header

## Parameters

### request

`Request`

## Returns

`string`
