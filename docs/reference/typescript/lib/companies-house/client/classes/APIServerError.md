[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / APIServerError

# Class: APIServerError

Defined in: [lib/companies-house/client.ts:76](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/companies-house/client.ts#L76)

## Extends

- [`CompaniesHouseError`](CompaniesHouseError.md)

## Constructors

### Constructor

> **new APIServerError**(`statusCode`): `APIServerError`

Defined in: [lib/companies-house/client.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/companies-house/client.ts#L77)

#### Parameters

##### statusCode

`number`

#### Returns

`APIServerError`

#### Overrides

[`CompaniesHouseError`](CompaniesHouseError.md).[`constructor`](CompaniesHouseError.md#constructor)

## Properties

### companyNumber?

> `optional` **companyNumber**: `string`

Defined in: [lib/companies-house/client.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/companies-house/client.ts#L55)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`companyNumber`](CompaniesHouseError.md#companynumber)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/companies-house/client.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/e79dc0281c79b757604d709e1a40f94413376c22/lib/companies-house/client.ts#L54)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`statusCode`](CompaniesHouseError.md#statuscode)
