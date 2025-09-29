"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryManagement } from "./category-management";
import { LinkManagement } from "./link-management";
import { Globe, FolderOpen, Link } from "lucide-react";

export function PortalLinksClient() {
  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950/20 rounded-lg">
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-card-foreground">
              Portal Links Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage categories and links for the Practice Hub portal
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="links">
          <LinkManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}