[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/cache](../README.md) / getCachedCompany

# Function: getCachedCompany()

> **getCachedCompany**(`companyNumber`): `Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Defined in: [lib/companies-house/cache.ts:26](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/companies-house/cache.ts#L26)

Get cached company data from database

## Parameters

### companyNumber

`string`

Companies House company number

## Returns

`Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Company data if cache hit and not expired, null otherwise
