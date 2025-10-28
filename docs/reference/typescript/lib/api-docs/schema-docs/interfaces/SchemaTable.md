[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/api-docs/schema-docs](../README.md) / SchemaTable

# Interface: SchemaTable

Defined in: [lib/api-docs/schema-docs.ts:22](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L22)

## Properties

### columns

> **columns**: [`SchemaTableColumn`](SchemaTableColumn.md)[]

Defined in: [lib/api-docs/schema-docs.ts:25](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L25)

***

### description?

> `optional` **description**: `string`

Defined in: [lib/api-docs/schema-docs.ts:24](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L24)

***

### indexes?

> `optional` **indexes**: `string`[]

Defined in: [lib/api-docs/schema-docs.ts:26](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L26)

***

### name

> **name**: `string`

Defined in: [lib/api-docs/schema-docs.ts:23](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L23)

***

### relationships?

> `optional` **relationships**: `object`[]

Defined in: [lib/api-docs/schema-docs.ts:27](https://github.com/JoeInnsp23/practice-hub/blob/2dd1774a2a0171454a0dddefeb7a93f757f1da46/lib/api-docs/schema-docs.ts#L27)

#### description?

> `optional` **description**: `string`

#### table

> **table**: `string`

#### type

> **type**: `"one-to-one"` \| `"one-to-many"` \| `"many-to-one"` \| `"many-to-many"`
