import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionState } from "./client";
import { SSEClient } from "./sse-client";

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private eventListeners = new Map<string, EventListener[]>();

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: EventListener) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)?.push(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close() {
    // Simulate close
  }

  // Test helper methods
  simulateOpen() {
    this.onopen?.(new Event("open"));
  }

  simulateMessage(type: string, data: unknown) {
    const event = new MessageEvent(type, {
      data: JSON.stringify(data),
    });
    const listeners = this.eventListeners.get(type);
    listeners?.forEach((listener) => {
      if (typeof listener === 'function') {
        listener(event);
      } else if (typeof listener === 'object' && listener !== null && 'handleEvent' in listener) {
        (listener as { handleEvent: (event: Event) => void }).handleEvent(event);
      }
    });
  }

  simulateError() {
    this.onerror?.(new Event("error"));
  }
}

// Setup global EventSource mock
global.EventSource = MockEventSource as never;

describe("SSEClient", () => {
  let client: SSEClient;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    client = new SSEClient();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    client.disconnect();
    vi.restoreAllMocks();
  });

  describe("Connection Management", () => {
    it("should connect and emit connection state event", () => {
      const stateChanges: ConnectionState[] = [];
      client.subscribe("connection:state", (event) => {
        stateChanges.push((event.data as { state: ConnectionState }).state);
      });

      client.connect("/api/activity/stream");

      // Should start as connecting
      expect(stateChanges).toContain("connecting");
      expect(client.getState()).toBe("connecting");
    });

    it("should transition to connected state on open", () => {
      client.connect("/api/activity/stream");

      // Get the mock EventSource instance
      mockEventSource = (client as any).eventSource as MockEventSource;

      const stateChanges: ConnectionState[] = [];
      client.subscribe("connection:state", (event) => {
        stateChanges.push((event.data as { state: ConnectionState }).state);
      });

      // Simulate connection open
      mockEventSource.simulateOpen();

      expect(client.getState()).toBe("connected");
      expect(client.isConnected()).toBe(true);
      expect(stateChanges).toContain("connected");
    });

    it("should handle disconnection", () => {
      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      expect(client.isConnected()).toBe(true);

      client.disconnect();

      expect(client.getState()).toBe("disconnected");
      expect(client.isConnected()).toBe(false);
    });
  });

  describe("Event Subscription", () => {
    it("should receive and process events", () => {
      const receivedEvents: unknown[] = [];

      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      const unsubscribe = client.subscribe("activity:new", (event) => {
        receivedEvents.push(event.data);
      });

      // Simulate activity event
      mockEventSource.simulateMessage("activity:new", {
        id: "activity-1",
        description: "Test activity",
      });

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual({
        id: "activity-1",
        description: "Test activity",
      });

      // Cleanup
      unsubscribe();
    });

    it("should support multiple subscriptions", () => {
      const activityEvents: unknown[] = [];
      const notificationEvents: unknown[] = [];

      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      client.subscribe("activity:new", (event) => {
        activityEvents.push(event.data);
      });

      client.subscribe("notification:new", (event) => {
        notificationEvents.push(event.data);
      });

      // Emit different event types
      mockEventSource.simulateMessage("activity:new", { id: "act-1" });
      mockEventSource.simulateMessage("notification:new", { id: "not-1" });

      expect(activityEvents).toHaveLength(1);
      expect(notificationEvents).toHaveLength(1);
    });

    it("should allow unsubscribing", () => {
      const events: unknown[] = [];

      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      const unsubscribe = client.subscribe("activity:new", (event) => {
        events.push(event.data);
      });

      mockEventSource.simulateMessage("activity:new", { id: "1" });
      expect(events).toHaveLength(1);

      // Unsubscribe
      unsubscribe();

      // Should not receive new events
      mockEventSource.simulateMessage("activity:new", { id: "2" });
      expect(events).toHaveLength(1); // Still 1
    });
  });

  describe("Reconnection Logic", () => {
    it("should attempt reconnection on error", () => {
      const consoleLogSpy = vi.spyOn(console, "log");

      client.connect("/api/activity/stream", {
        maxReconnectAttempts: 3,
        reconnectDelay: 1000,
      });

      mockEventSource = (client as any).eventSource as MockEventSource;

      // Simulate error
      mockEventSource.simulateError();

      expect(client.getState()).toBe("reconnecting");

      // Fast-forward to reconnect
      vi.advanceTimersByTime(1000);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Reconnecting"),
      );
    });

    it("should use exponential backoff for reconnection", () => {
      client.connect("/api/activity/stream", {
        maxReconnectAttempts: 3,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
      });

      mockEventSource = (client as any).eventSource as MockEventSource;

      // First error - 1s delay
      mockEventSource.simulateError();
      expect(client.getState()).toBe("reconnecting");

      // Second error - 2s delay
      vi.advanceTimersByTime(1000);
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();

      // Third error - 4s delay
      vi.advanceTimersByTime(2000);
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();

      expect(client.getStats().reconnectAttempts).toBe(3);
    });

    it("should fail after max reconnection attempts", () => {
      const pollingEvents: unknown[] = [];

      client.connect("/api/activity/stream", {
        maxReconnectAttempts: 3,
        reconnectDelay: 1000,
        enablePollingFallback: true,
      });

      client.subscribe("polling:started", (event) => {
        pollingEvents.push(event.data);
      });

      mockEventSource = (client as any).eventSource as MockEventSource;

      // Fail 4 times (initial + 3 reconnect attempts)
      for (let i = 0; i < 4; i++) {
        mockEventSource.simulateError();
        vi.advanceTimersByTime(1000 * 2 ** i);
        mockEventSource = (client as any).eventSource as MockEventSource;
      }

      expect(client.getState()).toBe("failed");
      expect(pollingEvents).toHaveLength(1); // Polling started
    });
  });

  describe("Heartbeat Monitoring", () => {
    it("should detect stale connections", () => {
      client.connect("/api/activity/stream", {
        heartbeatTimeout: 60000,
      });

      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      const stats = client.getStats();
      const _connectedTime = stats.lastConnected;

      // No heartbeat for 61 seconds
      vi.advanceTimersByTime(61000);

      // Should trigger reconnection
      expect(client.getState()).not.toBe("connected");
    });

    it("should reset heartbeat timer on ping", () => {
      client.connect("/api/activity/stream", {
        heartbeatTimeout: 60000,
      });

      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      // Advance 30s
      vi.advanceTimersByTime(30000);

      // Simulate ping
      mockEventSource.simulateMessage("ping", {});

      // Advance another 30s (total 60s, but heartbeat was reset)
      vi.advanceTimersByTime(30000);

      // Should still be connected
      expect(client.isConnected()).toBe(true);
    });
  });

  describe("Polling Fallback", () => {
    it("should start polling after max reconnection attempts", () => {
      const pollingEvents: unknown[] = [];

      client.connect("/api/activity/stream", {
        maxReconnectAttempts: 2,
        enablePollingFallback: true,
        pollingInterval: 30000,
      });

      client.subscribe("polling:started", (event) => {
        pollingEvents.push(event.data);
      });

      mockEventSource = (client as any).eventSource as MockEventSource;

      // Fail 3 times (initial + 2 reconnect attempts)
      mockEventSource.simulateError();
      vi.advanceTimersByTime(1000);
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();
      vi.advanceTimersByTime(2000);
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();
      vi.advanceTimersByTime(4000);

      expect(pollingEvents).toHaveLength(1);
      expect(client.getStats().isPolling).toBe(true);
    });

    it("should disable polling when explicitly set", () => {
      client.connect("/api/activity/stream", {
        maxReconnectAttempts: 1,
        enablePollingFallback: true,
      });

      mockEventSource = (client as any).eventSource as MockEventSource;
      // Fail 2 times (initial + 1 reconnect attempt)
      mockEventSource.simulateError();
      vi.advanceTimersByTime(1000);
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateError();
      vi.advanceTimersByTime(2000);

      expect(client.getStats().isPolling).toBe(true);

      // Disable polling
      client.setPollingFallback(false);

      expect(client.getStats().isPolling).toBe(false);
    });
  });

  describe("Connection Stats", () => {
    it("should track connection statistics", () => {
      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;
      mockEventSource.simulateOpen();

      const stats = client.getStats();

      expect(stats).toMatchObject({
        state: "connected",
        reconnectAttempts: 0,
        isPolling: false,
      });
      expect(stats.lastConnected).toBeDefined();
    });

    it("should update reconnect attempts", () => {
      client.connect("/api/activity/stream");
      mockEventSource = (client as any).eventSource as MockEventSource;

      mockEventSource.simulateError();
      vi.advanceTimersByTime(1000);

      const stats = client.getStats();
      expect(stats.reconnectAttempts).toBe(1);
    });
  });
});
