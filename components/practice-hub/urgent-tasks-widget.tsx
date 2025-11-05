"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UrgentTasksWidget() {
  // Query urgent tasks
  const { data: tasks, isLoading } = trpc.tasks.getTopUrgentTasks.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  // Don't show widget if loading or no tasks
  if (isLoading || !tasks || tasks.length === 0) {
    return null;
  }

  const formatDueDate = (dueDate: Date | null) => {
    if (!dueDate) return "No due date";

    const now = new Date();
    const due = new Date(dueDate);

    // Check if overdue
    if (due < now) {
      return (
        <span className="text-red-600 dark:text-red-400 font-medium">
          Overdue {formatDistanceToNow(due, { addSuffix: false })} ago
        </span>
      );
    }

    // Check if due soon (within 2 days)
    const daysUntilDue = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilDue <= 2) {
      return (
        <span className="text-orange-600 dark:text-orange-400 font-medium">
          Due {formatDistanceToNow(due, { addSuffix: true })}
        </span>
      );
    }

    // Normal due date
    return (
      <span className="text-muted-foreground">
        Due {formatDistanceToNow(due, { addSuffix: true })}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "high") {
      return (
        <Badge
          variant="destructive"
          className="flex items-center gap-1 text-xs h-5 px-1.5"
        >
          <AlertCircle className="h-2.5 w-2.5" />
          High
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card shadow-medium p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Urgent Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} need
              {tasks.length === 1 ? "s" : ""} your attention
            </p>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="text-xs">
          <Link href="/client-hub/tasks">View All Tasks</Link>
        </Button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {/* Task header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {task.title}
                  </h4>
                  {task.clientName && (
                    <p className="text-xs text-muted-foreground">
                      {task.clientName}
                    </p>
                  )}
                </div>
              </div>
              {getPriorityBadge(task.priority)}
            </div>

            {/* Due date */}
            <div className="text-xs pl-5">{formatDueDate(task.dueDate)}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
