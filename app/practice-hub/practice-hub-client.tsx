"use client";

import { useUser } from "@clerk/nextjs";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { getIconComponent } from "@/app/admin/portal-links/icon-utils";
import { ClientOnly } from "@/components/client-only";
import { AppCard } from "@/components/practice-hub/AppCard";
import { NavigationTabs } from "@/components/practice-hub/NavigationTabs";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { api } from "@/lib/trpc/client";

interface PracticeHubClientProps {
  userRole?: string;
  userName?: string;
}

export function PracticeHubClient({
  userRole: _userRole,
  userName,
}: PracticeHubClientProps) {
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Use passed userName or fall back to Clerk user data
  const displayName = userName || user?.firstName || "User";

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
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
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
      <div className="glass-card rounded-xl p-8">
        <h1 className="text-3xl font-bold text-card-foreground">
          Welcome to Practice Hub, {displayName}!
        </h1>
        <p className="mt-2 text-muted-foreground text-base">
          Access all your essential tools and resources from one central
          location.
        </p>
      </div>

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
                practiceHubApps.map((app) => (
                  <AppCard
                    key={app.id}
                    title={app.name}
                    description={app.description}
                    icon={app.icon}
                    color={app.color}
                    status={app.status}
                    onClick={() => handleAppClick(app)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Favorites Tab (when implemented) */}
          <TabsContent value="favorites" className="mt-0">
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">
                No favorites yet. Star your most used apps for quick access.
              </p>
            </div>
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
                          <a
                            key={link.id}
                            href={link.url}
                            target={link.targetBlank ? "_blank" : undefined}
                            rel={
                              link.targetBlank
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="block"
                          >
                            <div className="glass-card group relative overflow-hidden transition-all duration-300 rounded-xl hover:shadow-xl hover:-translate-y-1 cursor-pointer">
                              <div className="relative p-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="p-3 rounded-lg flex-shrink-0 shadow-md transition-all duration-300 group-hover:shadow-lg"
                                    style={{
                                      backgroundColor: `${category.colorHex}20`,
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: category.colorHex || "#000000",
                                      }}
                                    >
                                      <LinkIcon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
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
                              </div>

                              {/* Glass Hover Tint Overlay */}
                              <div
                                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                                style={{
                                  background: `linear-gradient(135deg, ${category.colorHex}15, ${category.colorHex}25)`,
                                }}
                              />

                              {/* Bottom Highlight Line */}
                              <div
                                className="absolute bottom-0 left-0 h-1 w-full transform scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                                style={{
                                  background: `linear-gradient(90deg, ${category.colorHex}, ${category.colorHex}66)`,
                                }}
                              />
                            </div>
                          </a>
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
