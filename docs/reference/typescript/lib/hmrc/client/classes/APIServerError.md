[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / APIServerError

# Class: APIServerError

Defined in: [lib/hmrc/client.ts:68](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/hmrc/client.ts#L68)

## Extends

- [`HMRCError`](HMRCError.md)

## Constructors

### Constructor

> **new APIServerError**(`statusCode`): `APIServerError`

Defined in: [lib/hmrc/client.ts:69](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/hmrc/client.ts#L69)

#### Parameters

##### statusCode

`number`

#### Returns

`APIServerError`

#### Overrides

[`HMRCError`](HMRCError.md).[`constructor`](HMRCError.md#constructor)

## Properties

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/hmrc/client.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/hmrc/client.ts#L46)

#### Inherited from

[`HMRCError`](HMRCError.md).[`statusCode`](HMRCError.md#statuscode)

***

### vatNumber?

> `optional` **vatNumber**: `string`

Defined in: [lib/hmrc/client.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/9e7851c354300230e454e29ea7a4f3ebf08bd3a6/lib/hmrc/client.ts#L47)

#### Inherited from

[`HMRCError`](HMRCError.md).[`vatNumber`](HMRCError.md#vatnumber)
