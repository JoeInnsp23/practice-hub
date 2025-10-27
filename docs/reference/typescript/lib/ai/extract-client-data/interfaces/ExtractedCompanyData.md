[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/extract-client-data](../README.md) / ExtractedCompanyData

# Interface: ExtractedCompanyData

Defined in: [lib/ai/extract-client-data.ts:49](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L49)

Extracted company data from incorporation certificates and Companies House extracts
Note: Beneficial ownership (PSC) is included in Companies House extracts

## Properties

### companyName?

> `optional` **companyName**: `string`

Defined in: [lib/ai/extract-client-data.ts:50](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L50)

***

### companyType?

> `optional` **companyType**: `string`

Defined in: [lib/ai/extract-client-data.ts:53](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L53)

***

### directors?

> `optional` **directors**: `object`[]

Defined in: [lib/ai/extract-client-data.ts:61](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L61)

#### appointedDate?

> `optional` **appointedDate**: `string`

#### name

> **name**: `string`

***

### incorporationDate?

> `optional` **incorporationDate**: `string`

Defined in: [lib/ai/extract-client-data.ts:52](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L52)

***

### natureOfBusiness?

> `optional` **natureOfBusiness**: `string`

Defined in: [lib/ai/extract-client-data.ts:72](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L72)

***

### personsWithSignificantControl?

> `optional` **personsWithSignificantControl**: `object`[]

Defined in: [lib/ai/extract-client-data.ts:66](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L66)

#### name

> **name**: `string`

#### natureOfControl?

> `optional` **natureOfControl**: `string`[]

#### notifiedDate?

> `optional` **notifiedDate**: `string`

***

### registeredAddress?

> `optional` **registeredAddress**: `object`

Defined in: [lib/ai/extract-client-data.ts:54](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L54)

#### city?

> `optional` **city**: `string`

#### country?

> `optional` **country**: `string`

#### line1?

> `optional` **line1**: `string`

#### line2?

> `optional` **line2**: `string`

#### postalCode?

> `optional` **postalCode**: `string`

***

### registrationNumber?

> `optional` **registrationNumber**: `string`

Defined in: [lib/ai/extract-client-data.ts:51](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L51)

***

### sicCodes?

> `optional` **sicCodes**: `string`[]

Defined in: [lib/ai/extract-client-data.ts:71](https://github.com/JoeInnsp23/practice-hub/blob/f2fa20f0e070cc93df33366f2b8847ea7a37ea66/lib/ai/extract-client-data.ts#L71)
