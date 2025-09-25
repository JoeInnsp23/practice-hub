"use client";

import Link from "next/link";
import { Home, Users, CheckSquare, Clock, FileText } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";

export default function ClientHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleName="Client Hub"
        title="Client Hub"
        headerColor="#3b82f6"
        showBackToHome={true}
      />

      <div className="flex">
        <nav className="w-64 bg-white dark:bg-slate-800 shadow-sm h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-slate-700">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Client Hub
            </h2>
            <div className="space-y-1">
              <Link
                href="/client-hub"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Home className="w-5 h-5" />
                <span>Overview</span>
              </Link>
              <Link
                href="/client-hub/clients"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Users className="w-5 h-5" />
                <span>Clients</span>
              </Link>
              <Link
                href="/client-hub/tasks"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <CheckSquare className="w-5 h-5" />
                <span>Tasks</span>
              </Link>
              <Link
                href="/client-hub/time"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Clock className="w-5 h-5" />
                <span>Time Tracking</span>
              </Link>
              <Link
                href="/client-hub/invoices"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <FileText className="w-5 h-5" />
                <span>Invoices</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
