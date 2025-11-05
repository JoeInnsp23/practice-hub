"use client";

import { Calendar, FileText, Home, Share2 } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [
  { name: "Overview", href: "/social-hub", icon: Home },
  { name: "Accounts", href: "/social-hub/accounts", icon: Share2 },
  { name: "Content", href: "/social-hub/content", icon: FileText },
  { name: "Schedule", href: "/social-hub/schedule", icon: Calendar },
];

export default function SocialHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-hub-root
      style={{ ["--hub-color" as any]: HUB_COLORS["social-hub"] }}
      className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
    >
      <GlobalHeader
        moduleName="Social Hub"
        title="Social Hub"
        headerColor={HUB_COLORS["social-hub"]}
        showBackToHome={true}
      />

      <div className="flex">
        <GlobalSidebar
          moduleName="Social Hub"
          baseHref="/social-hub"
          navigation={navigation}
          moduleColor={HUB_COLORS["social-hub"]}
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
