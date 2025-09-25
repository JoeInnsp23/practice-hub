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
} from "lucide-react";

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

export default function PracticeHubPage() {
  const { user } = useUser();

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
          Welcome to Practice Hub, {user?.firstName || "User"}!
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
              Your favorite apps will appear here for quick access.
            </p>
          </div>
        </TabsContent>

        {/* Useful Links Tab */}
        <TabsContent value="useful-links" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            {usefulLinks.map((category) => (
              <Card
                key={category.category}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-shadow duration-200"
              >
                <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 transition-colors hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </TabsContent>
      </NavigationTabs>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-shadow duration-200">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Active Users
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            1
          </p>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-shadow duration-200">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Total Clients
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            0
          </p>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-shadow duration-200">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Active Tasks
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            0
          </p>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-slate-900/50 transition-shadow duration-200">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Revenue This Month
          </h3>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            £0
          </p>
        </Card>
      </div>
    </div>
  );
}
