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

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "task",
    action: "completed",
    description: "Completed VAT return for ABC Company",
    user: { name: "John Doe" },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "client",
    action: "created",
    description: "Added new client: XYZ Limited",
    user: { name: "Jane Smith" },
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
  },
  {
    id: "3",
    type: "invoice",
    action: "sent",
    description: "Invoice #INV-2024-001 sent to client",
    user: { name: "Bob Johnson" },
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
  },
  {
    id: "4",
    type: "time_entry",
    action: "logged",
    description: "Logged 2.5 hours for Client Meeting",
    user: { name: "Alice Brown" },
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
  },
  {
    id: "5",
    type: "task",
    action: "assigned",
    description: "New task assigned: Prepare annual accounts",
    user: { name: "Charlie Wilson" },
    timestamp: new Date(Date.now() - 1000 * 60 * 300),
  },
];

export function ActivityFeed({
  activities = mockActivities,
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
        return "text-blue-600 bg-blue-50";
      case "client":
        return "text-green-600 bg-green-50";
      case "invoice":
        return "text-purple-600 bg-purple-50";
      case "time_entry":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
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
                    getActivityColor(activity.type)
                  )}
                >
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
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