[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hmrc/client](../README.md) / validateVAT

# Function: validateVAT()

> **validateVAT**(`vatNumber`): `Promise`\<[`VATValidationResult`](../interfaces/VATValidationResult.md)\>

Defined in: [lib/hmrc/client.ts:294](https://github.com/JoeInnsp23/practice-hub/blob/5327cc3301b709b23bcb2085ea41b82007fa1eef/lib/hmrc/client.ts#L294)

Validate a UK VAT number and retrieve business details

## Parameters

### vatNumber

`string`

The UK VAT number (e.g., "GB123456789", "123456789")

## Returns

`Promise`\<[`VATValidationResult`](../interfaces/VATValidationResult.md)\>

Validation result with business details if found

## Throws

If VAT number is not registered or invalid

## Throws

If API rate limit exceeded

## Throws

If HMRC API has server error

## Throws

If OAuth authentication fails

## Throws

If network request fails

## Example

```typescript
const result = await validateVAT("GB123456789");
if (result.isValid) {
  console.log(`Business: ${result.businessName}`);
}
```
