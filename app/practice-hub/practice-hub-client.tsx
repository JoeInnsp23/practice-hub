"use client";

import { useUser } from "@clerk/nextjs";
import { NavigationTabs } from "@/components/practice-hub/NavigationTabs";
import { AppCard } from "@/components/practice-hub/AppCard";
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Users,
  Share2,
  UserCheck,
  Calculator,
  FileText,
  DollarSign,
  TrendingUp,
  Briefcase,
  ExternalLink,
  BookOpen,
  Shield,
} from "lucide-react";

interface PracticeHubClientProps {
  userRole?: string;
  userName?: string;
}

export function PracticeHubClient({ userRole, userName }: PracticeHubClientProps) {
  const { user } = useUser();

  // Use passed userName or fall back to Clerk user data
  const displayName = userName || user?.firstName || "User";

  const practiceHubApps = [
    {
      id: "proposal",
      name: "Proposal Hub",
      description: "Lead management and proposal generation",
      icon: TrendingUp,
      color: "#ec4899",
      url: "/proposal-hub",
      status: "active" as const,
    },
    {
      id: "social",
      name: "Social Hub",
      description: "Schedule and manage social media posts",
      icon: Share2,
      color: "#8b5cf6",
      url: "/social-hub",
      status: "active" as const,
    },
    {
      id: "client",
      name: "Client Hub",
      description: "Client relationship and practice management",
      icon: Users,
      color: "#3b82f6",
      url: "/client-hub",
      status: "active" as const,
    },
    {
      id: "employee",
      name: "Employee Portal",
      description: "Staff timesheets, leave and internal tools",
      icon: Briefcase,
      color: "#a855f7",
      url: "/employee-portal",
      status: "coming-soon" as const,
    },
    {
      id: "client-portal",
      name: "Client Portal",
      description: "Secure portal for client documents",
      icon: UserCheck,
      color: "#10b981",
      url: "/client-portal",
      status: "active" as const,
    },
    // Admin panel - only for admin users
    ...(userRole === "admin"
      ? [
          {
            id: "admin",
            name: "Admin Panel",
            description: "System administration and user management",
            icon: Shield,
            color: "#f97316",
            url: "/admin",
            status: "active" as const,
          },
        ]
      : []),
    {
      id: "bookkeeping",
      name: "Bookkeeping Hub",
      description: "Making Tax Digital compliant bookkeeping",
      icon: BookOpen,
      color: "#f59e0b",
      url: "/bookkeeping-hub",
      status: "coming-soon" as const,
    },
    {
      id: "accounts",
      name: "Accounts Hub",
      description: "Year-end accounts and financial reporting",
      icon: FileText,
      color: "#06b6d4",
      url: "/accounts-hub",
      status: "coming-soon" as const,
    },
    {
      id: "payroll",
      name: "Payroll Hub",
      description: "Process client payroll and RTI submissions",
      icon: DollarSign,
      color: "#84cc16",
      url: "/payroll-app",
      status: "coming-soon" as const,
    },
    {
      id: "placeholder",
      name: "",
      description: "",
      icon: Users,
      color: "transparent",
      url: "#",
      status: "placeholder" as const,
    },
  ];

  const usefulLinks = [
    {
      category: "Tax Resources",
      links: [
        {
          name: "HMRC Online",
          url: "https://www.gov.uk/government/organisations/hm-revenue-customs",
        },
        {
          name: "Companies House",
          url: "https://www.gov.uk/government/organisations/companies-house",
        },
        { name: "Tax Calculator", url: "https://www.gov.uk/estimate-income-tax" },
      ],
    },
    {
      category: "Professional Tools",
      links: [
        { name: "Xero", url: "https://www.xero.com" },
        { name: "QuickBooks", url: "https://quickbooks.intuit.com" },
        { name: "Sage", url: "https://www.sage.com" },
      ],
    },
  ];

  const handleAppClick = (app: (typeof practiceHubApps)[0]) => {
    if (app.status === "active") {
      window.location.href = app.url;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Welcome to Practice Hub, {displayName}!
        </h1>
        <p className="mt-2 text-slate-700 dark:text-slate-300 text-base">
          Access all your essential tools and resources from one central
          location.
        </p>
      </div>

      {/* Navigation Tabs */}
      <NavigationTabs showFavorites={false}>
        {/* Practice Hub Tab */}
        <TabsContent value="practice-hub" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {practiceHubApps.map((app) => {
              if (app.status === "placeholder") {
                return <div key={app.id} className="hidden lg:block" />;
              }
              return (
                <AppCard
                  key={app.id}
                  title={app.name}
                  description={app.description}
                  icon={app.icon}
                  color={app.color}
                  status={app.status}
                  onClick={() => handleAppClick(app)}
                />
              );
            })}
          </div>
        </TabsContent>

        {/* Favorites Tab (when implemented) */}
        <TabsContent value="favorites" className="mt-0">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center shadow-sm">
            <p className="text-slate-700 dark:text-slate-300">
              No favorites yet. Star your most used apps for quick access.
            </p>
          </div>
        </TabsContent>

        {/* Useful Links Tab */}
        <TabsContent value="useful-links" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {usefulLinks.map((category) => (
              <Card key={category.category} className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-slate-100">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.links.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {link.name}
                    </a>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </NavigationTabs>
    </div>
  );
}