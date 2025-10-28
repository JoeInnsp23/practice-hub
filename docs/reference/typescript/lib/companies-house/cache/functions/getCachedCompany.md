[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/cache](../README.md) / getCachedCompany

# Function: getCachedCompany()

> **getCachedCompany**(`companyNumber`): `Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Defined in: [lib/companies-house/cache.ts:26](https://github.com/JoeInnsp23/practice-hub/blob/e0ef571226578854c741d6e06926dc89b19fe27e/lib/companies-house/cache.ts#L26)

Get cached company data from database

## Parameters

### companyNumber

`string`

Companies House company number

## Returns

`Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Company data if cache hit and not expired, null otherwise
