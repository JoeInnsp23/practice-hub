[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/middleware](../README.md) / ensureXeroCredentials

# Function: ensureXeroCredentials()

> **ensureXeroCredentials**(`tenantId`): `Promise`\<`XeroCredentials`\>

Defined in: [lib/xero/middleware.ts:100](https://github.com/JoeInnsp23/practice-hub/blob/fa9296e7bbc6822b06362f435d4ecdcd4d0a431c/lib/xero/middleware.ts#L100)

Ensure Xero credentials are valid before proceeding

Throws error if credentials are not found or disabled
Use this for validation before executing Xero operations

## Parameters

### tenantId

`string`

Tenant ID to validate

## Returns

`Promise`\<`XeroCredentials`\>
