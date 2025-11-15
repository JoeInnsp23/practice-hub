"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Home,
  Shield,
  TrendingUp,
  Umbrella,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [{ name: "Dashboard", href: "/employee-hub", icon: Home }];

const sections = [
  {
    title: "Time & Attendance",
    items: [
      { name: "Timesheets", href: "/employee-hub/timesheets", icon: Clock },
      {
        name: "Leave Calendar",
        href: "/employee-hub/leave/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Benefits",
    items: [
      { name: "Leave Requests", href: "/employee-hub/leave", icon: Umbrella },
      { name: "TOIL Balance", href: "/employee-hub/toil", icon: TrendingUp },
    ],
  },
  {
    title: "Training & Compliance",
    items: [
      {
        name: "My Training",
        href: "/employee-hub/training",
        icon: GraduationCap,
      },
      {
        name: "SOPs Library",
        href: "/employee-hub/training/sops",
        icon: BookOpen,
      },
      {
        name: "Compliance Dashboard",
        href: "/employee-hub/training/compliance",
        icon: Shield,
      },
    ],
  },
  {
    title: "Admin",
    adminOnly: true,
    items: [
      {
        name: "Approvals",
        href: "/employee-hub/approvals",
        icon: CheckCircle,
      },
      {
        name: "SOP Management",
        href: "/employee-hub/sops",
        icon: BookOpen,
      },
    ],
  },
];

export function EmployeeHubLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const hubColor = HUB_COLORS["employee-hub"];

  return (
    <div
      data-hub-root
      data-employee-hub
      style={
        {
          "--hub-color": hubColor,
          "--hub-color-500": hubColor,
          "--primary": hubColor,
          "--ring": hubColor,
        } as React.CSSProperties
      }
      className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)]"
    >
      <GlobalHeader
        moduleName="Employee Hub"
        title="Employee Hub"
        headerColor={hubColor}
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Employee Hub"
          baseHref="/employee-hub"
          navigation={navigation}
          sections={sections}
          moduleColor={hubColor}
        />
        <main className="flex-1 min-w-0 overflow-x-hidden p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
