"use client";

import { Calendar, FileText, Home, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

export default function ClientAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)]">
      <GlobalHeader
        title="Client Admin"
        subtitle="Manage Client Portal Access"
        icon={Users}
        iconColor={HUB_COLORS["portal-hub"]}
      />

      <div className="flex">
        <nav className="w-64 bg-card shadow-sm h-[calc(100vh-4rem)] border-r border">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Client Admin
            </h2>
            <div className="space-y-1">
              <Link
                href="/client-admin"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/client-admin/users"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Users className="w-5 h-5" />
                <span>Portal Users</span>
              </Link>
              <Link
                href="/client-admin/invitations"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <FileText className="w-5 h-5" />
                <span>Invitations</span>
              </Link>
              <Link
                href="/client-admin/access"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Access Management</span>
              </Link>
              <Link
                href="/client-admin/activity"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Calendar className="w-5 h-5" />
                <span>Activity Log</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
