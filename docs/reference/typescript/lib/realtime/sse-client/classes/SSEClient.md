[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/sse-client](../README.md) / SSEClient

# Class: SSEClient

Defined in: [lib/realtime/sse-client.ts:42](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L42)

SSE Client Implementation

Server-Sent Events (SSE) implementation of the RealtimeClient interface.
Provides robust reconnection logic, heartbeat detection, and polling fallback.

Features:
- Exponential backoff reconnection
- Heartbeat monitoring (detects stale connections)
- Automatic polling fallback when SSE fails
- Multi-channel event support
- Tenant-scoped event streams

## Example

```typescript
const client = new SSEClient();
client.connect('/api/activity/stream', {
  maxReconnectAttempts: 3,
  heartbeatTimeout: 60000,
});

// Subscribe to activity events
const unsubscribe = client.subscribe('activity:new', (event) => {
  console.log('New activity:', event.data);
});

// Cleanup
unsubscribe();
client.disconnect();
```

## Implements

- [`RealtimeClient`](../../client/interfaces/RealtimeClient.md)

## Constructors

### Constructor

> **new SSEClient**(): `SSEClient`

#### Returns

`SSEClient`

## Methods

### connect()

> **connect**(`url`, `options?`): `void`

Defined in: [lib/realtime/sse-client.ts:67](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L67)

Connect to SSE endpoint

#### Parameters

##### url

`string`

##### options?

[`ConnectionOptions`](../../client/interfaces/ConnectionOptions.md)

#### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`connect`](../../client/interfaces/RealtimeClient.md#connect)

***

### disconnect()

> **disconnect**(): `void`

Defined in: [lib/realtime/sse-client.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L77)

Disconnect from SSE

#### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`disconnect`](../../client/interfaces/RealtimeClient.md#disconnect)

***

### getState()

> **getState**(): [`ConnectionState`](../../client/type-aliases/ConnectionState.md)

Defined in: [lib/realtime/sse-client.ts:102](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L102)

Get current connection state

#### Returns

[`ConnectionState`](../../client/type-aliases/ConnectionState.md)

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`getState`](../../client/interfaces/RealtimeClient.md#getstate)

***

### getStats()

> **getStats**(): [`ConnectionStats`](../../client/interfaces/ConnectionStats.md)

Defined in: [lib/realtime/sse-client.ts:109](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L109)

Get connection statistics

#### Returns

[`ConnectionStats`](../../client/interfaces/ConnectionStats.md)

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`getStats`](../../client/interfaces/RealtimeClient.md#getstats)

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: [lib/realtime/sse-client.ts:133](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L133)

Check if connected

#### Returns

`boolean`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`isConnected`](../../client/interfaces/RealtimeClient.md#isconnected)

***

### reconnect()

> **reconnect**(): `void`

Defined in: [lib/realtime/sse-client.ts:123](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L123)

Manually trigger reconnection

#### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`reconnect`](../../client/interfaces/RealtimeClient.md#reconnect)

***

### setPollingFallback()

> **setPollingFallback**(`enabled`): `void`

Defined in: [lib/realtime/sse-client.ts:140](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L140)

Enable/disable polling fallback

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`setPollingFallback`](../../client/interfaces/RealtimeClient.md#setpollingfallback)

***

### subscribe()

> **subscribe**\<`T`\>(`eventType`, `callback`): () => `void`

Defined in: [lib/realtime/sse-client.ts:85](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L85)

Subscribe to event type

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### eventType

`string`

##### callback

[`SubscriptionCallback`](../../client/type-aliases/SubscriptionCallback.md)\<`T`\>

#### Returns

> (): `void`

##### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`subscribe`](../../client/interfaces/RealtimeClient.md#subscribe)

***

### unsubscribe()

> **unsubscribe**(`eventType`, `callback?`): `void`

Defined in: [lib/realtime/sse-client.ts:95](https://github.com/JoeInnsp23/practice-hub/blob/dd6e6b68ea20e4a4da6a41a1d5fc2357a10ba23b/lib/realtime/sse-client.ts#L95)

Unsubscribe from event type

#### Parameters

##### eventType

`string`

##### callback?

[`SubscriptionCallback`](../../client/type-aliases/SubscriptionCallback.md)

#### Returns

`void`

#### Implementation of

[`RealtimeClient`](../../client/interfaces/RealtimeClient.md).[`unsubscribe`](../../client/interfaces/RealtimeClient.md#unsubscribe)
