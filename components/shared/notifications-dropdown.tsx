"use client";

import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function NotificationsDropdown({
  isOnColoredBackground = false,
}: {
  isOnColoredBackground?: boolean;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  // Fetch unread count
  const { data: unreadCountData } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Poll every 10 seconds
    },
  );

  // Fetch notifications (only when dropdown is open)
  const { data: notificationsData } = trpc.notifications.list.useQuery(
    { limit: 20, unreadOnly: false },
    {
      enabled: open,
      refetchInterval: open ? 5000 : false, // Poll every 5 seconds when open
    },
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
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
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.list.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });

  const unreadCount = unreadCountData?.unreadCount || 0;
  const notifications = notificationsData || [];

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAsReadMutation.mutate({ notificationId });
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotificationMutation.mutate({ notificationId });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${isOnColoredBackground ? "hover:bg-white/10" : ""}`}
          aria-label="Notifications"
        >
          <Bell
            className={`h-5 w-5 ${isOnColoredBackground ? "text-white" : ""}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 !bg-white dark:!bg-[rgb(20,26,35)] !border-slate-200 dark:!border-[rgb(40,45,55)] !shadow-[0_10px_40px_rgba(148,163,184,0.1),0_1px_3px_rgba(0,0,0,0.04)] dark:!shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map(
                (notification: {
                  id: string;
                  title: string;
                  message: string;
                  isRead: boolean;
                  createdAt: Date | string;
                  entityType?: string | null;
                  actionUrl?: string | null;
                }) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ),
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/practice-hub/notifications" className="block">
                <Button variant="ghost" className="w-full" size="sm">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date | string;
    entityType?: string | null;
    actionUrl?: string | null;
  };
  onMarkAsRead: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const notificationContent = (
    <div
      className={cn(
        "relative p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-4",
        notification.isRead
          ? "border-transparent"
          : "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{getRelativeTime(notification.createdAt)}</span>
            {notification.entityType && (
              <>
                <span>•</span>
                <span className="capitalize">{notification.entityType}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => onMarkAsRead(notification.id, e)}
              title="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => onDelete(notification.id, e)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  // If notification has an action URL, wrap in Link
  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} onClick={() => {}} className="block">
        {notificationContent}
      </Link>
    );
  }

  return notificationContent;
}

// Helper function to get relative time
function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInMs = now.getTime() - notificationDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return notificationDate.toLocaleDateString();
}
