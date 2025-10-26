[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/kyc/lemverify-client](../README.md) / VerificationStatus

# Interface: VerificationStatus

Defined in: [lib/kyc/lemverify-client.ts:68](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L68)

Complete verification status including all checks

## Properties

### amlScreening?

> `optional` **amlScreening**: `object`

Defined in: [lib/kyc/lemverify-client.ts:100](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L100)

#### adverseMediaMatch

> **adverseMediaMatch**: `boolean`

#### matches?

> `optional` **matches**: `object`[]

#### pepMatch

> **pepMatch**: `boolean`

#### sanctionsMatch

> **sanctionsMatch**: `boolean`

#### status

> **status**: `"match"` \| `"clear"` \| `"pep"`

#### watchlistMatch

> **watchlistMatch**: `boolean`

***

### clientRef

> **clientRef**: `string`

Defined in: [lib/kyc/lemverify-client.ts:70](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L70)

***

### completedAt?

> `optional` **completedAt**: `string`

Defined in: [lib/kyc/lemverify-client.ts:119](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L119)

***

### createdAt

> **createdAt**: `string`

Defined in: [lib/kyc/lemverify-client.ts:118](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L118)

***

### documentUrls?

> `optional` **documentUrls**: `string`[]

Defined in: [lib/kyc/lemverify-client.ts:115](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L115)

***

### documentVerification?

> `optional` **documentVerification**: `object`

Defined in: [lib/kyc/lemverify-client.ts:75](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L75)

#### documentType

> **documentType**: `"passport"` \| `"driving_licence"`

#### extractedData?

> `optional` **extractedData**: `object`

##### extractedData.dateOfBirth

> **dateOfBirth**: `string`

##### extractedData.documentNumber

> **documentNumber**: `string`

##### extractedData.expiryDate

> **expiryDate**: `string`

##### extractedData.firstName

> **firstName**: `string`

##### extractedData.lastName

> **lastName**: `string`

##### extractedData.nationality?

> `optional` **nationality**: `string`

#### verified

> **verified**: `boolean`

***

### facematch?

> `optional` **facematch**: `object`

Defined in: [lib/kyc/lemverify-client.ts:89](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L89)

#### result

> **result**: `"pass"` \| `"fail"`

#### score

> **score**: `number`

***

### id

> **id**: `string`

Defined in: [lib/kyc/lemverify-client.ts:69](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L69)

***

### liveness?

> `optional` **liveness**: `object`

Defined in: [lib/kyc/lemverify-client.ts:94](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L94)

#### result

> **result**: `"pass"` \| `"fail"`

#### score

> **score**: `number`

***

### outcome?

> `optional` **outcome**: `"pass"` \| `"fail"` \| `"refer"`

Defined in: [lib/kyc/lemverify-client.ts:72](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L72)

***

### reportUrl?

> `optional` **reportUrl**: `string`

Defined in: [lib/kyc/lemverify-client.ts:114](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L114)

***

### status

> **status**: `"pending"` \| `"in_progress"` \| `"completed"` \| `"failed"`

Defined in: [lib/kyc/lemverify-client.ts:71](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L71)

***

### updatedAt

> **updatedAt**: `string`

Defined in: [lib/kyc/lemverify-client.ts:120](https://github.com/JoeInnsp23/practice-hub/blob/ec3a96142a4bc90940f1dc483685d47553a5d556/lib/kyc/lemverify-client.ts#L120)
