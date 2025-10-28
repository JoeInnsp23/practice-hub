[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / NetworkError

# Class: NetworkError

Defined in: [lib/companies-house/client.ts:83](https://github.com/JoeInnsp23/practice-hub/blob/2134b7d84e9ea0b2fafa4fc72904258cfbae4a7c/lib/companies-house/client.ts#L83)

## Extends

- [`CompaniesHouseError`](CompaniesHouseError.md)

## Constructors

### Constructor

> **new NetworkError**(`originalError`): `NetworkError`

Defined in: [lib/companies-house/client.ts:84](https://github.com/JoeInnsp23/practice-hub/blob/2134b7d84e9ea0b2fafa4fc72904258cfbae4a7c/lib/companies-house/client.ts#L84)

#### Parameters

##### originalError

`unknown`

#### Returns

`NetworkError`

#### Overrides

[`CompaniesHouseError`](CompaniesHouseError.md).[`constructor`](CompaniesHouseError.md#constructor)

## Properties

### companyNumber?

> `optional` **companyNumber**: `string`

Defined in: [lib/companies-house/client.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/2134b7d84e9ea0b2fafa4fc72904258cfbae4a7c/lib/companies-house/client.ts#L55)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`companyNumber`](CompaniesHouseError.md#companynumber)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/companies-house/client.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/2134b7d84e9ea0b2fafa4fc72904258cfbae4a7c/lib/companies-house/client.ts#L54)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`statusCode`](CompaniesHouseError.md#statuscode)
