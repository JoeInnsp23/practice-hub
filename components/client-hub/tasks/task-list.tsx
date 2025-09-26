"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "review" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  targetDate?: Date;
  assignee?: { name: string };
  reviewer?: { name: string };
  client: string;
  estimatedHours?: number;
  tags?: string[];
  progress?: number;
  workflowInstance?: any;
}

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isLoading?: boolean;
  selectedTaskIds?: string[];
  onBulkSelect?: (taskIds: string[]) => void;
}

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  isLoading,
  selectedTaskIds = [],
  onBulkSelect,
}: TaskListProps) {
  const router = useRouter();
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedTaskIds);

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

  const getStatusBadge = (status: Task["status"]) => {
    const statusConfig = {
      pending: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
      in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      review: { label: "Review", className: "bg-amber-100 text-amber-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      blocked: { label: "Blocked", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status];
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    const priorityConfig = {
      urgent: { label: "Urgent", className: "bg-red-100 text-red-800 border-red-300" },
      high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-300" },
      medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      low: { label: "Low", className: "bg-blue-100 text-blue-800 border-blue-300" },
    };
    const config = priorityConfig[priority];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const isOverdue = (date: Date) => {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  const formatDueDate = (date: Date) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;
    return dueDate.toLocaleDateString();
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox
              checked={localSelectedIds.length === tasks.length && tasks.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </TableHead>
          <TableHead>Task</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Progress</TableHead>
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
            <TableCell className="no-row-click" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={localSelectedIds.includes(task.id)}
                onCheckedChange={(checked) => handleSelectTask(task.id, !!checked)}
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
                {task.tags && task.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {task.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>{task.client}</TableCell>
            <TableCell>{getStatusBadge(task.status)}</TableCell>
            <TableCell>{getPriorityBadge(task.priority)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {isOverdue(task.dueDate) && (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    isOverdue(task.dueDate) && "text-red-600 font-medium"
                  )}
                >
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {task.assignee ? (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell>
              <div className="w-20">
                <Progress value={task.progress || 0} className="h-2" />
                <span className="text-xs text-muted-foreground">{task.progress || 0}%</span>
              </div>
            </TableCell>
            <TableCell className="text-right no-row-click" onClick={(e) => e.stopPropagation()}>
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
  );
}