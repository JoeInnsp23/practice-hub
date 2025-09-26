"use client";

import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  Shield,
  Activity,
} from "lucide-react";
import { GlobalHeader } from "@/components/shared/GlobalHeader";
import { GlobalSidebar } from "@/components/shared/GlobalSidebar";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
];

const sections = [
  {
    title: "System Management",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Security", href: "/admin/security", icon: Shield },
      { name: "Activity Logs", href: "/admin/activity", icon: Activity },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for admin role
    const userRole = sessionClaims?.metadata?.role;
    if (!userId || (userRole !== "admin" && userRole !== "org:admin")) {
      router.push("/");
    }
  }, [userId, sessionClaims, router]);

  // Show nothing while checking auth
  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader
        moduleName="Admin Panel"
        title="Admin Panel"
        headerColor="#f97316"
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar
          moduleName="Admin Panel"
          baseHref="/admin"
          navigation={navigation}
          sections={sections}
          moduleColor="#f97316"
        />
        <main className="flex-1 p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}