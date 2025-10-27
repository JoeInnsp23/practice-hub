[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/client-portal/access-manager](../README.md) / grantClientAccess

# Function: grantClientAccess()

> **grantClientAccess**(`portalUserId`, `clientId`, `role`, `grantedBy`, `tenantId`): `Promise`\<`void`\>

Defined in: [lib/client-portal/access-manager.ts:87](https://github.com/JoeInnsp23/practice-hub/blob/7c932d85a4ffc59abe78e386db0d258f6398fe91/lib/client-portal/access-manager.ts#L87)

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
