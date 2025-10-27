[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / HMRCError

# Class: HMRCError

Defined in: [lib/hmrc/client.ts:43](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/hmrc/client.ts#L43)

## Extends

- `Error`

## Extended by

- [`VATNotFoundError`](VATNotFoundError.md)
- [`RateLimitError`](RateLimitError.md)
- [`APIServerError`](APIServerError.md)
- [`NetworkError`](NetworkError.md)
- [`AuthenticationError`](AuthenticationError.md)

## Constructors

### Constructor

> **new HMRCError**(`message`, `statusCode?`, `vatNumber?`): `HMRCError`

Defined in: [lib/hmrc/client.ts:44](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/hmrc/client.ts#L44)

#### Parameters

##### message

`string`

##### statusCode?

`number`

##### vatNumber?

`string`

#### Returns

`HMRCError`

#### Overrides

`Error.constructor`

## Properties

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/hmrc/client.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/hmrc/client.ts#L46)

***

### vatNumber?

> `optional` **vatNumber**: `string`

Defined in: [lib/hmrc/client.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/hmrc/client.ts#L47)
