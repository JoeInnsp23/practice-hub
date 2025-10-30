[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/client](../README.md) / getPSCs

# Function: getPSCs()

> **getPSCs**(`companyNumber`): `Promise`\<[`PSC`](../interfaces/PSC.md)[]\>

Defined in: [lib/companies-house/client.ts:312](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/companies-house/client.ts#L312)

Get Persons with Significant Control (PSC) for a company

PSCs are individuals or entities with significant influence or control over a company,
such as shareholders with >25% ownership or voting rights.

## Parameters

### companyNumber

`string`

The company number (e.g., "00000006")

## Returns

`Promise`\<[`PSC`](../interfaces/PSC.md)[]\>

Array of PSCs with their control details

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
const pscs = await getPSCs("00000006");
pscs.forEach(psc => {
  console.log(`${psc.name} - ${psc.kind}`);
  console.log(`Nature of control: ${psc.natureOfControl.join(", ")}`);
});
```
