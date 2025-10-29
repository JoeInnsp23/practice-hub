[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/validators/csv-import](../README.md) / serviceImportSchema

# Variable: serviceImportSchema

> `const` **serviceImportSchema**: `ZodObject`\<\{ `category`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `code`: `ZodString`; `description`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `estimated_hours`: `ZodUnion`\<\[`ZodPipe`\<`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`number` \| `undefined`, `string` \| `undefined`\>\>, `ZodOptional`\<`ZodNumber`\>\>, `ZodLiteral`\<`""`\>\]\>; `is_active`: `ZodUnion`\<\[`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`boolean`, `string` \| `undefined`\>\>, `ZodLiteral`\<`""`\>\]\>; `is_taxable`: `ZodUnion`\<\[`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`boolean`, `string` \| `undefined`\>\>, `ZodLiteral`\<`""`\>\]\>; `name`: `ZodString`; `notes`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `price`: `ZodUnion`\<\[`ZodPipe`\<`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`number` \| `undefined`, `string` \| `undefined`\>\>, `ZodOptional`\<`ZodNumber`\>\>, `ZodLiteral`\<`""`\>\]\>; `price_type`: `ZodUnion`\<\[`ZodOptional`\<`ZodEnum`\<\{ `annual`: `"annual"`; `custom`: `"custom"`; `fixed`: `"fixed"`; `hourly`: `"hourly"`; `monthly`: `"monthly"`; \}\>\>, `ZodLiteral`\<`""`\>\]\>; `tax_rate`: `ZodUnion`\<\[`ZodPipe`\<`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`number` \| `undefined`, `string` \| `undefined`\>\>, `ZodOptional`\<`ZodNumber`\>\>, `ZodLiteral`\<`""`\>\]\>; \}, `$strip`\>

Defined in: [lib/validators/csv-import.ts:179](https://github.com/JoeInnsp23/practice-hub/blob/186c10535b61d69a87268563dccf39fc73de34e9/lib/validators/csv-import.ts#L179)
