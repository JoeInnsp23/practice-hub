[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/rate-limit](../README.md) / getClientIdentifier

# Function: getClientIdentifier()

> **getClientIdentifier**(`request`): `string`

Defined in: [lib/rate-limit.ts:164](https://github.com/JoeInnsp23/practice-hub/blob/5a81eef93b46beb81e7e9db3e6f24af22dcfbdcf/lib/rate-limit.ts#L164)

Get client identifier from request

Uses IP address as identifier with fallback to x-forwarded-for header

## Parameters

### request

`Request`

## Returns

`string`
