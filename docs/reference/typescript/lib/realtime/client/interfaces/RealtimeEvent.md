[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/client](../README.md) / RealtimeEvent

# Interface: RealtimeEvent\<T\>

Defined in: [lib/realtime/client.ts:34](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L34)

Realtime event structure

## Type Parameters

### T

`T` = `unknown`

## Properties

### data

> **data**: `T`

Defined in: [lib/realtime/client.ts:38](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L38)

Event payload

***

### id?

> `optional` **id**: `string`

Defined in: [lib/realtime/client.ts:42](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L42)

Event ID (for deduplication)

***

### timestamp?

> `optional` **timestamp**: `number`

Defined in: [lib/realtime/client.ts:40](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L40)

Event timestamp

***

### type

> **type**: `string`

Defined in: [lib/realtime/client.ts:36](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L36)

Event type (e.g., 'activity:new', 'notification:new', 'ping')
