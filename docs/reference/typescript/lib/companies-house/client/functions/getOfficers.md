[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / getOfficers

# Function: getOfficers()

> **getOfficers**(`companyNumber`): `Promise`\<[`Officer`](../interfaces/Officer.md)[]\>

Defined in: [lib/companies-house/client.ts:276](https://github.com/JoeInnsp23/practice-hub/blob/e67f2d7c2aef25e0a7c52e201483873b6d5f88c3/lib/companies-house/client.ts#L276)

Get list of officers (directors, secretaries) for a company

## Parameters

### companyNumber

`string`

The company number (e.g., "00000006")

## Returns

`Promise`\<[`Officer`](../interfaces/Officer.md)[]\>

Array of officers with their roles and appointment dates

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
const officers = await getOfficers("00000006");
officers.forEach(officer => {
  console.log(`${officer.name} - ${officer.role}`);
});
```
