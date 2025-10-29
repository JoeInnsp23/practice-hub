[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/ai/extract-client-data](../README.md) / DocumentExtractionResult

# Interface: DocumentExtractionResult

Defined in: [lib/ai/extract-client-data.ts:94](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L94)

Combined extraction result (UK-specific document types)

## Properties

### addressData?

> `optional` **addressData**: [`ExtractedAddressData`](ExtractedAddressData.md)

Defined in: [lib/ai/extract-client-data.ts:103](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L103)

***

### companyData?

> `optional` **companyData**: [`ExtractedCompanyData`](ExtractedCompanyData.md)

Defined in: [lib/ai/extract-client-data.ts:102](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L102)

***

### confidence

> **confidence**: `"medium"` \| `"low"` \| `"high"`

Defined in: [lib/ai/extract-client-data.ts:100](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L100)

***

### documentType

> **documentType**: `"unknown"` \| `"individual_id"` \| `"company_certificate"` \| `"address_proof"`

Defined in: [lib/ai/extract-client-data.ts:95](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L95)

***

### individualData?

> `optional` **individualData**: [`ExtractedIndividualData`](ExtractedIndividualData.md)

Defined in: [lib/ai/extract-client-data.ts:101](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L101)

***

### rawText?

> `optional` **rawText**: `string`

Defined in: [lib/ai/extract-client-data.ts:104](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L104)

***

### warnings?

> `optional` **warnings**: `string`[]

Defined in: [lib/ai/extract-client-data.ts:105](https://github.com/JoeInnsp23/practice-hub/blob/7df6add5a5fd051dd64ec39b8575b2b0e33b9d04/lib/ai/extract-client-data.ts#L105)
