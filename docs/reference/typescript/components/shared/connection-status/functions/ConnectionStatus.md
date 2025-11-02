[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [components/shared/connection-status](../README.md) / ConnectionStatus

# Function: ConnectionStatus()

> **ConnectionStatus**(`__namedParameters`): `Element`

Defined in: [components/shared/connection-status.tsx:30](https://github.com/JoeInnsp23/practice-hub/blob/21444299d8ea4ce7974beac0b6aa70c0cff46a3b/components/shared/connection-status.tsx#L30)

Connection Status Indicator

Displays the current real-time connection status with visual feedback.

States:
- Connected: Green indicator with "Live" text
- Connecting/Reconnecting: Yellow indicator with animated pulse
- Disconnected/Failed: Red indicator
- Polling: Orange indicator (fallback mode)

## Parameters

### \_\_namedParameters

`ConnectionStatusProps`

## Returns

`Element`

## Example

```typescript
const { connectionState, isPolling } = useSSE('/api/activity/stream');
<ConnectionStatus connectionState={connectionState} isPolling={isPolling} />
```
