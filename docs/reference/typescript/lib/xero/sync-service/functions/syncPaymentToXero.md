[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / syncPaymentToXero

# Function: syncPaymentToXero()

> **syncPaymentToXero**(`invoiceId`, `tenantId`, `paymentAmount`, `paymentDate`, `bankAccountCode`, `reference?`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [lib/xero/sync-service.ts:268](https://github.com/JoeInnsp23/practice-hub/blob/dca241f0fd6bb3f57af90d17356789e3883d8e6f/lib/xero/sync-service.ts#L268)

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
