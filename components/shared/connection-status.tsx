"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionState } from "@/lib/realtime/client";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
  isPolling?: boolean;
  className?: string;
}

/**
 * Connection Status Indicator
 *
 * Displays the current real-time connection status with visual feedback.
 *
 * States:
 * - Connected: Green indicator with "Live" text
 * - Connecting/Reconnecting: Yellow indicator with animated pulse
 * - Disconnected/Failed: Red indicator
 * - Polling: Orange indicator (fallback mode)
 *
 * @example
 * ```typescript
 * const { connectionState, isPolling } = useSSE('/api/activity/stream');
 * <ConnectionStatus connectionState={connectionState} isPolling={isPolling} />
 * ```
 */
export function ConnectionStatus({
  connectionState,
  isPolling = false,
  className = "",
}: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (isPolling) return "bg-orange-500";

    switch (connectionState) {
      case "connected":
        return "bg-green-500";
      case "connecting":
      case "reconnecting":
        return "bg-yellow-500";
      case "disconnected":
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    if (isPolling) return "Polling";

    switch (connectionState) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting";
      case "reconnecting":
        return "Reconnecting";
      case "disconnected":
        return "Disconnected";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    if (connectionState === "connected" && !isPolling) {
      return <Wifi className="h-3 w-3" />;
    }
    return <WifiOff className="h-3 w-3" />;
  };

  const getTooltipText = () => {
    if (isPolling) {
      return "Real-time connection unavailable. Using polling fallback (updates every 30s).";
    }

    switch (connectionState) {
      case "connected":
        return "Real-time connection established. Updates are instant.";
      case "connecting":
        return "Establishing real-time connection...";
      case "reconnecting":
        return "Connection lost. Attempting to reconnect...";
      case "disconnected":
        return "Not connected to real-time updates.";
      case "failed":
        return "Connection failed. Please refresh the page.";
      default:
        return "Connection status unknown.";
    }
  };

  const shouldPulse =
    connectionState === "connecting" || connectionState === "reconnecting";

  return (
    <div
      className={`flex items-center gap-2 text-xs ${className}`}
      title={getTooltipText()}
    >
      <div className="relative">
        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
        {shouldPulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${getStatusColor()}`}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut",
            }}
          />
        )}
      </div>
      <span className="text-muted-foreground flex items-center gap-1">
        {getStatusIcon()}
        {getStatusText()}
      </span>
    </div>
  );
}
