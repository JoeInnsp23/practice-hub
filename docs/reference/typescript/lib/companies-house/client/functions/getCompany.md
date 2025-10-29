[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / getCompany

# Function: getCompany()

> **getCompany**(`companyNumber`): `Promise`\<[`CompanyDetails`](../interfaces/CompanyDetails.md)\>

Defined in: [lib/companies-house/client.ts:232](https://github.com/JoeInnsp23/practice-hub/blob/6fb9b8384d137e195384abb23927b89eacc534ff/lib/companies-house/client.ts#L232)

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
