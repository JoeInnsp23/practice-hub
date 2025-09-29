"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface SSEMessage {
  type: string;
  data?: any;
  timestamp?: number;
  [key: string]: any;
}

interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export function useSSE(url: string = "/api/sse", options: UseSSEOptions = {}) {
  const {
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectDelay = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connected");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as SSEMessage;
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case "connected":
              console.log("SSE connection established:", message.connectionId);
              break;

            case "heartbeat":
              // Heartbeat to keep connection alive
              break;

            case "notification":
              // Show toast for notifications
              if (message.data?.message) {
                const notificationType = message.data.level || "info";
                switch (notificationType) {
                  case "success":
                    toast.success(message.data.message);
                    break;
                  case "error":
                    toast.error(message.data.message);
                    break;
                  default:
                    toast(message.data.message);
                }
              }
              break;

            default:
              // Pass to custom handler
              onMessage?.(message);
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;
        onDisconnect?.();
        onError?.(new Error("SSE connection failed"));

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `Reconnecting SSE (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else {
          toast.error(
            "Real-time updates disconnected. Please refresh the page.",
          );
        }
      };
    } catch (error) {
      console.error("Failed to create SSE connection:", error);
      onError?.(error as Error);
    }
  }, [
    url,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnectDelay,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      onDisconnect?.();
    }
  }, [onDisconnect]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    reconnect: connect,
    disconnect,
  };
}
