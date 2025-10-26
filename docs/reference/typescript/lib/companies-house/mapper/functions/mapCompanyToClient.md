[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/mapper](../README.md) / mapCompanyToClient

# Function: mapCompanyToClient()

> **mapCompanyToClient**(`company`): `object`

Defined in: [lib/companies-house/mapper.ts:122](https://github.com/JoeInnsp23/practice-hub/blob/9ffe11ce62534511f8e0911416af99f9975bb246/lib/companies-house/mapper.ts#L122)

Map Companies House company details to Practice Hub client schema

## Parameters

### company

[`CompanyDetails`](../../client/interfaces/CompanyDetails.md)

Company details from Companies House API

## Returns

`object`

Mapped client data ready for database insertion

### addressLine1

> **addressLine1**: `string`

### addressLine2

> **addressLine2**: `string` \| `null`

### city

> **city**: `string`

### country

> **country**: `string`

### incorporationDate

> **incorporationDate**: `string` = `company.dateOfCreation`

### name

> **name**: `string` = `company.companyName`

### postalCode

> **postalCode**: `string`

### registrationNumber

> **registrationNumber**: `string` = `company.companyNumber`

### status

> **status**: `string`

### type

> **type**: `string`

## Example

```typescript
const company = await getCompany("00000006");
const clientData = mapCompanyToClient(company);
// Insert into clients table with tenantId
```
