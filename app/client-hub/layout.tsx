"use client";

import { Sidebar } from "@/components/client-hub/sidebar";
import { Header } from "@/components/client-hub/header";

export default function ClientHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <Header />
          <main className="mt-16">{children}</main>
        </div>
      </div>
    </div>
  );
}