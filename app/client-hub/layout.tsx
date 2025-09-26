"use client";

import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FolderOpen,
  Clock,
  Timer,
  FileText,
  DollarSign,
  Package,
  Shield,
  BarChart3,
  Settings,
  GitBranch,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";

const navigation = [
  { name: "Dashboard", href: "/client-hub", icon: LayoutDashboard },
  { name: "Clients", href: "/client-hub/clients", icon: Users },
  { name: "Tasks", href: "/client-hub/tasks", icon: CheckSquare },
  { name: "Workflows", href: "/client-hub/workflows", icon: GitBranch },
  { name: "Documents", href: "/client-hub/documents", icon: FolderOpen },
];

const sections = [
  {
    title: "Time Management",
    items: [
      { name: "Time Entry", href: "/client-hub/time-entry", icon: Clock },
      { name: "Time Tracking", href: "/client-hub/time-tracking", icon: Timer },
    ],
  },
  {
    title: "Financial",
    items: [
      { name: "Invoices", href: "/client-hub/invoices", icon: DollarSign },
      { name: "Services", href: "/client-hub/services", icon: Package },
    ],
  },
  {
    title: "Management",
    items: [
      { name: "Compliance", href: "/client-hub/compliance", icon: Shield },
      { name: "Reports", href: "/client-hub/reports", icon: BarChart3 },
      { name: "Settings", href: "/client-hub/settings", icon: Settings },
    ],
  },
];

export default function ClientHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleName="Client Hub"
        title="Client Hub"
        headerColor="#3b82f6"
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Client Hub"
          baseHref="/client-hub"
          navigation={navigation}
          sections={sections}
          moduleColor="#3b82f6"
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
