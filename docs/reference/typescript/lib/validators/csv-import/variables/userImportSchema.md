[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/validators/csv-import](../README.md) / userImportSchema

# Variable: userImportSchema

> `const` **userImportSchema**: `ZodObject`\<\{ `department`: `ZodUnion`\<\[`ZodOptional`\<`ZodString`\>, `ZodLiteral`\<`""`\>\]\>; `email`: `ZodString`; `first_name`: `ZodString`; `hourly_rate`: `ZodUnion`\<\[`ZodPipe`\<`ZodPipe`\<`ZodOptional`\<`ZodString`\>, `ZodTransform`\<`number` \| `undefined`, `string` \| `undefined`\>\>, `ZodOptional`\<`ZodNumber`\>\>, `ZodLiteral`\<`""`\>\]\>; `last_name`: `ZodString`; `role`: `ZodUnion`\<\[`ZodOptional`\<`ZodEnum`\<\{ `accountant`: `"accountant"`; `admin`: `"admin"`; `member`: `"member"`; \}\>\>, `ZodLiteral`\<`""`\>\]\>; `status`: `ZodUnion`\<\[`ZodOptional`\<`ZodEnum`\<\{ `active`: `"active"`; `inactive`: `"inactive"`; \}\>\>, `ZodLiteral`\<`""`\>\]\>; \}, `$strip`\>

Defined in: [lib/validators/csv-import.ts:258](https://github.com/JoeInnsp23/practice-hub/blob/c04a58b0b0fade7601286d40714502e52afe6cf4/lib/validators/csv-import.ts#L258)
