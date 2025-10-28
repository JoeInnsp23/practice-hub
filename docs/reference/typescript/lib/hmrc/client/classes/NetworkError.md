[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / NetworkError

# Class: NetworkError

Defined in: [lib/hmrc/client.ts:75](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/hmrc/client.ts#L75)

## Extends

- [`HMRCError`](HMRCError.md)

## Constructors

### Constructor

> **new NetworkError**(`originalError`): `NetworkError`

Defined in: [lib/hmrc/client.ts:76](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/hmrc/client.ts#L76)

#### Parameters

##### originalError

`unknown`

#### Returns

`NetworkError`

#### Overrides

[`HMRCError`](HMRCError.md).[`constructor`](HMRCError.md#constructor)

## Properties

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/hmrc/client.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/hmrc/client.ts#L46)

#### Inherited from

[`HMRCError`](HMRCError.md).[`statusCode`](HMRCError.md#statuscode)

***

### vatNumber?

> `optional` **vatNumber**: `string`

Defined in: [lib/hmrc/client.ts:47](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/hmrc/client.ts#L47)

#### Inherited from

[`HMRCError`](HMRCError.md).[`vatNumber`](HMRCError.md#vatnumber)
