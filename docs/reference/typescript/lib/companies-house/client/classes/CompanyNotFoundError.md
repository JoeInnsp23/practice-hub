[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / CompanyNotFoundError

# Class: CompanyNotFoundError

Defined in: [lib/companies-house/client.ts:62](https://github.com/JoeInnsp23/practice-hub/blob/babbde75bac22c244b15bf7eaae8f967352ca66a/lib/companies-house/client.ts#L62)

## Extends

- [`CompaniesHouseError`](CompaniesHouseError.md)

## Constructors

### Constructor

> **new CompanyNotFoundError**(`companyNumber`): `CompanyNotFoundError`

Defined in: [lib/companies-house/client.ts:63](https://github.com/JoeInnsp23/practice-hub/blob/babbde75bac22c244b15bf7eaae8f967352ca66a/lib/companies-house/client.ts#L63)

#### Parameters

##### companyNumber

`string`

#### Returns

`CompanyNotFoundError`

#### Overrides

[`CompaniesHouseError`](CompaniesHouseError.md).[`constructor`](CompaniesHouseError.md#constructor)

## Properties

### companyNumber?

> `optional` **companyNumber**: `string`

Defined in: [lib/companies-house/client.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/babbde75bac22c244b15bf7eaae8f967352ca66a/lib/companies-house/client.ts#L55)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`companyNumber`](CompaniesHouseError.md#companynumber)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/companies-house/client.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/babbde75bac22c244b15bf7eaae8f967352ca66a/lib/companies-house/client.ts#L54)

#### Inherited from

[`CompaniesHouseError`](CompaniesHouseError.md).[`statusCode`](CompaniesHouseError.md#statuscode)
