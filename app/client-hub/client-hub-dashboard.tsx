"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ActivityFeed } from "@/components/client-hub/dashboard/activity-feed";
import { QuickActions } from "@/components/client-hub/dashboard/quick-actions";
import {
  Users,
  CheckSquare,
  Clock,
  FileText,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface ClientHubDashboardProps {
  userName?: string;
}

export function ClientHubDashboard({ userName }: ClientHubDashboardProps) {
  const { user } = useUser();

  // Use passed userName or fall back to Clerk user data
  // Convert to proper case (capitalize first letter of each word)
  const rawName = userName || user?.firstName || "User";
  const displayName = rawName
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Empty activities until API is connected
  const activities: any[] = [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {displayName}! Here's an overview of your practice.
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Clients"
          value="0"
          icon={Users}
        />
        <KPIWidget
          title="Active Tasks"
          value="0"
          icon={CheckSquare}
        />
        <KPIWidget
          title="Hours Tracked"
          value="0"
          icon={Clock}
        />
        <KPIWidget
          title="Pending Invoices"
          value="0"
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">£0</div>
            <p className="text-sm text-muted-foreground mt-2">
              No data available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-center py-4">
                <span className="text-sm text-muted-foreground">No upcoming deadlines</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Corporation Tax - XYZ</span>
                <span className="text-sm text-green-600 font-medium">
                  2 weeks
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
