"use client";

import * as Sentry from "@sentry/nextjs";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bug,
  CheckCircle,
  Clock,
  Lightbulb,
  MessageSquare,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FeedbackDetailDialog } from "./feedback-detail-dialog";

interface Feedback {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  userRole: string | null;
  type: string;
  title: string;
  description: string;
  category: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  consoleLogs: string | null;
  screenshot: string | null;
  status: string | null;
  priority: string | null;
  assignedTo: string | null;
  adminNotes: string | null;
  resolution: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackManagementClientProps {
  initialFeedback: Feedback[];
  stats: {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
  };
  currentUserId: string;
}

export function FeedbackManagementClient({
  initialFeedback,
  stats: initialStats,
  currentUserId: _currentUserId,
}: FeedbackManagementClientProps) {
  const [feedbackItems, setFeedbackItems] =
    useState<Feedback[]>(initialFeedback);
  const [stats, setStats] = useState(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null,
  );

  // Sorting state
  const [sortBy, setSortBy] = useState<
    "type" | "title" | "userEmail" | "status" | "priority" | "createdAt" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter and sort feedback based on search, filters, and sorting
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackItems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.userEmail.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: string | number | Date | null = a[sortBy];
        let bVal: string | number | Date | null = b[sortBy];

        // Handle null values
        if (aVal === null) aVal = "";
        if (bVal === null) bVal = "";

        // Handle dates
        if (sortBy === "createdAt") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        // Perform comparison
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [feedbackItems, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  const getSortIcon = (
    column: typeof sortBy extends null ? never : typeof sortBy,
  ) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  const handleSort = (
    column: typeof sortBy extends null ? never : typeof sortBy,
  ) => {
    if (sortBy !== column) {
      setSortBy(column);
      setSortOrder(column === "createdAt" ? "desc" : "asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortBy(null);
      setSortOrder("asc");
    }
  };

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update feedback");
      }

      const { feedback: updatedFeedback } = await response.json();

      // Update local state
      setFeedbackItems((items) =>
        items.map((item) => (item.id === feedbackId ? updatedFeedback : item)),
      );

      // Update stats
      const oldItem = feedbackItems.find((f) => f.id === feedbackId);
      if (oldItem) {
        const newStats = { ...stats };
        // Decrement old status
        if (oldItem.status === "new") newStats.new--;
        else if (oldItem.status === "in_progress") newStats.inProgress--;
        else if (oldItem.status === "resolved") newStats.resolved--;
        // Increment new status
        if (newStatus === "new") newStats.new++;
        else if (newStatus === "in_progress") newStats.inProgress++;
        else if (newStatus === "resolved") newStats.resolved++;
        setStats(newStats);
      }

      toast.success("Feedback status updated");
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: "update_feedback_status",
          component: "FeedbackManagementClient",
        },
        extra: { feedbackId, newStatus },
      });
      toast.error("Failed to update feedback");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "issue":
        return <Bug className="h-4 w-4" />;
      case "feature_request":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) status = "new";

    const statusConfig: Record<
      string,
      {
        icon: React.JSX.Element;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      new: {
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
        variant: "default",
      },
      in_progress: {
        icon: <Clock className="h-3 w-3 mr-1" />,
        variant: "secondary",
      },
      resolved: {
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        variant: "outline",
      },
    };

    const config = statusConfig[status] || statusConfig.new;

    return (
      <Badge variant={config.variant}>
        {config.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;

    const priorityConfig: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      low: "outline",
      medium: "secondary",
      high: "default",
      critical: "destructive",
    };

    return (
      <Badge variant={priorityConfig[priority] || "outline"}>{priority}</Badge>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-card-foreground">
          Feedback & Issues
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage user feedback, bug reports, and feature requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Feedback</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>New</CardDescription>
            <CardTitle className="text-2xl">{stats.new}</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl">{stats.inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="h-4 w-4 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-2xl">{stats.resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Feedback Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">All Feedback</h3>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issue">Issues</SelectItem>
                <SelectItem value="feature_request">Features</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("type")}
                  >
                    Type
                    {getSortIcon("type")}
                  </Button>
                </TableHead>
                <TableHead className="max-w-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("title")}
                  >
                    Title
                    {getSortIcon("title")}
                  </Button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("userEmail")}
                  >
                    User
                    {getSortIcon("userEmail")}
                  </Button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("priority")}
                  >
                    Priority
                    {getSortIcon("priority")}
                  </Button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-8 px-2 font-semibold"
                    onClick={() => handleSort("createdAt")}
                  >
                    Date
                    {getSortIcon("createdAt")}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <TableCell className="whitespace-nowrap">
                    <span className="text-muted-foreground">
                      {getTypeIcon(item.type)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="min-w-0">
                      <div className="font-medium break-words">
                        {item.title}
                      </div>
                      <div className="text-sm text-muted-foreground break-words">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm">
                      <div>{item.userName || "Unknown"}</div>
                      <div className="text-muted-foreground">
                        {item.userEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {getPriorityBadge(item.priority)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedFeedback(item);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredFeedback.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No feedback found
          </div>
        )}
      </div>

      {/* Feedback Detail Dialog */}
      {selectedFeedback && (
        <FeedbackDetailDialog
          feedback={selectedFeedback}
          isOpen={!!selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
