[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/cache](../README.md) / CompanyData

# Interface: CompanyData

Defined in: [lib/companies-house/cache.ts:14](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/companies-house/cache.ts#L14)

Companies House API cache layer

Provides database-backed caching with 24-hour TTL to reduce API calls
and improve response times for frequently accessed company data.

## Properties

### company

> **company**: [`CompanyDetails`](../../client/interfaces/CompanyDetails.md)

Defined in: [lib/companies-house/cache.ts:15](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/companies-house/cache.ts#L15)

***

### officers

> **officers**: [`Officer`](../../client/interfaces/Officer.md)[]

Defined in: [lib/companies-house/cache.ts:16](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/companies-house/cache.ts#L16)

***

### pscs

> **pscs**: [`PSC`](../../client/interfaces/PSC.md)[]

Defined in: [lib/companies-house/cache.ts:17](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/companies-house/cache.ts#L17)
