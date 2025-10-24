import type {
  ConnectionOptions,
  ConnectionState,
  ConnectionStats,
  RealtimeClient,
  RealtimeEvent,
  SubscriptionCallback,
} from "./client";
import { EventSubscriptionManager } from "./client";

/**
 * SSE Client Implementation
 *
 * Server-Sent Events (SSE) implementation of the RealtimeClient interface.
 * Provides robust reconnection logic, heartbeat detection, and polling fallback.
 *
 * Features:
 * - Exponential backoff reconnection
 * - Heartbeat monitoring (detects stale connections)
 * - Automatic polling fallback when SSE fails
 * - Multi-channel event support
 * - Tenant-scoped event streams
 *
 * @example
 * ```typescript
 * const client = new SSEClient();
 * client.connect('/api/activity/stream', {
 *   maxReconnectAttempts: 3,
 *   heartbeatTimeout: 60000,
 * });
 *
 * // Subscribe to activity events
 * const unsubscribe = client.subscribe('activity:new', (event) => {
 *   console.log('New activity:', event.data);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * client.disconnect();
 * ```
 */
export class SSEClient implements RealtimeClient {
  private eventSource: EventSource | null = null;
  private subscriptionManager = new EventSubscriptionManager();
  private state: ConnectionState = "disconnected";
  private reconnectAttempts = 0;
  private options: ConnectionOptions = {
    maxReconnectAttempts: 3,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    heartbeatTimeout: 60000,
    enablePollingFallback: true,
    pollingInterval: 30000,
  };
  private url = "";
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatTimeoutId: NodeJS.Timeout | null = null;
  private pollingIntervalId: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastConnected?: number;
  private lastDisconnected?: number;
  private lastHeartbeat?: number;

  /**
   * Connect to SSE endpoint
   */
  connect(url: string, options?: ConnectionOptions): void {
    this.url = url;
    this.options = { ...this.options, ...options };
    this.setState("connecting");
    this.attemptConnection();
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    this.cleanup();
    this.setState("disconnected");
  }

  /**
   * Subscribe to event type
   */
  subscribe<T = unknown>(
    eventType: string,
    callback: SubscriptionCallback<T>,
  ): () => void {
    return this.subscriptionManager.subscribe(eventType, callback);
  }

  /**
   * Unsubscribe from event type
   */
  unsubscribe(eventType: string, callback?: SubscriptionCallback): void {
    this.subscriptionManager.unsubscribe(eventType, callback);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
      lastConnected: this.lastConnected,
      lastDisconnected: this.lastDisconnected,
      lastHeartbeat: this.lastHeartbeat,
      isPolling: this.isPolling,
    };
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    this.cleanup();
    this.reconnectAttempts = 0;
    this.setState("reconnecting");
    this.attemptConnection();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state === "connected";
  }

  /**
   * Enable/disable polling fallback
   */
  setPollingFallback(enabled: boolean): void {
    this.options.enablePollingFallback = enabled;
    if (!enabled && this.isPolling) {
      this.stopPolling();
    }
  }

  /**
   * Attempt SSE connection
   */
  private attemptConnection(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource(this.url);

      // Connection opened
      this.eventSource.onopen = () => {
        console.log("[SSE] Connected");
        this.setState("connected");
        this.reconnectAttempts = 0;
        this.lastConnected = Date.now();
        this.startHeartbeatMonitor();
      };

      // Generic message handler
      this.eventSource.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Error handler
      this.eventSource.onerror = () => {
        console.error("[SSE] Connection error");
        this.handleError();
      };

      // Listen for ping (heartbeat)
      this.eventSource.addEventListener("ping", () => {
        this.handleHeartbeat();
      });

      // Listen for activity events
      this.eventSource.addEventListener("activity:new", (event) => {
        this.handleMessage(event);
      });

      // Listen for notification events
      this.eventSource.addEventListener("notification:new", (event) => {
        this.handleMessage(event);
      });
    } catch (error) {
      console.error("[SSE] Failed to create EventSource:", error);
      this.handleError();
    }
  }

  /**
   * Handle incoming SSE message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const realtimeEvent: RealtimeEvent = {
        type: event.type || "message",
        data,
        timestamp: Date.now(),
        id: data.id,
      };

      this.subscriptionManager.emit(realtimeEvent);
    } catch (error) {
      console.error("[SSE] Failed to parse message:", error);
    }
  }

  /**
   * Handle heartbeat (ping) event
   */
  private handleHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.resetHeartbeatMonitor();
  }

  /**
   * Start heartbeat monitor
   */
  private startHeartbeatMonitor(): void {
    this.resetHeartbeatMonitor();
  }

  /**
   * Reset heartbeat monitor timer
   */
  private resetHeartbeatMonitor(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
    }

    this.heartbeatTimeoutId = setTimeout(() => {
      console.warn("[SSE] No heartbeat received, connection may be stale");
      // Treat as connection error
      this.handleError();
    }, this.options.heartbeatTimeout);
  }

  /**
   * Handle connection error
   */
  private handleError(): void {
    this.lastDisconnected = Date.now();
    this.cleanup();

    // Check if we should attempt reconnection
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setState("reconnecting");

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = Math.min(
        this.options.reconnectDelay * 2 ** (this.reconnectAttempts - 1),
        this.options.maxReconnectDelay,
      );

      console.log(
        `[SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`,
      );

      this.reconnectTimeoutId = setTimeout(() => {
        this.attemptConnection();
      }, delay);
    } else {
      // Max reconnection attempts reached
      this.setState("failed");
      console.error("[SSE] Max reconnection attempts reached");

      // Fallback to polling if enabled
      if (this.options.enablePollingFallback) {
        console.log("[SSE] Falling back to polling mode");
        this.startPolling();
      }
    }
  }

  /**
   * Start polling fallback
   */
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    console.log(
      `[SSE] Starting polling (interval: ${this.options.pollingInterval}ms)`,
    );

    // Emit polling started event
    this.subscriptionManager.emit({
      type: "polling:started",
      data: { interval: this.options.pollingInterval },
      timestamp: Date.now(),
    });

    this.pollingIntervalId = setInterval(() => {
      this.poll();
    }, this.options.pollingInterval);

    // Initial poll
    this.poll();
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (!this.isPolling) return;

    this.isPolling = false;
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }

    console.log("[SSE] Polling stopped");

    // Emit polling stopped event
    this.subscriptionManager.emit({
      type: "polling:stopped",
      data: {},
      timestamp: Date.now(),
    });
  }

  /**
   * Poll for updates (fallback mechanism)
   */
  private async poll(): Promise<void> {
    try {
      // Construct polling URL (append ?poll=1 to differentiate)
      const pollUrl = `${this.url}${this.url.includes("?") ? "&" : "?"}poll=1`;

      const response = await fetch(pollUrl, {
        credentials: "include",
        headers: this.options.authToken
          ? { Authorization: `Bearer ${this.options.authToken}` }
          : {},
      });

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`);
      }

      const events = await response.json();

      // Process polled events
      if (Array.isArray(events)) {
        events.forEach((event) => {
          this.subscriptionManager.emit(event);
        });
      }
    } catch (error) {
      console.error("[SSE] Polling error:", error);
    }
  }

  /**
   * Set connection state
   */
  private setState(state: ConnectionState): void {
    if (this.state === state) return;

    this.state = state;
    console.log(`[SSE] State changed: ${state}`);

    // Emit state change event
    this.subscriptionManager.emit({
      type: "connection:state",
      data: { state },
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }

    this.stopPolling();
  }
}
