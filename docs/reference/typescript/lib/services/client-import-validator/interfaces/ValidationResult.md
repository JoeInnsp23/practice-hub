[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/client-import-validator](../README.md) / ValidationResult

# Interface: ValidationResult

Defined in: [lib/services/client-import-validator.ts:41](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L41)

## Properties

### errors

> **errors**: `string`[]

Defined in: [lib/services/client-import-validator.ts:43](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L43)

***

### managerId?

> `optional` **managerId**: `string`

Defined in: [lib/services/client-import-validator.ts:45](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L45)

***

### normalizedRow?

> `optional` **normalizedRow**: `object`

Defined in: [lib/services/client-import-validator.ts:46](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L46)

#### city?

> `optional` **city**: `string`

#### client\_code?

> `optional` **client\_code**: `string`

#### client\_manager\_email?

> `optional` **client\_manager\_email**: `string`

#### client\_type

> **client\_type**: `"individual"` \| `"company"` \| `"partnership"` \| `"trust"`

#### companies\_house\_number?

> `optional` **companies\_house\_number**: `string`

#### company\_name

> **company\_name**: `string`

#### country

> **country**: `string`

#### email

> **email**: `string`

#### phone?

> `optional` **phone**: `string`

#### postcode?

> `optional` **postcode**: `string`

#### status

> **status**: `"active"` \| `"prospect"` \| `"inactive"` \| `"lead"`

#### street\_address?

> `optional` **street\_address**: `string`

#### vat\_number?

> `optional` **vat\_number**: `string`

***

### valid

> **valid**: `boolean`

Defined in: [lib/services/client-import-validator.ts:42](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L42)

***

### warnings?

> `optional` **warnings**: `string`[]

Defined in: [lib/services/client-import-validator.ts:44](https://github.com/JoeInnsp23/practice-hub/blob/2beb59809e0a0bb8425808ee5847eff86199c265/lib/services/client-import-validator.ts#L44)
