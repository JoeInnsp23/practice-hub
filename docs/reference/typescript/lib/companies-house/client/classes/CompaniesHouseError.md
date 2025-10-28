[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / CompaniesHouseError

# Class: CompaniesHouseError

Defined in: [lib/companies-house/client.ts:51](https://github.com/JoeInnsp23/practice-hub/blob/55bd3b546d1b7512932ac05d86981f2c5cc8e1c7/lib/companies-house/client.ts#L51)

## Extends

- `Error`

## Extended by

- [`CompanyNotFoundError`](CompanyNotFoundError.md)
- [`RateLimitError`](RateLimitError.md)
- [`APIServerError`](APIServerError.md)
- [`NetworkError`](NetworkError.md)

## Constructors

### Constructor

> **new CompaniesHouseError**(`message`, `statusCode?`, `companyNumber?`): `CompaniesHouseError`

Defined in: [lib/companies-house/client.ts:52](https://github.com/JoeInnsp23/practice-hub/blob/55bd3b546d1b7512932ac05d86981f2c5cc8e1c7/lib/companies-house/client.ts#L52)

#### Parameters

##### message

`string`

##### statusCode?

`number`

##### companyNumber?

`string`

#### Returns

`CompaniesHouseError`

#### Overrides

`Error.constructor`

## Properties

### companyNumber?

> `optional` **companyNumber**: `string`

Defined in: [lib/companies-house/client.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/55bd3b546d1b7512932ac05d86981f2c5cc8e1c7/lib/companies-house/client.ts#L55)

***

### statusCode?

> `optional` **statusCode**: `number`

Defined in: [lib/companies-house/client.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/55bd3b546d1b7512932ac05d86981f2c5cc8e1c7/lib/companies-house/client.ts#L54)
