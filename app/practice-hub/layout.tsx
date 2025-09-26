"use client";

import { Building2 } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";

export default function PracticeHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        title="Practice Hub"
        subtitle="Business Management Suite"
        icon={Building2}
        iconColor="#2563eb"
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            © 2025 Practice Hub. Internal Use Only.
          </p>
        </div>
      </footer>
    </div>
  );
}
