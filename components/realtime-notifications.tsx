"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSSE } from "@/lib/hooks/use-sse";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "urgent";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  groupKey?: string; // For grouping similar notifications
  count?: number; // Count of grouped notifications
}

interface NotificationPreferences {
  soundEnabled: boolean;
  urgentToastEnabled: boolean;
}

export function RealtimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    soundEnabled: true,
    urgentToastEnabled: true,
  });

  const { isConnected, connectionState, subscribe } = useSSE(
    "/api/activity/stream",
    {
      maxReconnectAttempts: 3,
      enablePollingFallback: true,
    },
  );

  const playNotificationSound = useCallback(() => {
    if (typeof window !== "undefined" && "Audio" in window) {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore if autoplay is blocked
        });
      } catch (_error) {
        // Ignore sound errors
      }
    }
  }, []);

  // Subscribe to notification events
  useEffect(() => {
    const unsubscribe = subscribe("notification:new", (event) => {
      const data = event.data as {
        id?: string;
        type?: "success" | "error" | "info" | "warning" | "urgent";
        title?: string;
        message?: string;
        actionUrl?: string;
        groupKey?: string;
      };

      const newNotification: Notification = {
        id: data.id || `notif-${Date.now()}`,
        type: data.type || "info",
        title: data.title || "New Notification",
        message: data.message || "",
        timestamp: new Date(),
        read: false,
        actionUrl: data.actionUrl,
        groupKey: data.groupKey,
      };

      // Handle notification grouping
      if (data.groupKey) {
        setNotifications((prev) => {
          const existingIndex = prev.findIndex(
            (n) => n.groupKey === data.groupKey,
          );
          if (existingIndex !== -1) {
            // Update existing grouped notification
            const updated = [...prev];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              count: (existing.count || 1) + 1,
              timestamp: new Date(), // Update to latest timestamp
              read: false, // Mark as unread since new notification arrived
            };
            return updated;
          }
          // New notification
          return [{ ...newNotification, count: 1 }, ...prev].slice(0, 50);
        });
      } else {
        // Add non-grouped notification
        setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
      }

      setUnreadCount((prev) => prev + 1);

      // Handle urgent notifications with toast
      if (data.type === "urgent" && preferences.urgentToastEnabled) {
        toast.error(data.message || data.title || "Urgent notification", {
          duration: 5000,
          icon: "🔔",
        });
      }

      // Play notification sound
      if (preferences.soundEnabled) {
        playNotificationSound();
      }
    });

    return unsubscribe;
  }, [subscribe, preferences, playNotificationSound]);

  const toggleSoundPreference = () => {
    setPreferences((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    const notification = notifications.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    const colors = {
      info: "text-blue-500",
      success: "text-green-500",
      warning: "text-orange-500",
      error: "text-red-500",
      urgent: "text-red-600",
    };

    return colors[type] || colors.info;
  };

  const getConnectionStatusColor = () => {
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

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting...";
      case "reconnecting":
        return "Reconnecting...";
      case "disconnected":
        return "Disconnected";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          <span
            className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ${getConnectionStatusColor()}`}
            title={getConnectionStatusText()}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            <Badge variant="secondary" className="text-xs">
              {getConnectionStatusText()}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSoundPreference}
              title={
                preferences.soundEnabled ? "Disable sound" : "Enable sound"
              }
            >
              {preferences.soundEnabled ? "🔊" : "🔇"}
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${
                    !notification.read ? "bg-muted/50" : ""
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${getNotificationIcon(
                          notification.type,
                        )}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {notification.title}
                          {notification.count && notification.count > 1 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {notification.count}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                          {notification.count && notification.count > 1 && (
                            <span className="ml-1">
                              (+{notification.count - 1} more)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {!isConnected && (
          <div className="p-2 border-t bg-orange-50 dark:bg-orange-900/20">
            <p className="text-xs text-center text-orange-600 dark:text-orange-400">
              Real-time updates disconnected
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
