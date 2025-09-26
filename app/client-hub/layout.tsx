"use client";

import { Sidebar } from "@/components/client-hub/sidebar";
import { GlobalHeader } from "@/components/shared/GlobalHeader";

export default function ClientHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GlobalHeader
        moduleName="Client Hub"
        title="Client Hub"
        headerColor="#3b82f6"
        showBackToHome={true}
      />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <main className="mt-16">{children}</main>
        </div>
      </div>
    </div>
  );
}