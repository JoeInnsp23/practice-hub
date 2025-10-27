[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/client-import-validator](../README.md) / clientImportRowSchema

# Variable: clientImportRowSchema

> `const` **clientImportRowSchema**: `ZodObject`\<\{ `city`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `client_code`: `ZodOptional`\<`ZodString`\>; `client_manager_email`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `client_type`: `ZodEnum`\<\{ `company`: `"company"`; `individual`: `"individual"`; `partnership`: `"partnership"`; `trust`: `"trust"`; \}\>; `companies_house_number`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `company_name`: `ZodString`; `country`: `ZodDefault`\<`ZodString`\>; `email`: `ZodPipe`\<`ZodString`, `ZodTransform`\<`string`, `string`\>\>; `phone`: `ZodOptional`\<`ZodString`\>; `postcode`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `status`: `ZodDefault`\<`ZodEnum`\<\{ `active`: `"active"`; `inactive`: `"inactive"`; `lead`: `"lead"`; `prospect`: `"prospect"`; \}\>\>; `street_address`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `vat_number`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; \}, `$strip`\>

Defined in: [lib/services/client-import-validator.ts:7](https://github.com/JoeInnsp23/practice-hub/blob/e884ea9f5209b5419fb4ebc2881f2b55c91706c8/lib/services/client-import-validator.ts#L7)
