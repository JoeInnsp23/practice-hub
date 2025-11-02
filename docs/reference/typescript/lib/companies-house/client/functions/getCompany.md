[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / getCompany

# Function: getCompany()

> **getCompany**(`companyNumber`): `Promise`\<[`CompanyDetails`](../interfaces/CompanyDetails.md)\>

Defined in: [lib/companies-house/client.ts:232](https://github.com/JoeInnsp23/practice-hub/blob/dca241f0fd6bb3f57af90d17356789e3883d8e6f/lib/companies-house/client.ts#L232)

Get company details by company number

## Parameters

### companyNumber

`string`

The company number (e.g., "00000006", "SC123456")

## Returns

`Promise`\<[`CompanyDetails`](../interfaces/CompanyDetails.md)\>

Company details including registered office and SIC codes

## Throws

If company doesn't exist

## Throws

If API rate limit exceeded

## Throws

If Companies House API has server error

## Throws

If network request fails

## Example

```typescript
const company = await getCompany("00000006");
console.log(company.companyName); // "MARINE AND GENERAL MUTUAL LIFE ASSURANCE SOCIETY"
```
