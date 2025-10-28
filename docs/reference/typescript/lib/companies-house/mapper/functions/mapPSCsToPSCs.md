[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/mapper](../README.md) / mapPSCsToPSCs

# Function: mapPSCsToPSCs()

> **mapPSCsToPSCs**(`pscs`): `object`[]

Defined in: [lib/companies-house/mapper.ts:180](https://github.com/JoeInnsp23/practice-hub/blob/96e5a8086382bfbabc21e606dd26df6ef63e02dd/lib/companies-house/mapper.ts#L180)

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
