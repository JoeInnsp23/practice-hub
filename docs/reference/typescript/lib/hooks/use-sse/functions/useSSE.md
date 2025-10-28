[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/hooks/use-sse](../README.md) / useSSE

# Function: useSSE()

> **useSSE**(`url`, `options`): `object`

Defined in: [lib/hooks/use-sse.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/e18fd5da4ebede5923d71409411ddf8b7d748253/lib/hooks/use-sse.ts#L55)

React hook for SSE connections

Provides a simple interface for connecting to SSE endpoints with:
- Automatic reconnection with exponential backoff
- Heartbeat monitoring
- Polling fallback when SSE fails
- Connection state management

## Parameters

### url

`string` = `"/api/activity/stream"`

### options

`UseSSEOptions` = `{}`

## Returns

`object`

### connectionState

> **connectionState**: [`ConnectionState`](../../../realtime/client/type-aliases/ConnectionState.md)

### disconnect()

> **disconnect**: () => `void`

#### Returns

`void`

### getStats()

> **getStats**: () => [`ConnectionStats`](../../../realtime/client/interfaces/ConnectionStats.md) \| `null`

#### Returns

[`ConnectionStats`](../../../realtime/client/interfaces/ConnectionStats.md) \| `null`

### isConnected

> **isConnected**: `boolean`

### isPolling

> **isPolling**: `boolean`

### lastMessage

> **lastMessage**: `SSEMessage` \| `null`

### reconnect()

> **reconnect**: () => `void`

#### Returns

`void`

### subscribe()

> **subscribe**: \<`T`\>(`eventType`, `callback`) => () => `void`

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### eventType

`string`

##### callback

[`SubscriptionCallback`](../../../realtime/client/type-aliases/SubscriptionCallback.md)\<`T`\>

#### Returns

> (): `void`

##### Returns

`void`

## Example

```typescript
const { isConnected, connectionState, subscribe } = useSSE('/api/activity/stream', {
  maxReconnectAttempts: 3,
  enablePollingFallback: true,
});

// Subscribe to activity events
useEffect(() => {
  const unsubscribe = subscribe('activity:new', (event) => {
    console.log('New activity:', event.data);
  });
  return unsubscribe;
}, [subscribe]);
```
