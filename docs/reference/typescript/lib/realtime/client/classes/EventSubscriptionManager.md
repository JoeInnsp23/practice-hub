[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/client](../README.md) / EventSubscriptionManager

# Class: EventSubscriptionManager

Defined in: [lib/realtime/client.ts:160](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L160)

Event emitter for managing subscriptions

## Constructors

### Constructor

> **new EventSubscriptionManager**(): `EventSubscriptionManager`

#### Returns

`EventSubscriptionManager`

## Methods

### clear()

> **clear**(): `void`

Defined in: [lib/realtime/client.ts:221](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L221)

Clear all subscriptions

#### Returns

`void`

***

### emit()

> **emit**\<`T`\>(`event`): `void`

Defined in: [lib/realtime/client.ts:205](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L205)

Emit event to all subscribers

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### event

[`RealtimeEvent`](../interfaces/RealtimeEvent.md)\<`T`\>

#### Returns

`void`

***

### getActiveEventTypes()

> **getActiveEventTypes**(): `string`[]

Defined in: [lib/realtime/client.ts:235](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L235)

Get all active event types

#### Returns

`string`[]

***

### getSubscriptionCount()

> **getSubscriptionCount**(`eventType`): `number`

Defined in: [lib/realtime/client.ts:228](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L228)

Get subscription count for an event type

#### Parameters

##### eventType

`string`

#### Returns

`number`

***

### subscribe()

> **subscribe**\<`T`\>(`eventType`, `callback`): () => `void`

Defined in: [lib/realtime/client.ts:166](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L166)

Add subscription

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### eventType

`string`

##### callback

[`SubscriptionCallback`](../type-aliases/SubscriptionCallback.md)\<`T`\>

#### Returns

> (): `void`

##### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(`eventType`, `callback?`): `void`

Defined in: [lib/realtime/client.ts:186](https://github.com/JoeInnsp23/practice-hub/blob/2cc630b67eec00abeef98e9d5f6c2dd4917bf246/lib/realtime/client.ts#L186)

Remove subscription

#### Parameters

##### eventType

`string`

##### callback?

[`SubscriptionCallback`](../type-aliases/SubscriptionCallback.md)\<`unknown`\>

#### Returns

`void`
