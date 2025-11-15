"use client";

import { Home, type LucideIcon } from "lucide-react";
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
  sections,
  children,
}: {
  sections: SidebarSection[];
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
