"use client";

import {
  Globe,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Invitations", href: "/admin/invitations", icon: Mail },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Portal Links", href: "/admin/portal-links", icon: Globe },
];

const sections: {
  title: string;
  items: { name: string; href: string; icon: typeof Globe }[];
}[] = [];

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleName="Admin Panel"
        title="Admin Panel"
        headerColor="#f97316"
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Admin Panel"
          baseHref="/admin"
          navigation={navigation}
          sections={sections}
          moduleColor="#f97316"
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
