"use client";

import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import type { RouterOutputs } from "@/app/providers/trpc-provider";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Notification = RouterOutputs["notifications"]["list"][number];

export default function NotificationsPage() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const { data: notificationsData } = trpc.notifications.list.useQuery(
    { limit: 100, unreadOnly: filter === "unread" },
    {
      refetchInterval: 10000, // Poll every 10 seconds
    },
  );

  // Fetch unread count
  const { data: unreadCountData } =
    trpc.notifications.getUnreadCount.useQuery();

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to mark as read");
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Notification deleted");
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });

  const notifications = notificationsData || [];
  const unreadCount = unreadCountData?.unreadCount || 0;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate({ notificationId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your latest activities
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as "all" | "unread")}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card className="divide-y">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {filter === "unread"
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet. They'll appear here when you do."}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const notificationContent = (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors border-l-4",
        notification.isRead
          ? "border-transparent"
          : "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "rounded-full p-2.5 flex-shrink-0",
            notification.isRead ? "bg-muted" : "bg-primary/10",
          )}
        >
          <Bell
            className={cn(
              "h-5 w-5",
              notification.isRead ? "text-muted-foreground" : "text-primary",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-base">{notification.title}</h4>
            {!notification.isRead && (
              <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{getFormattedDate(notification.createdAt)}</span>
            {notification.entityType && (
              <>
                <span>•</span>
                <span className="capitalize">{notification.entityType}</span>
              </>
            )}
            {notification.readAt && (
              <>
                <span>•</span>
                <span>Read {getRelativeTime(notification.readAt)}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              title="Mark as read"
            >
              <Check className="h-4 w-4 mr-1" />
              Mark read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // If notification has an action URL, wrap in Link
  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {notificationContent}
      </Link>
    );
  }

  return notificationContent;
}

// Helper function to get formatted date
function getFormattedDate(date: Date | string): string {
  const notificationDate = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays === 0) {
    return `Today at ${notificationDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  if (diffInDays === 1) {
    return `Yesterday at ${notificationDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  if (diffInDays < 7) {
    return `${notificationDate.toLocaleDateString([], { weekday: "long" })} at ${notificationDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return notificationDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Helper function to get relative time
function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMs = now.getTime() - notificationDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return notificationDate.toLocaleDateString();
}
