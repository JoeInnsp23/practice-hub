"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { getIconComponent } from "@/app/admin/portal-links/icon-utils";
import { trpc as api } from "@/app/providers/trpc-provider";
import { ClientOnly } from "@/components/client-only";
import { NavigationTabs } from "@/components/practice-hub/NavigationTabs";
import { PendingApprovalsWidget } from "@/components/practice-hub/pending-approvals-widget";
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
import { HUB_COLORS } from "@/lib/utils/hub-colors";

interface PracticeHubClientProps {
  userRole?: string;
  userName?: string;
}

export function PracticeHubClient({
  userRole: _userRole,
  userName,
}: PracticeHubClientProps) {
  const { data: session } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Use passed userName or fall back to session user data
  const displayName = userName || session?.user?.name?.split(" ")[0] || "User";

  // Fetch portal data
  const { data: categoriesWithLinks, isLoading } =
    api.portal.getCategoriesWithLinks.useQuery();
  const { data: favorites } = api.portal.getUserFavorites.useQuery();
  const toggleFavoriteMutation = api.portal.toggleFavorite.useMutation();

  // Get Practice Hub category and its links
  const practiceHubCategory = categoriesWithLinks?.find(
    (cat) => cat.name === "Practice Hub",
  );

  // Define module-specific colors (preserving original colors)
  const moduleColors: Record<string, string> = {
    "Proposal Hub": "#ec4899", // pink
    "Social Hub": "#8b5cf6", // purple
    "Client Hub": "#3b82f6", // blue
    "Employee Hub": "#10b981", // emerald green
    "Employee Portal": "#a855f7", // purple
    "Client Portal": "#10b981", // green
    "Admin Panel": "#f97316", // orange
    "Bookkeeping Hub": "#f59e0b", // amber
    "Accounts Hub": "#06b6d4", // cyan
    "Payroll Hub": "#84cc16", // lime
  };

  const practiceHubApps =
    practiceHubCategory?.links.map((link) => {
      // Get the appropriate icon
      const IconComponent = link.iconName
        ? getIconComponent(link.iconName) || ExternalLink
        : ExternalLink;

      // Determine status from description
      let status: "active" | "coming-soon" | "placeholder" = "active";
      if (
        link.description?.includes("coming soon") ||
        link.url.includes("/bookkeeping") ||
        link.url.includes("/accounts-hub") ||
        link.url.includes("/payroll") ||
        link.url.includes("/employee-portal")
      ) {
        status = "coming-soon";
      }

      // Use module-specific color or fall back to category color
      const moduleColor =
        moduleColors[link.title] || practiceHubCategory.colorHex || "#ff8609";

      return {
        id: link.id,
        name: link.title,
        description: link.description || "",
        icon: IconComponent,
        color: moduleColor,
        url: link.url,
        status,
        isFavorite:
          favorites?.some((favorite) => favorite.linkId === link.id) || false,
      };
    }) || [];

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

  const handleAppClick = (app: (typeof practiceHubApps)[0]) => {
    if (app.status === "active") {
      window.location.href = app.url;
    }
  };

  const _handleToggleFavorite = async (linkId: string) => {
    try {
      await toggleFavoriteMutation.mutateAsync({ linkId });
    } catch {
      // Silently fail for favorite toggle - non-critical action
      // Error already handled by mutation's onError handler
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
      {/* Welcome Section */}
      <CardInteractive
        moduleColor={HUB_COLORS["practice-hub"]}
        className="rounded-xl p-8 animate-fade-in"
      >
        <h1 className="text-3xl font-bold text-card-foreground">
          Welcome to Practice Hub, {displayName}!
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Access all your essential tools and resources from one central
          location.
        </p>
      </CardInteractive>

      {/* Pending Approvals Widget (for managers/admins) */}
      <PendingApprovalsWidget />

      {/* Navigation Tabs */}
      <ClientOnly>
        <NavigationTabs showFavorites={false}>
          {/* Practice Hub Tab */}
          <TabsContent value="practice-hub" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {practiceHubApps.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">
                    No Practice Hub apps available.
                  </p>
                </Card>
              ) : (
                practiceHubApps.map((app, index) => {
                  const IconComponent = app.icon;
                  const isComingSoon = app.status === "coming-soon";

                  return (
                    <CardInteractive
                      key={app.id}
                      moduleColor={app.color}
                      onClick={
                        !isComingSoon ? () => handleAppClick(app) : undefined
                      }
                      ariaLabel={
                        !isComingSoon
                          ? `Navigate to ${app.name}`
                          : `${app.name} (Coming Soon)`
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
                          background: `linear-gradient(135deg, ${app.color}, ${app.color}dd)`,
                        }}
                      >
                        <IconComponent className="h-6 w-6 text-white transition-transform duration-300" />
                      </div>

                      {/* Title */}
                      <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                        {app.name}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {app.description}
                      </p>

                      {/* Coming Soon Badge */}
                      {isComingSoon && (
                        <span className="absolute right-4 top-4 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                          Coming Soon
                        </span>
                      )}
                    </CardInteractive>
                  );
                })
              )}
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
                      className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 pb-2 border-b"
                      style={{ borderColor: category.colorHex || "#e5e5e5" }}
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
                              category.colorHex || HUB_COLORS["practice-hub"]
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
  );
}
