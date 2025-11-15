"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  Filter,
  List,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { ComplianceCalendar } from "@/components/client-hub/compliance/compliance-calendar";
import type { ComplianceItem } from "@/components/client-hub/compliance/compliance-list";
import { ComplianceList } from "@/components/client-hub/compliance/compliance-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

export default function CompliancePage() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in_progress" | "completed" | "overdue"
  >("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch compliance items using tRPC
  const { data: complianceData } = trpc.compliance.list.useQuery({
    search: debouncedSearchTerm || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as "pending" | "in_progress" | "completed" | "overdue")
        : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const items = (complianceData?.compliance || []) as ComplianceItem[];

  // Get unique types
  const types = useMemo(() => {
    const uniqueTypes = [
      ...new Set(items.map((item: ComplianceItem) => item.type)),
    ];
    return uniqueTypes.sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(
        (item: ComplianceItem) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (item: ComplianceItem) => item.status === statusFilter,
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (item: ComplianceItem) => item.type === typeFilter,
      );
    }

    return filtered.sort((a: ComplianceItem, b: ComplianceItem) => {
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      return aDate.getTime() - bDate.getTime();
    });
  }, [items, searchTerm, statusFilter, typeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const overdue = items.filter((item: ComplianceItem) => {
      const itemDate = new Date(item.dueDate);
      return item.status !== "completed" && itemDate < now;
    });

    const upcoming = items.filter((item: ComplianceItem) => {
      if (item.status === "completed") return false;
      const itemDate = new Date(item.dueDate);
      const daysUntil = Math.ceil(
        (itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntil >= 0 && daysUntil <= 7;
    });

    const inProgress = items.filter(
      (item: ComplianceItem) => item.status === "in_progress",
    );
    const completed = items.filter(
      (item: ComplianceItem) => item.status === "completed",
    );

    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentCompleted = completed.filter((item: ComplianceItem) => {
      if (!item.completedDate) return false;
      const completedDate = new Date(item.completedDate);
      return completedDate >= thirtyDaysAgo;
    });
    const recentDue = items.filter((item: ComplianceItem) => {
      const dueDate = new Date(item.dueDate);
      return dueDate >= thirtyDaysAgo && dueDate <= now;
    });
    const completionRate =
      recentDue.length > 0
        ? Math.round((recentCompleted.length / recentDue.length) * 100)
        : 0;

    return {
      overdue: overdue.length,
      upcoming: upcoming.length,
      inProgress: inProgress.length,
      completionRate,
    };
  }, [items]);

  // tRPC mutations
  const deleteMutation = trpc.compliance.delete.useMutation({
    onSuccess: () => {
      toast.success("Item deleted");
      utils.compliance.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete item");
    },
  });

  const updateStatusMutation = trpc.compliance.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.compliance.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const handleEditItem = (item: ComplianceItem) => {
    toast.success(`Editing ${item.title}`);
  };

  const handleDeleteItem = (item: ComplianceItem) => {
    if (window.confirm(`Delete compliance item "${item.title}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleStatusChange = (item: ComplianceItem, status: string) => {
    updateStatusMutation.mutate({
      id: item.id,
      status: status as "pending" | "in_progress" | "completed" | "overdue",
    });
  };

  const handleCompleteItem = (item: ComplianceItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    handleStatusChange(item, newStatus);
  };

  const handleItemClick = (item: ComplianceItem) => {
    toast.success(`Viewing ${item.title}`);
  };

  const handleAddItem = () => {
    toast.success("Add new compliance item");
  };

  // Update overdue status
  const updatedItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return filteredItems.map((item: ComplianceItem) => {
      if (item.status === "completed") return item;

      const dueDate = new Date(item.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < now && item.status !== "overdue") {
        return { ...item, status: "overdue" as const };
      }
      return item;
    });
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Compliance Tracking
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage compliance deadlines and requirements
          </p>
        </div>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Compliance Items</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as typeof statusFilter)
                }
              >
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "calendar" | "list")}
              >
                <TabsList>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="calendar">
                    <Calendar className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {viewMode === "list" ? (
            <ComplianceList
              items={updatedItems}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onStatusChange={handleStatusChange}
              onComplete={handleCompleteItem}
            />
          ) : (
            <div className="p-6">
              <ComplianceCalendar
                items={updatedItems}
                onItemClick={handleItemClick}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
