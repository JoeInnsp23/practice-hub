"use client";

import Link from "next/link";
import { Home, Users, FileText, UserPlus } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";

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
        <nav className="w-64 bg-white dark:bg-slate-800 shadow-sm h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-slate-700">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Proposal Hub
            </h2>
            <div className="space-y-1">
              <Link
                href="/proposal-hub"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Home className="w-5 h-5" />
                <span>Overview</span>
              </Link>
              <Link
                href="/proposal-hub/leads"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Users className="w-5 h-5" />
                <span>Leads</span>
              </Link>
              <Link
                href="/proposal-hub/proposals"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <FileText className="w-5 h-5" />
                <span>Proposals</span>
              </Link>
              <Link
                href="/proposal-hub/onboarding"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <UserPlus className="w-5 h-5" />
                <span>Onboarding</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
