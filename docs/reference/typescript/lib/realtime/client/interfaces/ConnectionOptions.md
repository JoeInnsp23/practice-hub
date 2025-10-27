[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/client](../README.md) / ConnectionOptions

# Interface: ConnectionOptions

Defined in: [lib/realtime/client.ts:55](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L55)

Connection options

## Properties

### authToken?

> `optional` **authToken**: `string`

Defined in: [lib/realtime/client.ts:69](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L69)

Authentication token

***

### enablePollingFallback?

> `optional` **enablePollingFallback**: `boolean`

Defined in: [lib/realtime/client.ts:65](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L65)

Enable polling fallback (default: true)

***

### heartbeatTimeout?

> `optional` **heartbeatTimeout**: `number`

Defined in: [lib/realtime/client.ts:63](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L63)

Heartbeat timeout in ms (default: 60000)

***

### maxReconnectAttempts?

> `optional` **maxReconnectAttempts**: `number`

Defined in: [lib/realtime/client.ts:57](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L57)

Maximum reconnection attempts before fallback (default: 3)

***

### maxReconnectDelay?

> `optional` **maxReconnectDelay**: `number`

Defined in: [lib/realtime/client.ts:61](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L61)

Maximum reconnection delay in ms (default: 30000)

***

### pollingInterval?

> `optional` **pollingInterval**: `number`

Defined in: [lib/realtime/client.ts:67](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L67)

Polling interval in ms (default: 30000)

***

### reconnectDelay?

> `optional` **reconnectDelay**: `number`

Defined in: [lib/realtime/client.ts:59](https://github.com/JoeInnsp23/practice-hub/blob/39fb7d4e8ea4e955ee58ecabc3e83886681b9eab/lib/realtime/client.ts#L59)

Base reconnection delay in ms (default: 1000)
