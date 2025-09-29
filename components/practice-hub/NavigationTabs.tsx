"use client";

import { Grid3x3, Link, Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface NavigationTabsProps {
  defaultValue?: string;
  showFavorites?: boolean;
  children?: React.ReactNode;
  onTabChange?: (value: string) => void;
}

export function NavigationTabs({
  defaultValue = "practice-hub",
  showFavorites = false,
  children,
  onTabChange,
}: NavigationTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue}
      className="w-full"
      onValueChange={onTabChange}
    >
      <TabsList className="glass-subtle mb-8 h-14 w-full justify-center border p-1.5">
        {showFavorites && (
          <TabsTrigger
            value="favorites"
            className={cn(
              "flex items-center gap-2 px-6 rounded-md font-medium",
              "data-[state=active]:bg-primary",
              "data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
              "text-muted-foreground hover:text-card-foreground hover:bg-muted",
              "transition-all duration-200",
            )}
          >
            <Star className="h-4 w-4" />
            Favorites
          </TabsTrigger>
        )}
        <TabsTrigger
          value="practice-hub"
          className={cn(
            "flex items-center gap-2 px-6 rounded-md font-medium",
            "data-[state=active]:bg-primary",
            "data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
            "text-muted-foreground hover:text-card-foreground hover:bg-muted",
            "transition-all duration-200",
          )}
        >
          <Grid3x3 className="h-4 w-4" />
          Practice Hub
        </TabsTrigger>
        <TabsTrigger
          value="useful-links"
          className={cn(
            "flex items-center gap-2 px-6 rounded-md font-medium",
            "data-[state=active]:bg-primary",
            "data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
            "text-muted-foreground hover:text-card-foreground hover:bg-muted",
            "transition-all duration-200",
          )}
        >
          <Link className="h-4 w-4" />
          Useful Links
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
