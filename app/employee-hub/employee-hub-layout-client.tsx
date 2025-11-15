"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  FilePlus,
  GraduationCap,
  Home,
  type LucideIcon,
  Shield,
  UserCheck,
} from "lucide-react";
import { useMemo } from "react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [{ name: "Dashboard", href: "/employee-hub", icon: Home }];

interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarSection {
  title: string;
  adminOnly?: boolean;
  items: SidebarItem[];
}

export function EmployeeHubLayoutClient({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const hubColor = HUB_COLORS["employee-hub"];

  // Define sections with admin-only flag
  const allSections: SidebarSection[] = useMemo(
    () => [
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
          {
            name: "Leave & TOIL",
            href: "/employee-hub/leave",
            icon: Calendar,
          },
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
        title: "Review",
        items: [
          {
            name: "Timesheet Approvals",
            href: "/employee-hub/approvals/timesheets",
            icon: CheckSquare,
          },
          {
            name: "Leave Approvals",
            href: "/employee-hub/approvals/leave",
            icon: UserCheck,
          },
          {
            name: "Create SOP",
            href: "/employee-hub/sops/create",
            icon: FilePlus,
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
    ],
    [],
  );

  // Filter sections based on admin role
  const sections = useMemo(
    () =>
      allSections.filter((section) => {
        if (section.adminOnly && !isAdmin) return false;
        return true;
      }),
    [allSections, isAdmin],
  );

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
