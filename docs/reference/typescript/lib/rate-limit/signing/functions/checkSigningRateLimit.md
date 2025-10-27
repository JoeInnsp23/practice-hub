[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/rate-limit/signing](../README.md) / checkSigningRateLimit

# Function: checkSigningRateLimit()

> **checkSigningRateLimit**(`ip`, `proposalId`, `config`): `Promise`\<`void`\>

Defined in: [lib/rate-limit/signing.ts:35](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/rate-limit/signing.ts#L35)

Check signing rate limit for a specific IP + proposalId combination

## Parameters

### ip

`string`

Client IP address

### proposalId

`string`

Proposal ID being accessed

### config

`RateLimitConfig`

Rate limit configuration (maxRequests, windowMs)

## Returns

`Promise`\<`void`\>

## Throws

TRPCError with code TOO_MANY_REQUESTS if limit exceeded
