[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/client-portal/access-manager](../README.md) / grantClientAccess

# Function: grantClientAccess()

> **grantClientAccess**(`portalUserId`, `clientId`, `role`, `grantedBy`, `tenantId`): `Promise`\<`void`\>

Defined in: [lib/client-portal/access-manager.ts:87](https://github.com/JoeInnsp23/practice-hub/blob/b8e2c559faed2a4c4eeb581a05691698dea77c60/lib/client-portal/access-manager.ts#L87)

Grant a portal user access to a client

## Parameters

### portalUserId

`string`

Portal user ID

### clientId

`string`

Client ID

### role

Access role (viewer, editor, admin)

`"admin"` | `"viewer"` | `"editor"`

### grantedBy

User ID who granted access (internal staff)

`string` | `null`

### tenantId

`string`

Tenant ID

## Returns

`Promise`\<`void`\>
