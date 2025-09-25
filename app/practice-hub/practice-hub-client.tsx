"use client";

import { useUser } from "@clerk/nextjs";
import { KPIWidget } from "@/components/practice-hub/dashboard/kpi-widget";
import { ActivityFeed } from "@/components/practice-hub/dashboard/activity-feed";
import { QuickActions } from "@/components/practice-hub/dashboard/quick-actions";
import {
  Users,
  CheckSquare,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Target,
} from "lucide-react";

interface PracticeHubClientProps {
  userRole?: string;
  userName?: string;
}

export function PracticeHubClient({ userRole, userName }: PracticeHubClientProps) {
  const { user } = useUser();

  // Use passed userName or fall back to Clerk user data
  const displayName = userName || user?.firstName || "User";

  const kpis = [
    {
      title: "Active Clients",
      value: "156",
      change: { value: 12, trend: "up" as const },
      icon: Users,
      iconColor: "text-blue-600",
    },
    {
      title: "Open Tasks",
      value: "43",
      change: { value: 8, trend: "down" as const },
      icon: CheckSquare,
      iconColor: "text-green-600",
    },
    {
      title: "Hours Today",
      value: "6.5",
      icon: Clock,
      iconColor: "text-orange-600",
    },
    {
      title: "Outstanding Invoices",
      value: "£45,230",
      change: { value: 15, trend: "up" as const },
      icon: DollarSign,
      iconColor: "text-purple-600",
    },
    {
      title: "This Month's Revenue",
      value: "£125,430",
      change: { value: 23, trend: "up" as const },
      icon: TrendingUp,
      iconColor: "text-green-600",
    },
    {
      title: "Pending Approvals",
      value: "8",
      icon: FileText,
      iconColor: "text-red-600",
    },
    {
      title: "Upcoming Deadlines",
      value: "12",
      icon: Calendar,
      iconColor: "text-yellow-600",
    },
    {
      title: "Completion Rate",
      value: "87%",
      change: { value: 5, trend: "up" as const },
      icon: Target,
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {displayName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's what's happening with your practice today.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}