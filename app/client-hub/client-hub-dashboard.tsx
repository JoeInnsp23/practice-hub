"use client";

import { useEffect, useState } from "react";
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
import toast from "react-hot-toast";

interface ClientHubDashboardProps {
  userName?: string;
}

interface KPIData {
  totalRevenue: number;
  collectedRevenue: number;
  outstandingRevenue: number;
  activeClients: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks30d: number;
  overdueTasks: number;
  totalHours30d: number;
  billableHours30d: number;
  utilizationRate: number;
  collectionRate: number;
  upcomingCompliance30d: number;
}

export function ClientHubDashboard({ userName }: ClientHubDashboardProps) {
  const { user } = useUser();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use passed userName or fall back to Clerk user data
  // Convert to proper case (capitalize first letter of each word)
  const rawName = userName || user?.firstName || "User";
  const displayName = rawName
    .split(/[\s-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Fetch KPIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch KPIs
        const kpiResponse = await fetch("/api/dashboard/kpis");
        if (kpiResponse.ok) {
          const kpiData = await kpiResponse.json();
          setKpis(kpiData.kpis);
        } else {
          const errorData = await kpiResponse.json().catch(() => ({}));
          console.warn("KPIs unavailable:", errorData.error || "Unknown error");
          // Set default KPIs when API fails
          setKpis({
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
          });
        }

        // Fetch activity feed
        const activityResponse = await fetch("/api/dashboard/activity?limit=10");
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setActivities(activityData.activities);
        } else {
          console.warn("Activities unavailable");
          setActivities([]);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        // Show error only for network failures, not expected API errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          toast.error("Unable to connect to server. Please check your connection.");
        }
        // Set default values on error
        setKpis({
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
        });
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          value={kpis?.totalHours30d.toFixed(1) || "0"}
          icon={Clock}
          subtext={`${kpis?.utilizationRate.toFixed(0) || 0}% billable`}
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
