# User Story: Real-time Updates via SSE

**Story ID:** STORY-3.4
**Epic:** Epic 3 - Advanced Automation Features
**Feature:** FR16 (Real-time Activity Feed) + FR17 (Real-time Notifications)
**Priority:** High
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** staff member
**I want** real-time activity feed and notification updates without page refresh
**So that** I have instant visibility of team activity and immediate notification awareness

---

## Business Value

- **Collaboration:** Real-time visibility improves team coordination
- **Awareness:** Instant notification delivery eliminates refresh requirement
- **User Experience:** Modern real-time feel (vs. stale page refresh)
- **Foundation:** SSE abstraction layer enables future WebSocket migration

---

## Acceptance Criteria

### Functional Requirements - Real-time Activity Feed (FR16)

**AC1: SSE Endpoint**
- **Given** SSE infrastructure is implemented
- **When** client connects
- **Then** SSE endpoint at `/api/activity/stream` accepts connections
- **And** endpoint returns `text/event-stream` content type

**AC2: EventSource Client Integration**
- **Given** activity feed component mounts
- **When** component initializes
- **Then** EventSource connection is established to `/api/activity/stream`
- **And** event listeners are attached for activity events

**AC3: Server-Side Event Emission**
- **Given** activity log is created (after INSERT on activityLogs table)
- **When** INSERT completes
- **Then** SSE server emits event to connected clients
- **And** event payload includes: type, activity data, timestamp

**AC4: Client-Side Event Handling**
- **Given** SSE event is received
- **When** event handler processes message
- **Then** activity feed state is updated
- **And** new activity appears at top of feed without page refresh

**AC5: Reconnection Logic**
- **Given** SSE connection drops
- **When** disconnect is detected
- **Then** client attempts reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **And** reconnection continues until successful

**AC6: Heartbeat Mechanism**
- **Given** SSE connection is active
- **When** server sends heartbeat
- **Then** "ping" event is sent every 30s
- **And** client detects stale connection if no ping after 60s

**AC7: Graceful Degradation**
- **Given** SSE fails after 3 reconnection attempts
- **When** fallback logic runs
- **Then** client switches to polling mode (30s interval)
- **And** user is notified: "Real-time updates unavailable, using polling"

**AC8: Activity Badge Updates**
- **Given** new activity arrives via SSE
- **When** activity is processed
- **Then** activity badge increments (e.g., "3 new activities")
- **And** badge is clickable to view activity feed

**AC9: Connection Status Indicator**
- **Given** SSE connection state changes
- **When** state updates
- **Then** indicator shows: "Live" (green) | "Connecting..." (yellow) | "Offline" (red)
- **And** tooltip explains current state

**AC10: SSE Authentication**
- **Given** client connects to SSE endpoint
- **When** connection is established
- **Then** session token is validated
- **And** unauthorized connections are rejected

### Functional Requirements - Real-time Notifications (FR17)

**AC11: Notification Channel Multiplexing**
- **Given** SSE endpoint supports multiple channels
- **When** events are emitted
- **Then** channel is specified in event type (`activity:new`, `notification:new`)
- **And** client subscribes to both channels

**AC12: Notification Badge Real-time Updates**
- **Given** new notification arrives via SSE
- **When** notification is processed
- **Then** notification badge count increments
- **And** bell icon shows red dot indicator

**AC13: Toast Notification Display**
- **Given** high-priority notification arrives (`type: "urgent"`)
- **When** notification is received
- **Then** toast notification is displayed
- **And** toast auto-dismisses after 5 seconds

**AC14: Notification Sound**
- **Given** notification arrives and user preferences allow sound
- **When** notification is processed
- **Then** notification sound plays (optional, user setting)
- **And** sound respects browser audio permissions

**AC15: Mark as Read Optimistic UI**
- **Given** user clicks notification
- **When** mark as read mutation is called
- **Then** notification is marked read immediately (optimistic update)
- **And** if mutation fails, state reverts
- **And** SSE confirms read status update

**AC16: Notification Grouping**
- **Given** multiple similar notifications arrive
- **When** grouping logic runs
- **Then** notifications are combined (e.g., "3 tasks assigned to you")
- **And** grouped notification shows count

### Functional Requirements - Abstraction Layer

**AC17: RealtimeClient Interface**
- **Given** abstraction layer is designed
- **When** lib/realtime/client.ts is created
- **Then** RealtimeClient interface is defined with methods: connect, disconnect, subscribe, unsubscribe
- **And** interface is implementation-agnostic (SSE or WebSocket)

**AC18: SSE Implementation**
- **Given** SSE is Phase 1 real-time solution
- **When** lib/realtime/sse-client.ts is created
- **Then** SSEClient implements RealtimeClient interface
- **And** future WebSocket implementation can replace SSE without changing client code

**AC19: API Contract Stability**
- **Given** real-time events are defined
- **When** events are emitted
- **Then** event structure is: `{ type: "activity" | "notification", data: {...} }`
- **And** contract is stable across SSE/WebSocket implementations

**AC20: Migration Documentation**
- **Given** abstraction layer is implemented
- **When** docs/realtime-architecture.md is written
- **Then** documentation explains abstraction and migration path to WebSocket
- **And** code examples show how to swap implementations

### Integration Requirements

**AC21: Multi-tenant Isolation**
- **Given** multiple tenants use real-time updates
- **When** events are emitted
- **Then** SSE streams are scoped to tenantId
- **And** tenant A cannot receive tenant B's events

### Quality Requirements

**AC22: Performance**
- **Given** SSE connection is active
- **When** latency is measured
- **Then** real-time latency is <2 seconds
- **And** memory usage is stable (no memory leaks)

**AC23: Connection Uptime**
- **Given** SSE infrastructure is deployed
- **When** uptime is measured over 1 week
- **Then** connection uptime is >99.5%
- **And** reconnection success rate is >95%

---

## Technical Implementation

### SSE Server

```typescript
// app/api/activity/stream/route.ts

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const authContext = await getAuthContext();
  const stream = new ReadableStream({
    start(controller) {
      // Send heartbeat every 30s
      const heartbeat = setInterval(() => {
        controller.enqueue(`event: ping\ndata: {}\n\n`);
      }, 30000);

      // Listen for activity/notification events scoped to tenant
      const cleanup = subscribeToEvents(authContext.tenantId, (event) => {
        const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(message);
      });

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        cleanup();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### SSE Client

```typescript
// lib/realtime/sse-client.ts

export class SSEClient implements RealtimeClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;

  connect(url: string) {
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener("open", () => {
      console.log("SSE connected");
      this.reconnectAttempts = 0;
    });

    this.eventSource.addEventListener("error", () => {
      console.error("SSE error, reconnecting...");
      this.reconnect(url);
    });
  }

  subscribe(channel: string, callback: (data: any) => void) {
    this.eventSource?.addEventListener(channel, (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    });
  }

  private reconnect(url: string) {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;

    if (this.reconnectAttempts > 3) {
      // Fallback to polling
      console.warn("SSE failed, switching to polling");
      return;
    }

    setTimeout(() => this.connect(url), delay);
  }
}
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] SSE endpoint created at `/api/activity/stream`
- [ ] EventSource client integration in activity-feed.tsx
- [ ] Server-side event emission on activityLogs INSERT
- [ ] Client-side event handling with state updates
- [ ] Reconnection logic with exponential backoff
- [ ] Heartbeat mechanism (30s ping)
- [ ] Graceful degradation to polling
- [ ] Activity badge real-time updates
- [ ] Connection status indicator
- [ ] SSE authentication with session validation
- [ ] Notification channel multiplexing
- [ ] Notification badge real-time updates
- [ ] Toast notification for urgent notifications
- [ ] Notification sound (optional, user preference)
- [ ] Mark as read optimistic UI
- [ ] Notification grouping
- [ ] RealtimeClient abstraction layer
- [ ] SSE implementation of RealtimeClient
- [ ] API contract documentation
- [ ] Migration documentation (docs/realtime-architecture.md)
- [ ] Multi-tenant isolation verified
- [ ] Performance benchmarks met (<2s latency, >99.5% uptime)
- [ ] Unit/integration tests written
- [ ] Feature deployed to staging

---

## Dependencies

**Upstream:**
- Epic 2 completed for task notes (activity integration)

**Downstream:**
- Epic 6: Polish extends notification preferences

**External:**
- None (EventSource is native browser API)

---

## Testing Strategy

### Unit Tests
- Test SSE connection/disconnection
- Test reconnection logic with exponential backoff
- Test event parsing and handling

### Integration Tests
- Test SSE event emission from database events
- Test multi-tenant isolation (events scoped to tenantId)

### E2E Tests
- Test real-time activity feed updates
- Test real-time notification delivery
- Test connection recovery after network interruption

---

## Risks & Mitigation

**Risk:** SSE connection stability issues
**Mitigation:** Robust reconnection logic; graceful fallback to polling; comprehensive testing under various network conditions
**Impact:** Medium - users experience delays (fallback to 30s polling)

**Risk:** Browser compatibility (older browsers)
**Mitigation:** EventSource polyfill for older browsers; fallback to polling
**Impact:** Low - EventSource is well-supported

---

## Notes

- SSE chosen for Phase 1 simplicity vs. WebSocket
- Abstraction layer enables future migration to WebSocket without client code changes
- Multiplexed channels (activity, notifications) on single SSE connection for efficiency
- Heartbeat prevents stale connections from accumulating

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-3 - Advanced Automation Features
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR16 + FR17)
