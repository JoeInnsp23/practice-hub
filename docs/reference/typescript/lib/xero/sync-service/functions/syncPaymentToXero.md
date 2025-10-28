[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / syncPaymentToXero

# Function: syncPaymentToXero()

> **syncPaymentToXero**(`invoiceId`, `tenantId`, `paymentAmount`, `paymentDate`, `bankAccountCode`, `reference?`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [lib/xero/sync-service.ts:268](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/xero/sync-service.ts#L268)

Sync a payment to Xero

Creates a payment record in Xero for an invoice

## Parameters

### invoiceId

`string`

### tenantId

`string`

### paymentAmount

`number`

### paymentDate

`Date`

### bankAccountCode

`string` = `"200"`

### reference?

`string`

## Returns

`Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>
