"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  GitBranch,
  MoreVertical,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";
import type { TaskStatus, TaskSummary } from "./types";

interface TaskCardProps {
  task: TaskSummary;
  onEdit: (task: TaskSummary) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-destructive bg-destructive/10";
      case "high":
        return "border-orange-500 dark:border-orange-400 bg-orange-600/10 dark:bg-orange-400/10";
      case "medium":
        return "border-yellow-500 dark:border-yellow-400 bg-yellow-600/10 dark:bg-yellow-400/10";
      case "low":
        return "border-green-500 dark:border-green-400 bg-green-600/10 dark:bg-green-400/10";
      default:
        return "";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      urgent: {
        label: "Urgent",
        className: "bg-destructive/10 text-destructive",
      },
      high: {
        label: "High",
        className:
          "bg-orange-600/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-400",
      },
      medium: {
        label: "Medium",
        className:
          "bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400",
      },
      low: {
        label: "Low",
        className:
          "bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
      },
    };

    const priorityConfig = config[priority];
    if (!priorityConfig) {
      return <Badge variant="secondary">{priority}</Badge>;
    }
    return (
      <Badge variant="secondary" className={cn(priorityConfig.className)}>
        {priorityConfig.label}
      </Badge>
    );
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  return (
    <Card
      className={cn(
        "cursor-move hover:shadow-md transition-shadow",
        task.priority ? getPriorityColor(task.priority) : "",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            {task.clientName && (
              <p className="text-xs text-muted-foreground mt-1">
                {task.clientName}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onStatusChange(task.id, "completed")}
              >
                Mark Complete
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {task.priority && getPriorityBadge(task.priority)}
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        </div>

        {Array.isArray(task.tags) && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {task.workflowName && (
          <div className="flex items-center gap-1 mb-3">
            <GitBranch className="h-3 w-3 text-blue-600" />
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {task.workflowName}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(task.dueDate)}</span>
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedHours}h</span>
              </div>
            )}
          </div>
          {task.assigneeName && (
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {task.assigneeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
