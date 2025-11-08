"use client";

import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  GitBranch,
  MoreHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskSummary } from "./types";

interface TaskListProps {
  tasks: TaskSummary[];
  onEdit: (task: TaskSummary) => void;
  onDelete: (taskId: string) => void;
  isLoading?: boolean;
  selectedTaskIds?: string[];
  onBulkSelect?: (taskIds: string[]) => void;
  sortBy:
    | "title"
    | "clientName"
    | "status"
    | "priority"
    | "dueDate"
    | "assigneeName"
    | "progress"
    | null;
  sortOrder: "asc" | "desc";
  onSort: (
    column:
      | "title"
      | "clientName"
      | "status"
      | "priority"
      | "dueDate"
      | "assigneeName"
      | "progress",
  ) => void;
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  isLoading,
  selectedTaskIds = [],
  onBulkSelect,
  sortBy,
  sortOrder,
  onSort,
}: TaskListProps) {
  const router = useRouter();
  const [localSelectedIds, setLocalSelectedIds] =
    useState<string[]>(selectedTaskIds);

  const handleSelectAll = (checked: boolean) => {
    const newSelection = checked ? tasks.map((t) => t.id) : [];
    setLocalSelectedIds(newSelection);
    onBulkSelect?.(newSelection);
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelection = checked
      ? [...localSelectedIds, taskId]
      : localSelectedIds.filter((id) => id !== taskId);
    setLocalSelectedIds(newSelection);
    onBulkSelect?.(newSelection);
  };

  const getSortIcon = (
    column:
      | "title"
      | "clientName"
      | "status"
      | "priority"
      | "dueDate"
      | "assigneeName"
      | "progress",
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

  const getStatusBadge = (status: TaskStatus | null | undefined) => {
    if (!status) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
      in_progress: {
        label: "In Progress",
        className: "bg-blue-100 text-blue-800",
      },
      review: { label: "Review", className: "bg-purple-100 text-purple-800" },
      queries_sent: {
        label: "Queries Sent",
        className: "bg-orange-100 text-orange-800",
      },
      queries_received: {
        label: "Queries Received",
        className: "bg-amber-100 text-amber-800",
      },
      records_received: {
        label: "Records Received",
        className: "bg-indigo-100 text-indigo-800",
      },
      blocked: { label: "Blocked", className: "bg-red-100 text-red-800" },
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-800",
      },
      cancelled: { label: "Cancelled", className: "bg-gray-200 text-gray-700" },
    };

    const config = statusConfig[status];
    if (!config) {
      return <Badge variant="secondary">{status}</Badge>;
    }

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: TaskSummary["priority"]) => {
    if (!priority) {
      return <Badge variant="secondary">Unknown</Badge>;
    }

    const priorityConfig: Record<string, { label: string; className: string }> =
      {
        critical: {
          label: "Critical",
          className: "bg-red-100 text-red-800 border-red-300",
        },
        urgent: {
          label: "Urgent",
          className: "bg-red-100 text-red-800 border-red-300",
        },
        high: {
          label: "High",
          className: "bg-orange-100 text-orange-800 border-orange-300",
        },
        medium: {
          label: "Medium",
          className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        },
        low: {
          label: "Low",
          className: "bg-blue-100 text-blue-800 border-blue-300",
        },
      };

    const config = priorityConfig[priority];
    if (!config) {
      return <Badge variant="secondary">{priority}</Badge>;
    }

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (date: Date | string) => {
    return (
      new Date(date) < new Date() &&
      new Date(date).toDateString() !== new Date().toDateString()
    );
  };

  const formatDueDate = (date: Date | string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;
    return format(dueDate, "dd/MM/yyyy");
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="glass-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  localSelectedIds.length === tasks.length && tasks.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("title")}
              >
                Task
                {getSortIcon("title")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("clientName")}
              >
                Client
                {getSortIcon("clientName")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("status")}
              >
                Status
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("priority")}
              >
                Priority
                {getSortIcon("priority")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("dueDate")}
              >
                Due Date
                {getSortIcon("dueDate")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("assigneeName")}
              >
                Assignee
                {getSortIcon("assigneeName")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2 font-semibold hover:bg-blue-200 dark:hover:bg-blue-500/40"
                onClick={() => onSort("progress")}
              >
                Progress
                {getSortIcon("progress")}
              </Button>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => {
                // Don't navigate if clicking checkbox or actions
                if (
                  !(e.target as HTMLElement).closest(".no-row-click") &&
                  !(e.target as HTMLElement).closest("button")
                ) {
                  router.push(`/client-hub/tasks/${task.id}`);
                }
              }}
            >
              <TableCell
                className="no-row-click"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={localSelectedIds.includes(task.id)}
                  onCheckedChange={(checked) =>
                    handleSelectTask(task.id, !!checked)
                  }
                />
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {Array.isArray(task.tags) && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {task.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {task.workflowName && (
                    <div className="flex items-center gap-1 mt-1">
                      <GitBranch className="h-3 w-3 text-blue-600" />
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {task.workflowName}
                      </Badge>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{task.clientName || "—"}</TableCell>
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>{getPriorityBadge(task.priority)}</TableCell>
              <TableCell>
                {task.dueDate ? (
                  <div className="flex items-center gap-1">
                    {isOverdue(task.dueDate) && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        isOverdue(task.dueDate) && "text-red-600 font-medium",
                      )}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {task.assigneeName ? (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{task.assigneeName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="w-20">
                  <Progress value={task.progress || 0} className="h-2" />
                  <span className="text-xs text-muted-foreground">
                    {task.progress || 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell
                className="text-right no-row-click"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/client-hub/tasks/${task.id}`);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!task.workflowName && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            // In production, this would open the workflow assignment modal
                            console.log("Assign workflow to task:", task.id);
                          }}
                        >
                          <GitBranch className="mr-2 h-4 w-4" />
                          Assign Workflow
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem>
                      <Clock className="mr-2 h-4 w-4" />
                      Log Time
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
