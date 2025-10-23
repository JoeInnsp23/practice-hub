"use client";

import { useEffect, useState } from "react";
import { ConnectionStatus } from "@/components/shared/connection-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSSE } from "@/lib/hooks/use-sse";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format";

interface Activity {
  id: string;
  entityType: string;
  entityId: string;
  entityName?: string | null;
  action: string;
  description: string | null;
  userName: string | null;
  userEmail?: string | null;
  createdAt: string | Date;
  icon?: string;
  color?: string;
}

interface ActivityFeedProps {
  activities?: Activity[];
  loading?: boolean;
  className?: string;
  enableRealtime?: boolean; // Enable real-time updates via SSE
}

export function ActivityFeed({
  activities: initialActivities = [],
  loading = false,
  className,
  enableRealtime = true,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [newActivityCount, setNewActivityCount] = useState(0);

  // Subscribe to real-time activity updates
  const { connectionState, isPolling, subscribe } = useSSE(
    "/api/activity/stream",
    {
      maxReconnectAttempts: 3,
      enablePollingFallback: true,
    },
  );

  useEffect(() => {
    if (!enableRealtime) return;

    const unsubscribe = subscribe("activity:new", (event) => {
      const newActivity = event.data as Activity;

      // Add new activity to the top of the list
      setActivities((prev) => [newActivity, ...prev].slice(0, 50)); // Keep last 50
      setNewActivityCount((prev) => prev + 1);

      // Auto-reset badge after 3 seconds
      setTimeout(() => {
        setNewActivityCount(0);
      }, 3000);
    });

    return unsubscribe;
  }, [enableRealtime, subscribe]);

  // Update activities when initial data changes
  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);
  const getActivityIcon = (entityType: string, action?: string) => {
    if (entityType === "task") {
      if (action === "completed") return "✅";
      if (action === "created") return "➕";
      return "📋";
    }
    if (entityType === "client") return "👥";
    if (entityType === "invoice") return "💰";
    if (entityType === "time_entry") return "⏱️";
    if (entityType === "compliance") return "🛡️";
    if (entityType === "document") return "📄";
    return "📌";
  };

  const getActivityColor = (entityType: string, color?: string) => {
    if (color === "success")
      return "text-green-600 dark:text-green-400 bg-green-600/10 dark:bg-green-400/10";
    if (color === "destructive") return "text-destructive bg-destructive/10";
    if (color === "warning")
      return "text-orange-600 dark:text-orange-400 bg-orange-600/10 dark:bg-orange-400/10";

    switch (entityType) {
      case "task":
        return "text-primary bg-primary/10";
      case "client":
        return "text-green-600 dark:text-green-400 bg-green-600/10 dark:bg-green-400/10";
      case "invoice":
        return "text-purple-600 dark:text-purple-400 bg-purple-600/10 dark:bg-purple-400/10";
      case "time_entry":
        return "text-orange-600 dark:text-orange-400 bg-orange-600/10 dark:bg-orange-400/10";
      case "compliance":
        return "text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-400/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Activity</CardTitle>
            {newActivityCount > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {newActivityCount} new
              </Badge>
            )}
          </div>
          {enableRealtime && (
            <ConnectionStatus
              connectionState={connectionState}
              isPolling={isPolling}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {loading ? (
              // Loading skeletons
              ["s1", "s2", "s3", "s4", "s5"].map((skeletonId) => (
                <div key={skeletonId} className="flex gap-3 pb-4 border-b">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 pb-4 border-b last:border-0"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0",
                      getActivityColor(activity.entityType, activity.color),
                    )}
                  >
                    {getActivityIcon(activity.entityType, activity.action)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground break-words">
                      {activity.description || "No description"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        {activity.userName || "Unknown user"}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(activity.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
