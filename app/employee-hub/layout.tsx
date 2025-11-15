import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  type LucideIcon,
  Shield,
  TrendingUp,
  Umbrella,
} from "lucide-react";
import type { Metadata } from "next";
import { getAuthContext } from "@/lib/auth";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import { EmployeeHubLayoutClient } from "./employee-hub-layout-client";

export const metadata: Metadata = {
  title: "Employee Hub | Practice Hub",
};

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

export default async function EmployeeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hubColor = HUB_COLORS["employee-hub"];

  // Get auth context for role-based filtering
  const authContext = await getAuthContext();
  const isAdmin = authContext?.role === "admin";

  // Define sections with admin-only flag
  const sections: SidebarSection[] = [
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

  // Filter sections based on admin role
  const filteredSections = sections.filter((section) => {
    if (section.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div
      style={
        {
          "--hub-color": hubColor,
          "--hub-color-500": hubColor,
          "--primary": hubColor,
          "--ring": hubColor,
        } as React.CSSProperties
      }
    >
      <EmployeeHubLayoutClient sections={filteredSections}>
        {children}
      </EmployeeHubLayoutClient>
    </div>
  );
}
