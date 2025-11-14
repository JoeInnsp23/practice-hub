"use client";

import {
  ArrowRight,
  Globe,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardInteractive } from "@/components/ui/card-interactive";
import { useSession } from "@/lib/auth-client";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const adminSections = [
    {
      title: "User Management",
      description: "Manage team members and their permissions",
      icon: Users,
      href: "/admin-hub/users",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Portal Links",
      description: "Manage portal categories and links",
      icon: Globe,
      href: "/admin-hub/portal-links",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: "Feedback & Issues",
      description: "View and manage user feedback and bug reports",
      icon: MessageSquare,
      href: "/admin-hub/feedback",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-card-foreground">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground mt-2">
          Manage your Practice Hub settings and configurations
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {adminSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <CardInteractive
              key={section.href}
              moduleColor={HUB_COLORS["admin-hub"]}
              href={section.href}
              ariaLabel={`Navigate to ${section.title}`}
              className="h-full animate-lift-in"
              style={{
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
              }}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 ${section.bgColor} rounded-lg flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-6 w-6 ${section.iconColor}`} />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <ArrowRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>
              </CardContent>
            </CardInteractive>
          );
        })}
      </div>

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                User
              </p>
              <p className="font-semibold">
                {session.user.name || session.user.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Email
              </p>
              <p className="font-semibold">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Admin Role
              </p>
              <p className="font-semibold capitalize">Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
