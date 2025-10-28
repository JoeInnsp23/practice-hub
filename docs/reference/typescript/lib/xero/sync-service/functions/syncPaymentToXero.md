[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/sync-service](../README.md) / syncPaymentToXero

# Function: syncPaymentToXero()

> **syncPaymentToXero**(`invoiceId`, `tenantId`, `paymentAmount`, `paymentDate`, `bankAccountCode`, `reference?`): `Promise`\<\{ `error?`: `string`; `success`: `boolean`; \}\>

Defined in: [lib/xero/sync-service.ts:268](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/sync-service.ts#L268)

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
