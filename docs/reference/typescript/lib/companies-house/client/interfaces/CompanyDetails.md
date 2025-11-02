[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / CompanyDetails

# Interface: CompanyDetails

Defined in: [lib/companies-house/client.ts:16](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L16)

Companies House API Client

Provides type-safe access to Companies House API endpoints for:
- Company details lookup
- Officers (directors, secretaries) lookup
- Persons with Significant Control (PSC) lookup

Documentation: https://developer-specs.company-information.service.gov.uk/

## Properties

### companyName

> **companyName**: `string`

Defined in: [lib/companies-house/client.ts:18](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L18)

***

### companyNumber

> **companyNumber**: `string`

Defined in: [lib/companies-house/client.ts:17](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L17)

***

### dateOfCreation

> **dateOfCreation**: `string`

Defined in: [lib/companies-house/client.ts:29](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L29)

***

### registeredOffice

> **registeredOffice**: `object`

Defined in: [lib/companies-house/client.ts:21](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L21)

#### addressLine1?

> `optional` **addressLine1**: `string`

#### addressLine2?

> `optional` **addressLine2**: `string`

#### country?

> `optional` **country**: `string`

#### locality?

> `optional` **locality**: `string`

#### postalCode?

> `optional` **postalCode**: `string`

#### region?

> `optional` **region**: `string`

***

### sicCodes?

> `optional` **sicCodes**: `string`[]

Defined in: [lib/companies-house/client.ts:30](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L30)

***

### status

> **status**: `string`

Defined in: [lib/companies-house/client.ts:19](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L19)

***

### type

> **type**: `string`

Defined in: [lib/companies-house/client.ts:20](https://github.com/JoeInnsp23/practice-hub/blob/4ac3e11673b26f0cf99f4de854d24fd36cbe0068/lib/companies-house/client.ts#L20)
