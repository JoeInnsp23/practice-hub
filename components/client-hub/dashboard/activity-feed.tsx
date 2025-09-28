import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "task" | "client" | "invoice" | "time_entry";
  action: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
}

interface ActivityFeedProps {
  activities?: Activity[];
  className?: string;
}

export function ActivityFeed({
  activities = [],
  className,
}: ActivityFeedProps) {
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "task":
        return "📋";
      case "client":
        return "👥";
      case "invoice":
        return "💰";
      case "time_entry":
        return "⏱️";
      default:
        return "📌";
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "task":
        return "text-primary bg-primary/10";
      case "client":
        return "text-green-600 dark:text-green-400 bg-green-600/10 dark:bg-green-400/10";
      case "invoice":
        return "text-purple-600 dark:text-purple-400 bg-purple-600/10 dark:bg-purple-400/10";
      case "time_entry":
        return "text-orange-600 dark:text-orange-400 bg-orange-600/10 dark:bg-orange-400/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex gap-3 pb-4 border-b last:border-0"
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center text-lg",
                    getActivityColor(activity.type),
                  )}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{activity.user.name}</span>
                    <span>•</span>
                    <span>{formatDateTime(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
