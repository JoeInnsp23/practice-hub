[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/client-portal/access-manager](../README.md) / getOrCreatePortalUser

# Function: getOrCreatePortalUser()

> **getOrCreatePortalUser**(`email`, `firstName`, `lastName`, `tenantId`): `Promise`\<[`PortalUserResult`](../interfaces/PortalUserResult.md)\>

Defined in: [lib/client-portal/access-manager.ts:36](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/client-portal/access-manager.ts#L36)

Get existing portal user or create a new one

## Parameters

### email

`string`

User's email address

### firstName

`string`

User's first name

### lastName

`string`

User's last name

### tenantId

`string`

Tenant ID

## Returns

`Promise`\<[`PortalUserResult`](../interfaces/PortalUserResult.md)\>

Portal user info indicating if user is new
