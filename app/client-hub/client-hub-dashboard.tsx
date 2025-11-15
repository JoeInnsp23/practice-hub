"use client";

import {
  AlertCircle,
  Calendar,
  CheckSquare,
  Clock,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { ActivityFeed } from "@/components/client-hub/dashboard/activity-feed";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { QuickActions } from "@/components/client-hub/dashboard/quick-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils/format";

interface ClientHubDashboardProps {
  userName?: string;
}

export function ClientHubDashboard({ userName }: ClientHubDashboardProps) {
  const { data: session } = useSession();

  // Use passed userName or fall back to session user data
  // Convert to proper case (capitalize first letter of each word)
  const rawName = userName || session?.user?.name?.split(" ")[0] || "User";
  const displayName = rawName
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Fetch KPIs using tRPC
  const {
    data: kpisData,
    isLoading: kpisLoading,
    error: kpisError,
  } = trpc.dashboard.kpis.useQuery(undefined, {
    retry: false,
  });

  // Fetch activities using tRPC
  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = trpc.dashboard.activity.useQuery(
    { limit: 10 },
    {
      retry: false,
    },
  );

  // Fetch upcoming deadlines using tRPC
  const {
    data: deadlinesData,
    isLoading: deadlinesLoading,
    error: deadlinesError,
  } = trpc.compliance.getUpcoming.useQuery(
    { days: 30 },
    {
      retry: false,
    },
  );

  const loading = kpisLoading || activitiesLoading;
  const deadlines = deadlinesData?.deadlines || [];

  // Calculate urgency for each deadline
  const getUrgencyColor = (dueDate: Date | null) => {
    if (!dueDate) return "text-muted-foreground";

    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDue < 7) return "text-red-600";
    if (daysUntilDue >= 7 && daysUntilDue <= 14) return "text-yellow-600";
    return "text-green-600";
  };

  const getUrgencyText = (dueDate: Date | null) => {
    if (!dueDate) return "No date";

    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDue === 0) return "Today";
    if (daysUntilDue === 1) return "Tomorrow";
    if (daysUntilDue < 7) return `${daysUntilDue} days`;
    if (daysUntilDue < 14)
      return `${Math.floor(daysUntilDue / 7)} week${Math.floor(daysUntilDue / 7) > 1 ? "s" : ""}`;
    return `${Math.floor(daysUntilDue / 7)} weeks`;
  };
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

  // Show error message if there's an authentication issue
  if (kpisError || activitiesError) {
    const error = kpisError || activitiesError;
    const isAuthError =
      error?.message?.includes("UNAUTHORIZED") ||
      error?.message?.includes("signed-out");

    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-red-600">
              {isAuthError ? "Authentication Error" : "Error Loading Dashboard"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isAuthError
                ? "Please sign in again to access the dashboard."
                : "Failed to load dashboard data. Please try refreshing the page."}
            </p>
            {!isAuthError && (
              <p className="text-sm text-muted-foreground mt-2">
                Error details: {error?.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          value={(kpis
            ? kpis.pendingTasks + kpis.inProgressTasks
            : 0
          ).toString()}
          icon={CheckSquare}
          subtext={
            kpis?.overdueTasks ? `${kpis.overdueTasks} overdue` : undefined
          }
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
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </div>
              {deadlines.length > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {deadlines.length} deadline{deadlines.length > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : deadlinesError ? (
              <div className="flex items-center gap-2 text-red-600 py-4">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Failed to load deadlines</span>
              </div>
            ) : deadlines.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-sm text-muted-foreground">
                  No upcoming deadlines
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {deadlines.slice(0, 5).map((deadline) => (
                  <Link
                    key={deadline.id}
                    href={`/client-hub/compliance/${deadline.id}`}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">
                        {deadline.type} - {deadline.clientName || "Unassigned"}
                      </div>
                      {deadline.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {deadline.description}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ml-4 ${getUrgencyColor(deadline.dueDate)}`}
                    >
                      {getUrgencyText(deadline.dueDate)}
                    </span>
                  </Link>
                ))}
                {deadlines.length > 5 && (
                  <Link
                    href="/client-hub/compliance"
                    className="block text-center text-sm text-primary hover:underline pt-2"
                  >
                    View all {deadlines.length} deadlines →
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
