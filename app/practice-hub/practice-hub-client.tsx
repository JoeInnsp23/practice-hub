"use client";

import {
  Briefcase,
  Building,
  Calculator,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  type LucideIcon,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { getIconComponent } from "@/app/admin-hub/portal-links/icon-utils";
import { trpc as api } from "@/app/providers/trpc-provider";
import { ClientOnly } from "@/components/client-only";
import { AnnouncementsPanel } from "@/components/practice-hub/announcements-panel";
import { NavigationTabs } from "@/components/practice-hub/NavigationTabs";
import { NeedHelpCard } from "@/components/practice-hub/need-help-card";
import { PendingApprovalsWidget } from "@/components/practice-hub/pending-approvals-widget";
import { UrgentTasksWidget } from "@/components/practice-hub/urgent-tasks-widget";
import { Card } from "@/components/ui/card";
import { CardInteractive } from "@/components/ui/card-interactive";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { HUB_COLORS, type HubName } from "@/lib/utils/hub-colors";

// Static hub modules configuration (excluding Practice Hub itself since we're already on it)
const PRACTICE_HUB_MODULES: Array<{
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  hubKey: HubName;
  status: "active" | "coming-soon";
}> = [
  {
    name: "Client Hub",
    description: "Manage clients, contacts, and relationships",
    url: "/client-hub",
    icon: Users,
    hubKey: "client-hub",
    status: "active",
  },
  {
    name: "Proposal Hub",
    description: "Create and manage client proposals",
    url: "/proposal-hub",
    icon: FileText,
    hubKey: "proposal-hub",
    status: "active",
  },
  {
    name: "Employee Hub",
    description: "Manage timesheets, leave requests, and TOIL",
    url: "/employee-hub",
    icon: Briefcase,
    hubKey: "employee-hub",
    status: "active",
  },
  {
    name: "Social Hub",
    description: "Practice social features and team collaboration",
    url: "/social-hub",
    icon: Share2,
    hubKey: "social-hub",
    status: "coming-soon",
  },
  {
    name: "Portal Hub",
    description: "Manage external client portal users and access",
    url: "/client-admin",
    icon: Globe,
    hubKey: "portal-hub",
    status: "coming-soon",
  },
  {
    name: "Admin Hub",
    description: "System administration and configuration",
    url: "/admin-hub",
    icon: Settings,
    hubKey: "admin-hub",
    status: "active",
  },
  {
    name: "Bookkeeping Hub",
    description: "Bookkeeping and reconciliation (coming soon)",
    url: "/bookkeeping",
    icon: Calculator,
    hubKey: "bookkeeping-hub",
    status: "coming-soon",
  },
  {
    name: "Accounts Hub",
    description: "Annual accounts preparation (coming soon)",
    url: "/accounts-hub",
    icon: Building,
    hubKey: "accounts-hub",
    status: "coming-soon",
  },
  {
    name: "Payroll Hub",
    description: "Payroll processing and RTI (coming soon)",
    url: "/payroll",
    icon: DollarSign,
    hubKey: "payroll-hub",
    status: "coming-soon",
  },
];

interface PracticeHubClientProps {
  userRole?: string;
  userName?: string;
}

export function PracticeHubClient({
  userRole,
  userName,
}: PracticeHubClientProps) {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Use passed userName or fall back to session user data
  const displayName = userName || session?.user?.name?.split(" ")[0] || "User";

  // Get user role from props or session
  const currentUserRole = userRole || session?.user?.role;

  // Filter modules based on user role - only show Admin Hub to admins
  const visibleModules = PRACTICE_HUB_MODULES.filter((module) => {
    if (module.hubKey === "admin-hub") {
      return currentUserRole === "admin";
    }
    return true;
  });

  // Fetch portal data for external links only
  const { data: categoriesWithLinks, isLoading } =
    api.portal.getCategoriesWithLinks.useQuery();

  // Get all external links (non-Practice Hub categories)
  const externalCategories =
    categoriesWithLinks?.filter(
      (cat) => cat.name !== "Practice Hub" && cat.links.length > 0,
    ) || [];

  // Filter links by selected category
  const filteredExternalLinks =
    selectedCategory === "all"
      ? externalCategories
      : externalCategories.filter((cat) => cat.id === selectedCategory);

  const handleAppClick = (app: (typeof visibleModules)[0]) => {
    if (app.status === "active") {
      window.location.href = app.url;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading portal data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section - Full Width */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-card-foreground">
          Welcome to Practice Hub, {displayName}!
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Access all your essential tools and resources from one central
          location.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Navigation Tabs */}
          <ClientOnly>
            <NavigationTabs showFavorites={false}>
              {/* Practice Hub Tab */}
              <TabsContent value="practice-hub" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleModules.map((module, index) => {
                    const IconComponent = module.icon;
                    const isComingSoon = module.status === "coming-soon";
                    const moduleColor = HUB_COLORS[module.hubKey];

                    return (
                      <CardInteractive
                        key={module.hubKey}
                        moduleColor={moduleColor}
                        onClick={
                          !isComingSoon
                            ? () => handleAppClick(module)
                            : undefined
                        }
                        ariaLabel={
                          !isComingSoon
                            ? `Navigate to ${module.name}`
                            : `${module.name} (Coming Soon)`
                        }
                        className="animate-lift-in rounded-xl p-6"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: 0,
                        }}
                      >
                        {/* Icon Container */}
                        <div
                          className="mb-4 inline-flex rounded-xl p-3 shadow-md transition-all duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${moduleColor}, ${moduleColor}dd)`,
                          }}
                        >
                          <IconComponent className="h-6 w-6 text-white transition-transform duration-300" />
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                          {module.name}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {module.description}
                        </p>

                        {/* Coming Soon Badge */}
                        {isComingSoon && (
                          <span className="absolute right-4 top-4 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                            Coming Soon
                          </span>
                        )}
                      </CardInteractive>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Favorites Tab (when implemented) */}
              <TabsContent value="favorites" className="mt-0">
                <CardInteractive
                  moduleColor={HUB_COLORS["practice-hub"]}
                  className="rounded-xl p-8 text-center"
                >
                  <p className="text-muted-foreground">
                    No favorites yet. Star your most used apps for quick access.
                  </p>
                </CardInteractive>
              </TabsContent>

              {/* Useful Links Tab */}
              <TabsContent value="useful-links" className="mt-0">
                {/* Category Filter */}
                <div className="mb-6">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {externalCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.colorHex && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: category.colorHex }}
                              />
                            )}
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Links Display */}
                {filteredExternalLinks.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No external links available in this category.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {filteredExternalLinks.map((category) => (
                      <div key={category.id}>
                        <h3
                          className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 pb-2 border-b"
                          style={{
                            borderColor: category.colorHex || "#e5e5e5",
                          }}
                        >
                          {category.name}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {category.links.map((link) => {
                            const LinkIcon = link.iconName
                              ? getIconComponent(link.iconName) || ExternalLink
                              : ExternalLink;

                            return (
                              <CardInteractive
                                key={link.id}
                                moduleColor={
                                  category.colorHex ||
                                  HUB_COLORS["practice-hub"]
                                }
                                onClick={() => {
                                  if (link.targetBlank) {
                                    window.open(
                                      link.url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  } else {
                                    window.location.href = link.url;
                                  }
                                }}
                                ariaLabel={`Navigate to ${link.title}${!link.isInternal ? " (external link)" : ""}`}
                                className="rounded-xl p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className="p-3 rounded-lg flex-shrink-0 shadow-md"
                                    style={{
                                      backgroundColor: `${category.colorHex}20`,
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: category.colorHex || "#000000",
                                      }}
                                    >
                                      <LinkIcon className="h-5 w-5" />
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-card-foreground flex items-center gap-1">
                                      {link.title}
                                      {!link.isInternal && (
                                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      )}
                                    </h4>
                                    {link.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {link.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardInteractive>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </NavigationTabs>
          </ClientOnly>
        </div>

        {/* Right Column - Widgets (1/3 width) */}
        <div className="space-y-6">
          {/* Urgent Tasks Widget */}
          <UrgentTasksWidget />

          {/* Announcements Panel */}
          <AnnouncementsPanel limit={5} />

          {/* Pending Approvals Widget (for managers/admins) */}
          <PendingApprovalsWidget />

          {/* Need Help Card */}
          <NeedHelpCard />
        </div>
      </div>
    </div>
  );
}
