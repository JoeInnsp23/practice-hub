[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / HMRCError

# Class: HMRCError

Defined in: [lib/hmrc/client.ts:43](https://github.com/JoeInnsp23/practice-hub/blob/ec39bc47722fe13b1d3b24e2cb6c1d5ba6d1fb75/lib/hmrc/client.ts#L43)

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

Defined in: [lib/hmrc/client.ts:44](https://github.com/JoeInnsp23/practice-hub/blob/ec39bc47722fe13b1d3b24e2cb6c1d5ba6d1fb75/lib/hmrc/client.ts#L44)

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

Defined in: [lib/hmrc/client.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/ec39bc47722fe13b1d3b24e2cb6c1d5ba6d1fb75/lib/hmrc/client.ts#L46)

***

### vatNumber?

> `optional` **vatNumber**: `string`

Defined in: [lib/hmrc/client.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/ec39bc47722fe13b1d3b24e2cb6c1d5ba6d1fb75/lib/hmrc/client.ts#L47)
