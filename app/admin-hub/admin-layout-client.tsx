"use client";

import {
  BookOpen,
  Globe,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [
  { name: "Dashboard", href: "/admin-hub", icon: LayoutDashboard },
  { name: "Announcements", href: "/admin-hub/announcements", icon: Megaphone },
  { name: "User Management", href: "/admin-hub/users", icon: Users },
  { name: "Feedback", href: "/admin-hub/feedback", icon: MessageSquare },
  { name: "SOP Management", href: "/admin-hub/sops", icon: BookOpen },
  { name: "Portal Links", href: "/admin-hub/portal-links", icon: Globe },
];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-hub-root
      style={{ "--hub-color": HUB_COLORS["admin-hub"] } as React.CSSProperties}
      className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)]"
    >
      <GlobalHeader
        moduleName="Admin Panel"
        title="Admin Panel"
        headerColor={HUB_COLORS["admin-hub"]}
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Admin Panel"
          baseHref="/admin-hub"
          navigation={navigation}
          moduleColor={HUB_COLORS["admin-hub"]}
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
