# Real-time Architecture - SSE Implementation

**Version**: 1.0
**Status**: Phase 1 (SSE) - Production Ready
**Last Updated**: 2025-10-23
**Related Story**: STORY-3.4 (Real-time Updates via SSE)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Current Implementation (Phase 1: SSE)](#current-implementation-phase-1-sse)
4. [Components](#components)
5. [Usage Examples](#usage-examples)
6. [Future Migration (Phase 2: WebSocket)](#future-migration-phase-2-websocket)
7. [Deployment Considerations](#deployment-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Practice Hub implements real-time updates using **Server-Sent Events (SSE)** as the primary communication mechanism. The architecture is designed with an abstraction layer that allows seamless migration to WebSocket in the future without changing client code.

### Why SSE for Phase 1?

- **Simplicity**: Native browser API (EventSource), no additional libraries
- **HTTP-friendly**: Works over standard HTTP/HTTPS, no special server configuration
- **Firewall-friendly**: Less likely to be blocked compared to WebSocket
- **Auto-reconnection**: Browser handles reconnection automatically
- **Text-based**: Easy to debug and monitor

### Design Principles

1. **Abstraction**: Implementation-agnostic client interface
2. **Resilience**: Robust reconnection logic with exponential backoff
3. **Fallback**: Automatic polling when SSE fails
4. **Multi-tenancy**: Event streams scoped to tenantId
5. **Performance**: Heartbeat monitoring to detect stale connections

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│                                                              │
│  ┌────────────────┐     ┌──────────────────┐               │
│  │ ActivityFeed   │     │ Notifications    │               │
│  │ Component      │     │ Component        │               │
│  └───────┬────────┘     └────────┬─────────┘               │
│          │                        │                          │
│          └────────┬───────────────┘                          │
│                   ▼                                          │
│          ┌────────────────┐                                 │
│          │ useSSE Hook    │                                 │
│          └────────┬───────┘                                 │
│                   ▼                                          │
│          ┌────────────────┐                                 │
│          │  SSEClient     │                                 │
│          │ (implements    │                                 │
│          │ RealtimeClient)│                                 │
│          └────────┬───────┘                                 │
│                   │                                          │
│                   │ EventSource                              │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    │ HTTP/2 (text/event-stream)
                    │
┌───────────────────▼──────────────────────────────────────────┐
│                    Next.js Server                            │
│                                                              │
│  ┌────────────────────────────────────┐                     │
│  │ /api/activity/stream Route         │                     │
│  │ (SSE Endpoint)                     │                     │
│  └───────────┬────────────────────────┘                     │
│              │                                               │
│              ├─ Authentication Check                         │
│              ├─ Multi-tenant Isolation                       │
│              ├─ Heartbeat (30s interval)                     │
│              │                                               │
│              ▼                                               │
│  ┌────────────────────────────────────┐                     │
│  │ ServerEventEmitter                 │                     │
│  │ (In-memory pub/sub)                │                     │
│  └───────────┬────────────────────────┘                     │
│              ▲                                               │
│              │                                               │
│  ┌───────────┴────────────────────────┐                     │
│  │ tRPC Routers / API Routes          │                     │
│  │ (Emit events on database changes)  │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Current Implementation (Phase 1: SSE)

### Core Components

#### 1. Abstraction Layer (`lib/realtime/client.ts`)

Defines the `RealtimeClient` interface that both SSE and future WebSocket implementations must conform to:

```typescript
export interface RealtimeClient {
  connect(url: string, options?: ConnectionOptions): void;
  disconnect(): void;
  subscribe<T>(eventType: string, callback: SubscriptionCallback<T>): () => void;
  unsubscribe(eventType: string, callback?: SubscriptionCallback): void;
  getState(): ConnectionState;
  getStats(): ConnectionStats;
  reconnect(): void;
  isConnected(): boolean;
  setPollingFallback(enabled: boolean): void;
}
```

**Benefits**:
- Swap SSE for WebSocket without changing consumer code
- Consistent API across different real-time implementations
- Type-safe event handling

#### 2. SSE Client (`lib/realtime/sse-client.ts`)

Implements `RealtimeClient` with SSE-specific logic:

**Features**:
- ✅ Exponential backoff reconnection (1s, 2s, 4s, 8s... up to 30s)
- ✅ Heartbeat monitoring (detects stale connections after 60s)
- ✅ Automatic polling fallback after 3 failed reconnection attempts
- ✅ Event multiplexing (multiple channels on single connection)
- ✅ Connection state tracking

**State Machine**:
```
disconnected ──connect()──> connecting ──onopen──> connected
                                │                      │
                                │                      │ onerror
                                │                      ▼
                                └──────────────> reconnecting
                                                       │
                                           attempts < 3│
                                                       ▼
                                                   connected
                                                       │
                                           attempts ≥ 3│
                                                       ▼
                                                    failed
                                                       │
                                        fallback enabled│
                                                       ▼
                                                   polling
```

#### 3. Server Event Emitter (`lib/realtime/event-emitter.ts`)

In-memory pub/sub system for server-side event emission:

```typescript
export class ServerEventEmitter {
  subscribe(tenantId: string, callback: EventCallback): () => void;
  emit(tenantId: string, event: RealtimeEvent): void;
  getSubscriberCount(tenantId: string): number;
}
```

**Multi-tenant Isolation**:
- Events are scoped to `tenantId`
- Tenant A cannot receive Tenant B's events
- Each SSE connection subscribes only to their tenant's channel

**Production Note**: For multi-server deployments, replace with Redis Pub/Sub:

```typescript
// Replace in-memory emitter with Redis
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const serverEventEmitter = {
  subscribe: (tenantId: string, callback: EventCallback) => {
    redis.subscribe(`tenant:${tenantId}`, (message) => {
      callback(JSON.parse(message));
    });
  },
  emit: (tenantId: string, event: RealtimeEvent) => {
    redis.publish(`tenant:${tenantId}`, JSON.stringify(event));
  },
};
```

#### 4. SSE Endpoint (`app/api/activity/stream/route.ts`)

Next.js API route serving SSE stream:

**Features**:
- Session-based authentication
- Multi-tenant scoping
- Heartbeat (30s ping)
- Graceful connection cleanup

**Security**:
- Validates Better Auth session
- Filters events by authenticated user's tenantId
- Rejects unauthorized connections (401)

#### 5. React Hook (`lib/hooks/use-sse.ts`)

React integration for SSE connections:

```typescript
const { isConnected, connectionState, subscribe, getStats } = useSSE('/api/activity/stream', {
  maxReconnectAttempts: 3,
  enablePollingFallback: true,
});

// Subscribe to events
useEffect(() => {
  const unsubscribe = subscribe('activity:new', (event) => {
    console.log('New activity:', event.data);
  });
  return unsubscribe;
}, [subscribe]);
```

---

## Components

### ActivityFeed Component

Real-time activity updates with SSE integration:

```typescript
import { ActivityFeed } from '@/components/client-hub/dashboard/activity-feed';

<ActivityFeed
  activities={initialActivities}
  enableRealtime={true} // Enable SSE updates
/>
```

**Features**:
- Real-time activity prepending
- "N new" badge (auto-reset after 3s)
- Connection status indicator
- Keeps last 50 activities

### RealtimeNotifications Component

Real-time notification system:

```typescript
import { RealtimeNotifications } from '@/components/realtime-notifications';

<RealtimeNotifications />
```

**Features**:
- ✅ Real-time notification delivery
- ✅ Notification grouping (similar notifications combined)
- ✅ Urgent toast notifications (for `type: "urgent"`)
- ✅ Optional notification sound
- ✅ Sound preference toggle
- ✅ Connection status indicator
- ✅ Badge count (unread notifications)

### ConnectionStatus Component

Visual connection state indicator:

```typescript
import { ConnectionStatus } from '@/components/shared/connection-status';

<ConnectionStatus
  connectionState={connectionState}
  isPolling={isPolling}
/>
```

**States**:
- 🟢 **Live** (connected)
- 🟡 **Connecting/Reconnecting** (with pulse animation)
- 🔴 **Disconnected/Failed**
- 🟠 **Polling** (fallback mode)

---

## Usage Examples

### Example 1: Emitting Activity Events

```typescript
// In tRPC router or API route
import { serverEventEmitter } from '@/lib/realtime/event-emitter';

export const clientsRouter = router({
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const [newClient] = await db
        .insert(clients)
        .values({ ...input, tenantId: ctx.authContext.tenantId })
        .returning();

      // Emit real-time activity event
      serverEventEmitter.emit(ctx.authContext.tenantId, {
        type: 'activity:new',
        data: {
          id: crypto.randomUUID(),
          entityType: 'client',
          entityId: newClient.id,
          action: 'created',
          description: `Client "${newClient.name}" was created`,
          userName: `${ctx.authContext.firstName} ${ctx.authContext.lastName}`,
          createdAt: new Date().toISOString(),
        },
      });

      return { client: newClient };
    }),
});
```

### Example 2: Emitting Notification Events

```typescript
// Emit urgent notification
serverEventEmitter.emit(tenantId, {
  type: 'notification:new',
  data: {
    id: crypto.randomUUID(),
    type: 'urgent',
    title: 'Compliance Deadline',
    message: 'VAT return due in 24 hours for ABC Ltd',
    actionUrl: '/client-hub/compliance',
  },
});

// Emit grouped notification
serverEventEmitter.emit(tenantId, {
  type: 'notification:new',
  data: {
    id: crypto.randomUUID(),
    type: 'info',
    title: 'Tasks Assigned',
    message: 'New task assigned to you',
    groupKey: 'task_assigned', // Group similar notifications
  },
});
```

### Example 3: Custom Component Integration

```typescript
'use client';

import { useEffect } from 'react';
import { useSSE } from '@/lib/hooks/use-sse';

export function CustomRealtimeComponent() {
  const { subscribe, connectionState } = useSSE('/api/activity/stream');

  useEffect(() => {
    const unsubscribe = subscribe('custom:event', (event) => {
      console.log('Custom event received:', event.data);
    });

    return unsubscribe;
  }, [subscribe]);

  return <div>Connection: {connectionState}</div>;
}
```

---

## Future Migration (Phase 2: WebSocket)

The abstraction layer enables seamless migration to WebSocket without changing consumer code.

### Migration Steps

#### Step 1: Implement WebSocketClient

```typescript
// lib/realtime/websocket-client.ts
import type { RealtimeClient } from './client';

export class WebSocketClient implements RealtimeClient {
  private ws: WebSocket | null = null;

  connect(url: string, options?: ConnectionOptions): void {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.setState('connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.subscriptionManager.emit(data);
    };

    this.ws.onerror = () => {
      this.handleError();
    };
  }

  // ... implement other RealtimeClient methods
}
```

#### Step 2: Update Hook to Use WebSocket

```typescript
// lib/hooks/use-sse.ts → lib/hooks/use-realtime.ts
import { WebSocketClient } from '@/lib/realtime/websocket-client';

export function useRealtime(url: string, options?: UseRealtimeOptions) {
  // Change from SSEClient to WebSocketClient
  const client = new WebSocketClient();
  // ... rest remains the same
}
```

#### Step 3: Update Consumers (No Changes Required!)

```typescript
// Components work exactly the same
const { subscribe } = useRealtime('/ws/realtime'); // WebSocket URL
// All existing subscribe() calls work unchanged
```

### When to Migrate to WebSocket?

Consider WebSocket when:
- ✅ Bi-directional communication needed (client → server messages)
- ✅ Binary data transmission required
- ✅ Lower latency critical (<100ms)
- ✅ High message frequency (>10 messages/second)
- ✅ Server push AND client requests needed

**Current SSE is sufficient for**:
- ✅ Server → Client only updates
- ✅ Text-based events
- ✅ Moderate frequency (<5 messages/second)
- ✅ HTTP/2 infrastructure

---

## Deployment Considerations

### Single Server Deployment (Current)

**Works out of the box** with in-memory `ServerEventEmitter`.

### Multi-Server Deployment (Production)

For horizontal scaling, replace in-memory event emitter with **Redis Pub/Sub**:

```typescript
// lib/realtime/event-emitter.ts (production)
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const serverEventEmitter = {
  subscribe: (tenantId: string, callback: EventCallback) => {
    const channelName = `tenant:${tenantId}`;
    redis.subscribe(channelName, (message: string) => {
      const event = JSON.parse(message);
      callback(event);
    });
  },
  emit: (tenantId: string, event: RealtimeEvent) => {
    const channelName = `tenant:${tenantId}`;
    redis.publish(channelName, JSON.stringify(event));
  },
};
```

**Environment Variables**:
```bash
UPSTASH_REDIS_REST_URL="<redis-url>"
UPSTASH_REDIS_REST_TOKEN="<redis-token>"
```

### Nginx Configuration

If using Nginx reverse proxy, disable buffering for SSE:

```nginx
location /api/activity/stream {
    proxy_pass http://nextjs_backend;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding off;
    proxy_buffering off;
    proxy_cache off;
}
```

### Cloudflare Configuration

SSE requires specific Cloudflare settings:

- Enable HTTP/2
- Disable "Always Use HTTPS" redirects for SSE endpoint
- Set "Browser Cache TTL" to "Respect Existing Headers"

---

## Troubleshooting

### Issue: SSE connection drops frequently

**Symptoms**: Constant reconnection attempts

**Solutions**:
1. Check reverse proxy buffering settings
2. Verify heartbeat is being sent (every 30s)
3. Increase `heartbeatTimeout` if network is slow
4. Check browser console for specific errors

### Issue: Events not received

**Symptoms**: No real-time updates appearing

**Debugging**:
```typescript
// Check connection state
const { getStats } = useSSE('/api/activity/stream');
console.log(getStats());

// Verify events are being emitted
serverEventEmitter.emit(tenantId, {
  type: 'test:event',
  data: { message: 'Test event' },
});
```

**Common Causes**:
- Multi-tenant isolation filtering events
- Event type mismatch (check event.type)
- SSE endpoint authentication failing

### Issue: Polling fallback activating unnecessarily

**Symptoms**: "Real-time updates unavailable, using polling" message

**Solutions**:
1. Increase `maxReconnectAttempts` (default: 3)
2. Check server logs for connection errors
3. Verify SSE endpoint is accessible
4. Disable ad blockers (may block EventSource)

### Issue: Memory leak with subscriptions

**Symptoms**: Increasing memory usage over time

**Solutions**:
- Ensure `unsubscribe()` is called in cleanup
- Check for circular references in callbacks
- Use React's useEffect cleanup:

```typescript
useEffect(() => {
  const unsubscribe = subscribe('event:type', callback);
  return unsubscribe; // CRITICAL: Return cleanup function
}, [subscribe]);
```

---

## Performance Metrics

### Current Benchmarks

- **Connection Latency**: <1s (initial connection)
- **Event Latency**: <500ms (server emit → client receive)
- **Heartbeat Interval**: 30s
- **Reconnection Delay**: 1s, 2s, 4s, 8s (exponential backoff)
- **Max Reconnect Attempts**: 3
- **Polling Interval** (fallback): 30s

### Monitoring

Monitor these metrics in production:

```typescript
// Get connection statistics
const stats = client.getStats();

console.log({
  state: stats.state,
  reconnectAttempts: stats.reconnectAttempts,
  lastConnected: stats.lastConnected,
  lastHeartbeat: stats.lastHeartbeat,
  isPolling: stats.isPolling,
});
```

---

## Summary

✅ **Phase 1 (SSE)**: Production-ready with robust reconnection and polling fallback
🔄 **Phase 2 (WebSocket)**: Future migration path via abstraction layer
🔒 **Multi-tenant**: Events scoped to tenantId for data isolation
📈 **Scalable**: Redis Pub/Sub for multi-server deployments

**Next Steps**:
1. Deploy to staging with Redis Pub/Sub
2. Monitor connection uptime and event latency
3. Gather user feedback on real-time experience
4. Evaluate WebSocket migration based on usage patterns
