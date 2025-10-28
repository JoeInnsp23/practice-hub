[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/schemas/settings-schemas](../README.md) / companySettingsSchema

# Variable: companySettingsSchema

> `const` **companySettingsSchema**: `ZodObject`\<\{ `company`: `ZodObject`\<\{ `address`: `ZodObject`\<\{ `city`: `ZodOptional`\<`ZodString`\>; `country`: `ZodDefault`\<`ZodString`\>; `postcode`: `ZodOptional`\<`ZodString`\>; `street`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; `email`: `ZodString`; `name`: `ZodString`; `phone`: `ZodOptional`\<`ZodString`\>; \}, `$strip`\>; `fiscal`: `ZodObject`\<\{ `fiscalYearStart`: `ZodDefault`\<`ZodString`\>; \}, `$strip`\>; `regional`: `ZodObject`\<\{ `currency`: `ZodDefault`\<`ZodEnum`\<\{ `EUR`: `"EUR"`; `GBP`: `"GBP"`; `USD`: `"USD"`; \}\>\>; `dateFormat`: `ZodDefault`\<`ZodEnum`\<\{ `DD/MM/YYYY`: `"DD/MM/YYYY"`; `MM/DD/YYYY`: `"MM/DD/YYYY"`; `YYYY-MM-DD`: `"YYYY-MM-DD"`; \}\>\>; `timezone`: `ZodDefault`\<`ZodString`\>; \}, `$strip`\>; \}, `$strip`\>

Defined in: [lib/schemas/settings-schemas.ts:6](https://github.com/JoeInnsp23/practice-hub/blob/e9a2eaf56b3cb77274a3615a2896a70e33ba4a33/lib/schemas/settings-schemas.ts#L6)

Schema for company/tenant settings stored in tenants.metadata JSONB
