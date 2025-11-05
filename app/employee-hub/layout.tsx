"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Timer,
  TrendingUp,
  Umbrella,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [
  { name: "Dashboard", href: "/employee-hub", icon: Home },
  { name: "Timesheets", href: "/employee-hub/timesheets", icon: Clock },
  { name: "Time Entries", href: "/employee-hub/time-entries", icon: Timer },
  { name: "Leave", href: "/employee-hub/leave", icon: Umbrella },
  { name: "TOIL", href: "/employee-hub/toil", icon: TrendingUp },
];

const sections = [
  {
    title: "My Information",
    items: [
      { name: "My Timesheets", href: "/employee-hub/timesheets", icon: Clock },
      { name: "Leave Requests", href: "/employee-hub/leave", icon: Umbrella },
      {
        name: "Leave Calendar",
        href: "/employee-hub/leave/calendar",
        icon: Calendar,
      },
      { name: "TOIL Balance", href: "/employee-hub/toil", icon: TrendingUp },
    ],
  },
  {
    title: "Approvals",
    items: [
      {
        name: "Approval Queue",
        href: "/employee-hub/approvals",
        icon: CheckCircle,
      },
    ],
  },
];

export default function EmployeeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-hub-root
      style={{ ["--hub-color" as any]: HUB_COLORS["employee-hub"] }}
      className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
    >
      <GlobalHeader
        moduleName="Employee Hub"
        title="Employee Hub"
        headerColor={HUB_COLORS["employee-hub"]}
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Employee Hub"
          baseHref="/employee-hub"
          navigation={navigation}
          sections={sections}
          moduleColor={HUB_COLORS["employee-hub"]}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
