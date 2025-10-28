/**
 * Realtime Client Interface
 *
 * Abstraction layer for real-time communication that supports both SSE and WebSocket implementations.
 * This allows seamless migration between different real-time technologies without changing client code.
 *
 * @example
 * ```typescript
 * // SSE Implementation (Phase 1)
 * const client = new SSEClient();
 * client.connect('/api/activity/stream');
 * client.subscribe('activity:new', (data) => console.log(data));
 *
 * // Future WebSocket Implementation (Phase 2)
 * const client = new WebSocketClient();
 * client.connect('wss://api.example.com/realtime');
 * client.subscribe('activity:new', (data) => console.log(data));
 * ```
 */

/**
 * Connection state for realtime client
 */
export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "failed";

/**
 * Realtime event structure
 */
export interface RealtimeEvent<T = unknown> {
  /** Event type (e.g., 'activity:new', 'notification:new', 'ping') */
  type: string;
  /** Event payload */
  data: T;
  /** Event timestamp */
  timestamp?: number;
  /** Event ID (for deduplication) */
  id?: string;
}

/**
 * Subscription callback
 */
export type SubscriptionCallback<T = unknown> = (
  event: RealtimeEvent<T>,
) => void;

/**
 * Connection options
 */
export interface ConnectionOptions {
  /** Maximum reconnection attempts before fallback (default: 3) */
  maxReconnectAttempts?: number;
  /** Base reconnection delay in ms (default: 1000) */
  reconnectDelay?: number;
  /** Maximum reconnection delay in ms (default: 30000) */
  maxReconnectDelay?: number;
  /** Heartbeat timeout in ms (default: 60000) */
  heartbeatTimeout?: number;
  /** Enable polling fallback (default: true) */
  enablePollingFallback?: boolean;
  /** Polling interval in ms (default: 30000) */
  pollingInterval?: number;
  /** Authentication token */
  authToken?: string;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  /** Current connection state */
  state: ConnectionState;
  /** Number of reconnection attempts */
  reconnectAttempts: number;
  /** Last successful connection timestamp */
  lastConnected?: number;
  /** Last disconnection timestamp */
  lastDisconnected?: number;
  /** Last heartbeat received timestamp */
  lastHeartbeat?: number;
  /** Is using polling fallback */
  isPolling: boolean;
}

/**
 * Abstract Realtime Client Interface
 *
 * Defines the contract for real-time communication implementations.
 * Both SSE and WebSocket implementations must conform to this interface.
 */
export interface RealtimeClient {
  /**
   * Establish connection to realtime server
   * @param url - Connection URL
   * @param options - Connection options
   */
  connect(url: string, options?: ConnectionOptions): void;

  /**
   * Disconnect from realtime server
   */
  disconnect(): void;

  /**
   * Subscribe to a specific event type
   * @param eventType - Event type to subscribe to (e.g., 'activity:new')
   * @param callback - Callback function to handle events
   * @returns Unsubscribe function
   */
  subscribe<T = unknown>(
    eventType: string,
    callback: SubscriptionCallback<T>,
  ): () => void;

  /**
   * Unsubscribe from a specific event type
   * @param eventType - Event type to unsubscribe from
   * @param callback - Callback function to remove (optional, removes all if not provided)
   */
  unsubscribe(eventType: string, callback?: SubscriptionCallback): void;

  /**
   * Get current connection state
   * @returns Current connection state
   */
  getState(): ConnectionState;

  /**
   * Get connection statistics
   * @returns Connection statistics
   */
  getStats(): ConnectionStats;

  /**
   * Manually trigger reconnection
   */
  reconnect(): void;

  /**
   * Check if client is connected
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean;

  /**
   * Enable/disable polling fallback
   * @param enabled - Enable or disable polling
   */
  setPollingFallback(enabled: boolean): void;
}

/**
 * Event emitter for managing subscriptions
 */
export class EventSubscriptionManager {
  private subscriptions = new Map<string, Set<SubscriptionCallback>>();

  /**
   * Add subscription
   */
  subscribe<T = unknown>(
    eventType: string,
    callback: SubscriptionCallback<T>,
  ): () => void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
    }

    this.subscriptions
      .get(eventType)
      ?.add(callback as SubscriptionCallback<unknown>);

    // Return unsubscribe function
    return () =>
      this.unsubscribe(eventType, callback as SubscriptionCallback<unknown>);
  }

  /**
   * Remove subscription
   */
  unsubscribe(eventType: string, callback?: SubscriptionCallback): void {
    if (!callback) {
      // Remove all subscriptions for this event type
      this.subscriptions.delete(eventType);
      return;
    }

    const callbacks = this.subscriptions.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscriptions.delete(eventType);
      }
    }
  }

  /**
   * Emit event to all subscribers
   */
  emit<T = unknown>(event: RealtimeEvent<T>): void {
    const callbacks = this.subscriptions.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event callback for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
  }

  /**
   * Get subscription count for an event type
   */
  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.size || 0;
  }

  /**
   * Get all active event types
   */
  getActiveEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}
