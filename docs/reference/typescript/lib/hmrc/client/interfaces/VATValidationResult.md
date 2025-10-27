[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / VATValidationResult

# Interface: VATValidationResult

Defined in: [lib/hmrc/client.ts:17](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/hmrc/client.ts#L17)

HMRC VAT API Client

Provides type-safe access to HMRC VAT API endpoints for:
- VAT number validation
- Business name retrieval

Documentation: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-registered-companies-api

Authentication: OAuth 2.0 Server-to-Server (Client Credentials Grant)

## Properties

### businessAddress?

> `optional` **businessAddress**: `object`

Defined in: [lib/hmrc/client.ts:21](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/hmrc/client.ts#L21)

#### countryCode?

> `optional` **countryCode**: `string`

#### line1?

> `optional` **line1**: `string`

#### line2?

> `optional` **line2**: `string`

#### line3?

> `optional` **line3**: `string`

#### line4?

> `optional` **line4**: `string`

#### line5?

> `optional` **line5**: `string`

#### postcode?

> `optional` **postcode**: `string`

***

### businessName?

> `optional` **businessName**: `string`

Defined in: [lib/hmrc/client.ts:20](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/hmrc/client.ts#L20)

***

### isValid

> **isValid**: `boolean`

Defined in: [lib/hmrc/client.ts:18](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/hmrc/client.ts#L18)

***

### vatNumber

> **vatNumber**: `string`

Defined in: [lib/hmrc/client.ts:19](https://github.com/JoeInnsp23/practice-hub/blob/2f3044cf4377c876e1fd695d656fbf0e32cd8e83/lib/hmrc/client.ts#L19)
