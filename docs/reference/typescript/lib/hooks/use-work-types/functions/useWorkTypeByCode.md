[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hooks/use-work-types](../README.md) / useWorkTypeByCode

# Function: useWorkTypeByCode()

> **useWorkTypeByCode**(`code`): \{ `code`: `string`; `colorCode`: `string`; `createdAt`: `Date`; `id`: `string`; `isActive`: `boolean`; `isBillable`: `boolean`; `label`: `string`; `sortOrder`: `number`; `tenantId`: `string`; `updatedAt`: `Date`; \} \| `undefined`

Defined in: [lib/hooks/use-work-types.ts:22](https://github.com/JoeInnsp23/practice-hub/blob/5327cc3301b709b23bcb2085ea41b82007fa1eef/lib/hooks/use-work-types.ts#L22)

Hook to get a specific work type by code

## Parameters

### code

`string`

Work type code (e.g., "WORK", "ADMIN")

## Returns

\{ `code`: `string`; `colorCode`: `string`; `createdAt`: `Date`; `id`: `string`; `isActive`: `boolean`; `isBillable`: `boolean`; `label`: `string`; `sortOrder`: `number`; `tenantId`: `string`; `updatedAt`: `Date`; \} \| `undefined`

Work type object or undefined
