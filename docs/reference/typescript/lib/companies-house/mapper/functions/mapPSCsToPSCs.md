[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/mapper](../README.md) / mapPSCsToPSCs

# Function: mapPSCsToPSCs()

> **mapPSCsToPSCs**(`pscs`): `object`[]

Defined in: [lib/companies-house/mapper.ts:180](https://github.com/JoeInnsp23/practice-hub/blob/eff6b04e3024369473845314332b9fed12a0e0c8/lib/companies-house/mapper.ts#L180)

Map Companies House PSCs to Practice Hub client PSCs

## Parameters

### pscs

[`PSC`](../../client/interfaces/PSC.md)[]

PSCs array from Companies House API

## Returns

`object`[]

Array of mapped PSC data ready for database insertion

## Example

```typescript
const pscs = await getPSCs("00000006");
const pscData = mapPSCsToPSCs(pscs);
// Insert into clientPSCs table with tenantId and clientId
```
