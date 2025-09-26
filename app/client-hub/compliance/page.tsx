"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComplianceCalendar } from "@/components/client-hub/compliance/compliance-calendar";
import { ComplianceList } from "@/components/client-hub/compliance/compliance-list";
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  List,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

// Mock compliance data
const mockComplianceItems = [
  {
    id: "1",
    title: "VAT Return Submission",
    client: "ABC Company Ltd",
    type: "VAT",
    dueDate: new Date("2024-09-30"),
    status: "in_progress" as const,
    priority: "high" as const,
    assignee: "John Smith",
    notes: "Q4 VAT return",
  },
  {
    id: "2",
    title: "Annual Accounts Filing",
    client: "XYZ Ltd",
    type: "Accounts",
    dueDate: new Date("2024-10-15"),
    status: "pending" as const,
    priority: "urgent" as const,
    assignee: "Jane Wilson",
    notes: "Year-end accounts submission",
  },
  {
    id: "3",
    title: "Corporation Tax Return",
    client: "Tech Innovations Ltd",
    type: "Tax",
    dueDate: new Date("2024-09-25"),
    status: "overdue" as const,
    priority: "urgent" as const,
    assignee: "Alice Brown",
    notes: "CT600 submission",
  },
  {
    id: "4",
    title: "PAYE Monthly Submission",
    client: "Multiple",
    type: "PAYE",
    dueDate: new Date("2024-10-19"),
    status: "pending" as const,
    priority: "medium" as const,
    assignee: "Bob Johnson",
    notes: "Monthly RTI submission",
  },
  {
    id: "5",
    title: "Confirmation Statement",
    client: "Small Business Co",
    type: "Company House",
    dueDate: new Date("2024-10-30"),
    status: "pending" as const,
    priority: "low" as const,
    notes: "Annual confirmation",
  },
  {
    id: "6",
    title: "Self Assessment Tax Return",
    client: "John Doe",
    type: "Personal Tax",
    dueDate: new Date("2025-01-31"),
    status: "pending" as const,
    priority: "medium" as const,
    assignee: "John Smith",
    notes: "2023/24 tax year",
  },
  {
    id: "7",
    title: "P11D Forms Submission",
    client: "ABC Company Ltd",
    type: "Benefits",
    dueDate: new Date("2024-07-06"),
    status: "completed" as const,
    priority: "high" as const,
    assignee: "Jane Wilson",
    completedDate: new Date("2024-07-05"),
    notes: "Employee benefits reporting",
  },
  {
    id: "8",
    title: "CIS Monthly Return",
    client: "Construction Corp",
    type: "CIS",
    dueDate: new Date("2024-10-19"),
    status: "pending" as const,
    priority: "medium" as const,
    assignee: "Alice Brown",
    notes: "Construction Industry Scheme return",
  },
];

export default function CompliancePage() {
  const [items, setItems] = useState(mockComplianceItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  // Get unique types
  const types = useMemo(() => {
    const uniqueTypes = [...new Set(items.map(item => item.type))];
    return uniqueTypes.sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    return filtered.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [items, searchTerm, statusFilter, typeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const overdue = items.filter((item) =>
      item.status !== "completed" && item.dueDate < now
    );

    const upcoming = items.filter((item) => {
      if (item.status === "completed") return false;
      const daysUntil = Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    const inProgress = items.filter((item) => item.status === "in_progress");
    const completed = items.filter((item) => item.status === "completed");

    // Calculate completion rate for last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentCompleted = completed.filter(
      (item) => item.completedDate && item.completedDate >= thirtyDaysAgo
    );
    const recentDue = items.filter(
      (item) => item.dueDate >= thirtyDaysAgo && item.dueDate <= now
    );
    const completionRate = recentDue.length > 0
      ? Math.round((recentCompleted.length / recentDue.length) * 100)
      : 0;

    return {
      overdue: overdue.length,
      upcoming: upcoming.length,
      inProgress: inProgress.length,
      completionRate,
    };
  }, [items]);

  const handleEditItem = (item: any) => {
    toast.success(`Editing ${item.title}`);
  };

  const handleDeleteItem = (item: any) => {
    if (window.confirm(`Delete compliance item "${item.title}"?`)) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Item deleted");
    }
  };

  const handleStatusChange = (item: any, status: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: status as any,
              completedDate: status === "completed" ? new Date() : undefined,
            }
          : i
      )
    );
    toast.success("Status updated");
  };

  const handleCompleteItem = (item: any) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    handleStatusChange(item, newStatus);
  };

  const handleItemClick = (item: any) => {
    toast.success(`Viewing ${item.title}`);
  };

  const handleAddItem = () => {
    toast.success("Add new compliance item");
  };

  // Update overdue status
  const updatedItems = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return filteredItems.map((item) => {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Compliance Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
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
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
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
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Compliance Items</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
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
        </CardHeader>
        <CardContent>
          {viewMode === "list" ? (
            <ComplianceList
              items={updatedItems}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onStatusChange={handleStatusChange}
              onComplete={handleCompleteItem}
            />
          ) : (
            <ComplianceCalendar
              items={updatedItems}
              onItemClick={handleItemClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}