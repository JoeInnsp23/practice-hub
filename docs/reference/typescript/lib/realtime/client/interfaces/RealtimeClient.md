[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/client](../README.md) / RealtimeClient

# Interface: RealtimeClient

Defined in: [lib/realtime/client.ts:96](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L96)

Abstract Realtime Client Interface

Defines the contract for real-time communication implementations.
Both SSE and WebSocket implementations must conform to this interface.

## Methods

### connect()

> **connect**(`url`, `options?`): `void`

Defined in: [lib/realtime/client.ts:102](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L102)

Establish connection to realtime server

#### Parameters

##### url

`string`

Connection URL

##### options?

[`ConnectionOptions`](ConnectionOptions.md)

Connection options

#### Returns

`void`

***

### disconnect()

> **disconnect**(): `void`

Defined in: [lib/realtime/client.ts:107](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L107)

Disconnect from realtime server

#### Returns

`void`

***

### getState()

> **getState**(): [`ConnectionState`](../type-aliases/ConnectionState.md)

Defined in: [lib/realtime/client.ts:131](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L131)

Get current connection state

#### Returns

[`ConnectionState`](../type-aliases/ConnectionState.md)

Current connection state

***

### getStats()

> **getStats**(): [`ConnectionStats`](ConnectionStats.md)

Defined in: [lib/realtime/client.ts:137](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L137)

Get connection statistics

#### Returns

[`ConnectionStats`](ConnectionStats.md)

Connection statistics

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: [lib/realtime/client.ts:148](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L148)

Check if client is connected

#### Returns

`boolean`

True if connected, false otherwise

***

### reconnect()

> **reconnect**(): `void`

Defined in: [lib/realtime/client.ts:142](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L142)

Manually trigger reconnection

#### Returns

`void`

***

### setPollingFallback()

> **setPollingFallback**(`enabled`): `void`

Defined in: [lib/realtime/client.ts:154](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L154)

Enable/disable polling fallback

#### Parameters

##### enabled

`boolean`

Enable or disable polling

#### Returns

`void`

***

### subscribe()

> **subscribe**\<`T`\>(`eventType`, `callback`): () => `void`

Defined in: [lib/realtime/client.ts:115](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L115)

Subscribe to a specific event type

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### eventType

`string`

Event type to subscribe to (e.g., 'activity:new')

##### callback

[`SubscriptionCallback`](../type-aliases/SubscriptionCallback.md)\<`T`\>

Callback function to handle events

#### Returns

Unsubscribe function

> (): `void`

##### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(`eventType`, `callback?`): `void`

Defined in: [lib/realtime/client.ts:125](https://github.com/JoeInnsp23/practice-hub/blob/284a9fff32491ffcb5ff51d36ad52c88493e7404/lib/realtime/client.ts#L125)

Unsubscribe from a specific event type

#### Parameters

##### eventType

`string`

Event type to unsubscribe from

##### callback?

[`SubscriptionCallback`](../type-aliases/SubscriptionCallback.md)\<`unknown`\>

Callback function to remove (optional, removes all if not provided)

#### Returns

`void`
