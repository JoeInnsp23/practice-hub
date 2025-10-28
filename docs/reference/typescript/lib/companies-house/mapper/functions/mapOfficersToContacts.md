[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/companies-house/mapper](../README.md) / mapOfficersToContacts

# Function: mapOfficersToContacts()

> **mapOfficersToContacts**(`officers`): `object`[]

Defined in: [lib/companies-house/mapper.ts:153](https://github.com/JoeInnsp23/practice-hub/blob/acab0e17ea4a394fff6649c0803f80d93f290c0b/lib/companies-house/mapper.ts#L153)

Map Companies House officers to Practice Hub client contacts

Note: Companies House does not provide email or phone numbers.
These fields are left empty and should be collected manually.

## Parameters

### officers

[`Officer`](../../client/interfaces/Officer.md)[]

Officers array from Companies House API

## Returns

`object`[]

Array of mapped contact data ready for database insertion

## Example

```typescript
const officers = await getOfficers("00000006");
const contacts = mapOfficersToContacts(officers);
// Insert into clientContacts table with tenantId and clientId
```
