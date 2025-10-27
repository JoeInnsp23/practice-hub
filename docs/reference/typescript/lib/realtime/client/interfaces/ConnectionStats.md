[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/client](../README.md) / ConnectionStats

# Interface: ConnectionStats

Defined in: [lib/realtime/client.ts:75](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L75)

Connection statistics

## Properties

### isPolling

> **isPolling**: `boolean`

Defined in: [lib/realtime/client.ts:87](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L87)

Is using polling fallback

***

### lastConnected?

> `optional` **lastConnected**: `number`

Defined in: [lib/realtime/client.ts:81](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L81)

Last successful connection timestamp

***

### lastDisconnected?

> `optional` **lastDisconnected**: `number`

Defined in: [lib/realtime/client.ts:83](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L83)

Last disconnection timestamp

***

### lastHeartbeat?

> `optional` **lastHeartbeat**: `number`

Defined in: [lib/realtime/client.ts:85](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L85)

Last heartbeat received timestamp

***

### reconnectAttempts

> **reconnectAttempts**: `number`

Defined in: [lib/realtime/client.ts:79](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L79)

Number of reconnection attempts

***

### state

> **state**: [`ConnectionState`](../type-aliases/ConnectionState.md)

Defined in: [lib/realtime/client.ts:77](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/lib/realtime/client.ts#L77)

Current connection state
