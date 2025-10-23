"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type {
  ConnectionState,
  RealtimeEvent,
  SubscriptionCallback,
} from "@/lib/realtime/client";
import { SSEClient } from "@/lib/realtime/sse-client";

interface SSEMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
  [key: string]: unknown;
}

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  enablePollingFallback?: boolean;
  pollingInterval?: number;
}

/**
 * React hook for SSE connections
 *
 * Provides a simple interface for connecting to SSE endpoints with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat monitoring
 * - Polling fallback when SSE fails
 * - Connection state management
 *
 * @example
 * ```typescript
 * const { isConnected, connectionState, subscribe } = useSSE('/api/activity/stream', {
 *   maxReconnectAttempts: 3,
 *   enablePollingFallback: true,
 * });
 *
 * // Subscribe to activity events
 * useEffect(() => {
 *   const unsubscribe = subscribe('activity:new', (event) => {
 *     console.log('New activity:', event.data);
 *   });
 *   return unsubscribe;
 * }, [subscribe]);
 * ```
 */
export function useSSE(
  url: string = "/api/activity/stream",
  options: UseSSEOptions = {},
) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectDelay = 1000,
    maxReconnectAttempts = 3,
    enablePollingFallback = true,
    pollingInterval = 30000,
  } = options;

  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const clientRef = useRef<SSEClient | null>(null);

  // Initialize SSE client
  useEffect(() => {
    const client = new SSEClient();
    clientRef.current = client;

    // Subscribe to connection state changes
    const unsubscribeState = client.subscribe("connection:state", (event) => {
      const { state } = event.data as { state: ConnectionState };
      setConnectionState(state);
      setIsConnected(state === "connected");

      // Notify callbacks
      if (state === "connected") {
        onConnect?.();
      } else if (state === "disconnected" || state === "failed") {
        onDisconnect?.();
      }
    });

    // Subscribe to polling events
    const unsubscribePollingStarted = client.subscribe(
      "polling:started",
      () => {
        setIsPolling(true);
        toast("Real-time updates unavailable, using polling", {
          icon: "⚠️",
          duration: 5000,
        });
      },
    );

    const unsubscribePollingStopped = client.subscribe(
      "polling:stopped",
      () => {
        setIsPolling(false);
      },
    );

    // Connect to SSE endpoint
    client.connect(url, {
      reconnectDelay,
      maxReconnectAttempts,
      enablePollingFallback,
      pollingInterval,
      heartbeatTimeout: 60000,
    });

    // Cleanup on unmount
    return () => {
      unsubscribeState();
      unsubscribePollingStarted();
      unsubscribePollingStopped();
      client.disconnect();
    };
  }, [
    url,
    reconnectDelay,
    maxReconnectAttempts,
    enablePollingFallback,
    pollingInterval,
    onConnect,
    onDisconnect,
  ]);

  // Subscribe to event types
  const subscribe = useCallback(
    <T = unknown>(eventType: string, callback: SubscriptionCallback<T>) => {
      if (!clientRef.current) {
        console.warn("[useSSE] Client not initialized");
        return () => {};
      }

      return clientRef.current.subscribe(eventType, (event) => {
        // Update last message state
        setLastMessage({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });

        // Call callback
        callback(event);

        // Call legacy onMessage handler
        onMessage?.({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      });
    },
    [onMessage],
  );

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (!clientRef.current) {
      console.warn("[useSSE] Client not initialized");
      return;
    }

    clientRef.current.reconnect();
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (!clientRef.current) {
      console.warn("[useSSE] Client not initialized");
      return;
    }

    clientRef.current.disconnect();
  }, []);

  // Get connection stats
  const getStats = useCallback(() => {
    if (!clientRef.current) {
      return null;
    }

    return clientRef.current.getStats();
  }, []);

  return {
    isConnected,
    connectionState,
    isPolling,
    lastMessage,
    subscribe,
    reconnect,
    disconnect,
    getStats,
  };
}
