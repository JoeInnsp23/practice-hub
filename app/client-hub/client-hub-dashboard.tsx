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
  Receipt,
  Target,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { trpc } from "@/app/providers/trpc-provider";

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

  // Fetch KPIs using tRPC
  const { data: kpisData, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery(undefined, {
    retry: false,
  });

  // Fetch activities using tRPC
  const { data: activitiesData, isLoading: activitiesLoading } = trpc.dashboard.activity.useQuery(
    { limit: 10 },
    { retry: false }
  );

  const loading = kpisLoading || activitiesLoading;
  const kpis = kpisData?.kpis || {
    totalRevenue: 0,
    collectedRevenue: 0,
    outstandingRevenue: 0,
    activeClients: 0,
    newClients30d: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks30d: 0,
    overdueTasks: 0,
    totalHours30d: 0,
    billableHours30d: 0,
    upcomingCompliance30d: 0,
    overdueCompliance: 0,
    utilizationRate: 0,
    collectionRate: 0,
  };
  const activities = activitiesData?.activities || [];

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
          title="Active Clients"
          value={kpis?.activeClients.toString() || "0"}
          icon={Users}
          loading={loading}
        />
        <KPIWidget
          title="Active Tasks"
          value={(kpis ? kpis.pendingTasks + kpis.inProgressTasks : 0).toString()}
          icon={CheckSquare}
          subtext={kpis?.overdueTasks ? `${kpis.overdueTasks} overdue` : undefined}
          loading={loading}
        />
        <KPIWidget
          title="Hours (30d)"
          value={kpis?.totalHours30d?.toFixed(1) || "0"}
          icon={Clock}
          subtext={`${kpis?.utilizationRate?.toFixed(0) || 0}% billable`}
          loading={loading}
        />
        <KPIWidget
          title="Outstanding"
          value={formatCurrency(kpis?.outstandingRevenue || 0)}
          icon={Receipt}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} loading={loading} />
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
            <div className="text-3xl font-bold">
              {formatCurrency(kpis?.collectedRevenue || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {kpis?.collectionRate.toFixed(0) || 0}% collection rate
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
