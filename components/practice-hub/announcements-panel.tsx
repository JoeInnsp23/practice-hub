"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Gift,
  Info,
  Megaphone,
  PartyPopper,
  Settings,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Icon mapping for announcements
const ICON_MAP = {
  Megaphone,
  AlertCircle,
  AlertTriangle,
  Info,
  Calendar,
  PartyPopper,
  Gift,
  Wrench,
  CheckCircle2,
  Users,
  Zap,
  Settings,
};

type IconName = keyof typeof ICON_MAP;

interface AnnouncementsPanelProps {
  limit?: number;
}

export function AnnouncementsPanel({ limit = 5 }: AnnouncementsPanelProps) {
  // Query announcements
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery(
    { limit },
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Show loading state
  if (isLoading) {
    return null;
  }

  // Show empty state if no announcements
  if (!announcements || announcements.length === 0) {
    return (
      <Card className="glass-card shadow-medium p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Company Announcements</h3>
            <p className="text-sm text-muted-foreground">
              No announcements at this time
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 text-xs"
          >
            <AlertCircle className="h-3 w-3" />
            Critical
          </Badge>
        );
      case "warning":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 text-xs"
          >
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground flex items-center gap-1 text-xs"
          >
            <Info className="h-3 w-3" />
            Info
          </Badge>
        );
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as IconName] || Megaphone;
    return IconComponent;
  };

  return (
    <Card className="glass-card shadow-medium p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
            <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Company Announcements</h3>
            <p className="text-sm text-muted-foreground">
              {announcements.length} active announcement
              {announcements.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href="/admin-hub/announcements">View All</Link>
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((announcement) => {
          const IconComponent = getIcon(announcement.icon);

          return (
            <div key={announcement.id} className="flex gap-3 p-3">
              {/* Icon */}
              <div
                className="p-2 rounded flex-shrink-0"
                style={{
                  backgroundColor: `${announcement.iconColor}20`,
                }}
              >
                <IconComponent
                  className="h-4 w-4"
                  style={{ color: announcement.iconColor }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {announcement.title}
                  </h4>
                  {getPriorityBadge(announcement.priority)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {announcement.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
