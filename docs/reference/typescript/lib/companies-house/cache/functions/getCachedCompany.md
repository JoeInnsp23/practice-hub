[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/cache](../README.md) / getCachedCompany

# Function: getCachedCompany()

> **getCachedCompany**(`companyNumber`): `Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Defined in: [lib/companies-house/cache.ts:26](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/companies-house/cache.ts#L26)

Get cached company data from database

## Parameters

### companyNumber

`string`

Companies House company number

## Returns

`Promise`\<[`CompanyData`](../interfaces/CompanyData.md) \| `null`\>

Company data if cache hit and not expired, null otherwise
