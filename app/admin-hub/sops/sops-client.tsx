"use client";

import { AlertCircle, FileText, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SopsTable from "./sops-table";

export default function SopsClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Fetch SOPs
  const {
    data: sopsData,
    isLoading: sopsLoading,
    error: sopsError,
  } = trpc.sops.list.useQuery({
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "draft" | "published" | "archived"),
    categoryId: categoryFilter === "all" ? undefined : categoryFilter,
    search: searchQuery || undefined,
  });

  // Fetch categories for filter dropdown
  const { data: categoriesData } = trpc.sops.listCategories.useQuery();

  // Fetch stats
  const { data: statsData } = trpc.sops.getStats.useQuery();

  // Filter SOPs by search query (client-side)
  const filteredSops = useMemo(() => {
    if (!sopsData?.sops) return [];
    return sopsData.sops.filter((sop) => {
      const matchesSearch =
        sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sop.categoryName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [sopsData?.sops, searchQuery]);

  const handleCreate = () => {
    router.push("/admin-hub/sops/create");
  };

  const handleEdit = (sopId: string) => {
    router.push(`/admin-hub/sops/${sopId}/edit`);
  };

  const handleView = (sopId: string) => {
    router.push(`/admin-hub/sops/${sopId}`);
  };

  if (sopsError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load SOPs: {sopsError.message}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOP Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Standard Operating Procedures and training materials
          </p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create SOP
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total SOPs</p>
              <p className="text-2xl font-bold">{statsData?.total ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{statsData?.draft ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{statsData?.published ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Archived</p>
              <p className="text-2xl font-bold">{statsData?.archived ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 glass-card">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search SOPs by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-48">
              <Label htmlFor="status-filter" className="sr-only">
                Status Filter
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 md:w-48">
              <Label htmlFor="category-filter" className="sr-only">
                Category Filter
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesData?.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* SOPs Table */}
      <SopsTable
        sops={filteredSops}
        isLoading={sopsLoading}
        onEdit={handleEdit}
        onView={handleView}
      />
    </div>
  );
}
