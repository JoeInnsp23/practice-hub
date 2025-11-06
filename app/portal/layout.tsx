"use client";

import * as Sentry from "@sentry/nextjs";
import { FileText, Home, LogOut, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ClientSwitcher } from "@/components/client-portal/client-switcher";
import { Button } from "@/components/ui/button";
import { ClientPortalProvider } from "@/contexts/client-portal-context";
import {
  clientPortalSignOut,
  useClientPortalSession,
} from "@/lib/client-portal-auth-client";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useClientPortalSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await clientPortalSignOut();
      toast.success("Signed out successfully");
      router.push("/portal/sign-in");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: "client_portal_sign_out",
          component: "PortalLayout",
        },
      });
      toast.error("Failed to sign out");
    }
  };

  return (
    <ClientPortalProvider>
      <div
        data-hub-root
        style={
          { "--hub-color": HUB_COLORS["portal-hub"] } as React.CSSProperties
        }
        className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)]"
      >
        {/* Header */}
        <header className="bg-card shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-card-foreground">
                  Client Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.name || session?.user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session && <ClientSwitcher />}
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <nav className="w-64 bg-card shadow-sm min-h-[calc(100vh-73px)] border-r">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Navigation
              </h2>
              <div className="space-y-1">
                <Link
                  href="/portal"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/portal/proposals"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <FileText className="w-5 h-5" />
                  <span>Proposals</span>
                </Link>
                <Link
                  href="/portal/invoices"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <FileText className="w-5 h-5" />
                  <span>Invoices</span>
                </Link>
                <Link
                  href="/portal/documents"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <FileText className="w-5 h-5" />
                  <span>Documents</span>
                </Link>
                <Link
                  href="/portal/messages"
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </ClientPortalProvider>
  );
}
