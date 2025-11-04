"use client";

import {
  AlertCircle,
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

  // Filter feedback based on search and filters
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

    return filtered;
  }, [feedbackItems, searchQuery, statusFilter, typeFilter]);

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
            <MessageSquare className="h-4 w-4 text-orange-500" />
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
            <Clock className="h-4 w-4 text-orange-500" />
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
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedback.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <TableCell>
                    <span className="text-muted-foreground">
                      {getTypeIcon(item.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-sm">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{item.userName || "Unknown"}</div>
                      <div className="text-muted-foreground">
                        {item.userEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
