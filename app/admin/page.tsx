import { getAuthContext } from "@/lib/auth";
import Link from "next/link";
import {
  Settings,
  Users,
  MessageSquare,
  Palette,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const authContext = await getAuthContext();
  if (!authContext) return null;

  const adminSections = [
    {
      title: "User Management",
      description: "Manage team members and their permissions",
      icon: Users,
      href: "/admin/users",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Feedback & Issues",
      description: "View and manage user feedback and bug reports",
      icon: MessageSquare,
      href: "/admin/feedback",
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Manage your Practice Hub settings and configurations
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
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
              <p className="text-sm font-medium text-gray-600 mb-1">
                Organization
              </p>
              <p className="font-semibold">
                {authContext.organizationName || "Practice Hub"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Your Role
              </p>
              <p className="font-semibold capitalize">{authContext.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Tenant ID
              </p>
              <p className="font-mono text-xs text-gray-500">
                {authContext.tenantId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
