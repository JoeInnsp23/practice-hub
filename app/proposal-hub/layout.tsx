"use client";

import {
  Calculator,
  FileText,
  Home,
  Settings,
  Target,
  UserPlus,
  Users,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

const navigation = [
  { name: "Overview", href: "/proposal-hub", icon: Home },
  { name: "Calculator", href: "/proposal-hub/calculator", icon: Calculator },
  { name: "Proposals", href: "/proposal-hub/proposals", icon: FileText },
  { name: "Leads", href: "/proposal-hub/leads", icon: Users },
];

const sections = [
  {
    title: "Management",
    items: [
      { name: "Onboarding", href: "/proposal-hub/onboarding", icon: UserPlus },
      {
        name: "Proposals Pipeline",
        href: "/proposal-hub/proposals/pipeline",
        icon: Target,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      { name: "Pricing", href: "/proposal-hub/admin/pricing", icon: Settings },
      {
        name: "Templates",
        href: "/proposal-hub/admin/templates",
        icon: FileText,
      },
    ],
  },
];

export default function ProposalHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-hub-root
      style={
        { "--hub-color": HUB_COLORS["proposal-hub"] } as React.CSSProperties
      }
      className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
    >
      <GlobalHeader
        moduleName="Proposal Hub"
        title="Proposal Hub"
        headerColor={HUB_COLORS["proposal-hub"]}
        showBackToHome={true}
      />

      <div className="flex">
        <GlobalSidebar
          moduleName="Proposal Hub"
          baseHref="/proposal-hub"
          navigation={navigation}
          sections={sections}
          moduleColor={HUB_COLORS["proposal-hub"]}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
