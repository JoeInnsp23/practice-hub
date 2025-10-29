[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/xero/api-client](../README.md) / XeroApiClient

# Class: XeroApiClient

Defined in: [lib/xero/api-client.ts:93](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L93)

Xero API Client for pushing data to Xero

## Constructors

### Constructor

> **new XeroApiClient**(): `XeroApiClient`

#### Returns

`XeroApiClient`

## Methods

### createOrUpdateContact()

> **createOrUpdateContact**(`tenantId`, `contact`): `Promise`\<\{ `ContactID`: `string`; \} \| `null`\>

Defined in: [lib/xero/api-client.ts:209](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L209)

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

Defined in: [lib/xero/api-client.ts:250](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L250)

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

Defined in: [lib/xero/api-client.ts:291](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L291)

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

Defined in: [lib/xero/api-client.ts:332](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L332)

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

Defined in: [lib/xero/api-client.ts:100](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L100)

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

Defined in: [lib/xero/api-client.ts:374](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/xero/api-client.ts#L374)

Get an invoice from Xero by ID

#### Parameters

##### tenantId

`string`

##### invoiceId

`string`

#### Returns

`Promise`\<`XeroInvoice` \| `null`\>
