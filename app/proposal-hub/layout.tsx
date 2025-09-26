"use client";

import { Home, Users, FileText, UserPlus } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";

const navigation = [
  { name: "Overview", href: "/proposal-hub", icon: Home },
  { name: "Leads", href: "/proposal-hub/leads", icon: Users },
  { name: "Proposals", href: "/proposal-hub/proposals", icon: FileText },
  { name: "Onboarding", href: "/proposal-hub/onboarding", icon: UserPlus },
];

export default function ProposalHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleName="Proposal Hub"
        title="Proposal Hub"
        headerColor="#ec4899"
        showBackToHome={true}
      />

      <div className="flex">
        <GlobalSidebar
          moduleName="Proposal Hub"
          baseHref="/proposal-hub"
          navigation={navigation}
          moduleColor="#ec4899"
        />

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
