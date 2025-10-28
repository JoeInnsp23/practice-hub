[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/api-client](../README.md) / XeroApiClient

# Class: XeroApiClient

Defined in: [lib/xero/api-client.ts:93](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L93)

Xero API Client for pushing data to Xero

## Constructors

### Constructor

> **new XeroApiClient**(): `XeroApiClient`

#### Returns

`XeroApiClient`

## Methods

### createOrUpdateContact()

> **createOrUpdateContact**(`tenantId`, `contact`): `Promise`\<\{ `ContactID`: `string`; \} \| `null`\>

Defined in: [lib/xero/api-client.ts:203](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L203)

Create or update a contact in Xero

#### Parameters

##### tenantId

`string`

##### contact

`XeroContact`

#### Returns

`Promise`\<\{ `ContactID`: `string`; \} \| `null`\>

***

### createOrUpdateInvoice()

> **createOrUpdateInvoice**(`tenantId`, `invoice`): `Promise`\<\{ `InvoiceID`: `string`; \} \| `null`\>

Defined in: [lib/xero/api-client.ts:244](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L244)

Create or update an invoice in Xero

#### Parameters

##### tenantId

`string`

##### invoice

`XeroInvoice`

#### Returns

`Promise`\<\{ `InvoiceID`: `string`; \} \| `null`\>

***

### createPayment()

> **createPayment**(`tenantId`, `payment`): `Promise`\<\{ `PaymentID`: `string`; \} \| `null`\>

Defined in: [lib/xero/api-client.ts:285](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L285)

Create a payment in Xero

#### Parameters

##### tenantId

`string`

##### payment

`XeroPayment`

#### Returns

`Promise`\<\{ `PaymentID`: `string`; \} \| `null`\>

***

### getContact()

> **getContact**(`tenantId`, `contactId`): `Promise`\<`XeroContact` \| `null`\>

Defined in: [lib/xero/api-client.ts:326](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L326)

Get a contact from Xero by ID

#### Parameters

##### tenantId

`string`

##### contactId

`string`

#### Returns

`Promise`\<`XeroContact` \| `null`\>

***

### getCredentials()

> **getCredentials**(`tenantId`): `Promise`\<`XeroCredentials` \| `null`\>

Defined in: [lib/xero/api-client.ts:100](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L100)

Get Xero credentials for a tenant
Automatically refreshes if expired

#### Parameters

##### tenantId

`string`

#### Returns

`Promise`\<`XeroCredentials` \| `null`\>

***

### getInvoice()

> **getInvoice**(`tenantId`, `invoiceId`): `Promise`\<`XeroInvoice` \| `null`\>

Defined in: [lib/xero/api-client.ts:368](https://github.com/JoeInnsp23/practice-hub/blob/0b40fce16ca807036df389d30ed7173195078395/lib/xero/api-client.ts#L368)

Get an invoice from Xero by ID

#### Parameters

##### tenantId

`string`

##### invoiceId

`string`

#### Returns

`Promise`\<`XeroInvoice` \| `null`\>
