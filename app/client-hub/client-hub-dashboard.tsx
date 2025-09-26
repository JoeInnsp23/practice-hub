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
  const displayName = userName || user?.firstName || "User";

  // Mock data - in production, this would come from API
  const activities = [
    {
      id: "1",
      type: "client" as const,
      title: "New client added",
      description: "ABC Company Ltd has been added as a new client",
      time: "2 hours ago",
      user: "John Smith",
    },
    {
      id: "2",
      type: "task" as const,
      title: "Task completed",
      description: "Annual accounts review for XYZ Ltd marked as complete",
      time: "4 hours ago",
      user: "Jane Wilson",
    },
    {
      id: "3",
      type: "invoice" as const,
      title: "Invoice sent",
      description: "Invoice #INV-2024-001 sent to Tech Innovations",
      time: "Yesterday",
      user: "Alice Brown",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Welcome back, {displayName}!</h1>
        <p className="mt-2 text-muted-foreground text-base">
          Here's an overview of your practice dashboard.
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget
          title="Total Clients"
          value="156"
          change={12}
          icon={Users}
          color="blue"
        />
        <KPIWidget
          title="Active Tasks"
          value="42"
          change={-5}
          icon={CheckSquare}
          color="green"
        />
        <KPIWidget
          title="Hours Tracked"
          value="1,234"
          change={8}
          icon={Clock}
          color="purple"
        />
        <KPIWidget
          title="Pending Invoices"
          value="23"
          change={15}
          icon={FileText}
          color="orange"
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
            <div className="text-3xl font-bold">£45,230</div>
            <p className="text-sm text-muted-foreground mt-2">
              +18% from last month
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
              <div className="flex justify-between items-center">
                <span className="text-sm">VAT Returns Due</span>
                <span className="text-sm text-orange-600 font-medium">
                  3 days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Annual Accounts - ABC Ltd</span>
                <span className="text-sm text-yellow-600 font-medium">
                  1 week
                </span>
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
