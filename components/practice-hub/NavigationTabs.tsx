"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Grid3x3, Link } from "lucide-react";
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
      <TabsList className="mb-8 h-14 w-full justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 shadow-sm">
        {showFavorites && (
          <TabsTrigger
            value="favorites"
            className={cn(
              "flex items-center gap-2 px-6 rounded-md font-medium",
              "data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-500",
              "data-[state=active]:text-white data-[state=active]:shadow-sm",
              "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700",
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
            "data-[state=active]:bg-blue-600",
            "data-[state=active]:text-white data-[state=active]:shadow-sm",
            "text-slate-700 hover:text-slate-900 hover:bg-slate-50",
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
            "data-[state=active]:bg-blue-600",
            "data-[state=active]:text-white data-[state=active]:shadow-sm",
            "text-slate-700 hover:text-slate-900 hover:bg-slate-50",
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
