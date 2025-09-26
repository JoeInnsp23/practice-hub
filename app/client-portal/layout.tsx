"use client";

import Link from "next/link";
import { Home, FileText, MessageSquare, Calendar, Shield } from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        title="Client Portal"
        subtitle="Secure Document Access"
        icon={Shield}
        iconColor="#4f46e5"
      />

      <div className="flex">
        <nav className="w-64 bg-card shadow-sm h-[calc(100vh-4rem)] border-r border">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Client Portal
            </h2>
            <div className="space-y-1">
              <Link
                href="/client-portal"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/client-portal/documents"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <FileText className="w-5 h-5" />
                <span>Documents</span>
              </Link>
              <Link
                href="/client-portal/messages"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Messages</span>
              </Link>
              <Link
                href="/client-portal/bookings"
                className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Meeting</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
