"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Edit,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { Card } from "@/components/ui/card";

// Map action types to icons and colors
const getActionIcon = (action: string) => {
  switch (action) {
    case "created":
      return { Icon: Plus, color: "text-green-600 dark:text-green-400" };
    case "updated":
    case "edited":
      return { Icon: Edit, color: "text-blue-600 dark:text-blue-400" };
    case "deleted":
      return { Icon: Trash, color: "text-red-600 dark:text-red-400" };
    case "assigned":
    case "reassigned":
      return { Icon: UserPlus, color: "text-purple-600 dark:text-purple-400" };
    case "status_changed":
    case "stage_changed":
      return { Icon: ArrowRight, color: "text-amber-600 dark:text-amber-400" };
    case "email_sent":
      return { Icon: Mail, color: "text-indigo-600 dark:text-indigo-400" };
    case "called":
    case "phone_call":
      return { Icon: Phone, color: "text-cyan-600 dark:text-cyan-400" };
    case "note_added":
    case "commented":
      return {
        Icon: MessageSquare,
        color: "text-slate-600 dark:text-slate-400",
      };
    case "meeting_scheduled":
    case "follow_up_scheduled":
      return { Icon: Calendar, color: "text-orange-600 dark:text-orange-400" };
    case "completed":
      return {
        Icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
      };
    case "rejected":
    case "cancelled":
      return { Icon: XCircle, color: "text-red-600 dark:text-red-400" };
    case "pdf_generated":
      return { Icon: FileText, color: "text-blue-600 dark:text-blue-400" };
    default:
      return { Icon: Activity, color: "text-slate-600 dark:text-slate-400" };
  }
};

export function RecentActivityFeed() {
  const { data, isLoading } = trpc.activities.getRecent.useQuery({
    limit: 10,
  });

  const activities = data?.activities || [];

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-sm">
            Loading activities...
          </div>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Activity className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Activity will appear here as actions are taken
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Link
          href="/proposal-hub/leads"
          className="text-xs text-primary hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => {
          const { Icon, color } = getActionIcon(activity.action);

          // Build link to entity
          let entityLink = "#";
          if (activity.entityType === "lead" && activity.entityId) {
            entityLink = `/proposal-hub/leads/${activity.entityId}`;
          } else if (activity.entityType === "proposal" && activity.entityId) {
            entityLink = `/proposal-hub/proposals/${activity.entityId}`;
          }

          return (
            <Link
              key={activity.id}
              href={entityLink}
              className="block hover:bg-accent/50 rounded-lg p-2 -mx-2 transition-colors"
            >
              <div className="flex gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-current ${color} flex items-center justify-center`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">
                    {activity.description || activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {activity.userName && (
                      <>
                        <User className="h-3 w-3" />
                        <span className="truncate">{activity.userName}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
