"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TaskListProps {
  assignedToId?: string;
  clientId?: string;
  showAddButton?: boolean;
  onAddTask?: () => void;
}

// Group tasks by due date
const groupTasksByDueDate = (
  tasks: Array<{
    id: string;
    title: string;
    status: string | null;
    priority: string | null;
    dueDate: string | Date | null;
    targetDate: string | Date | null;
    assignee?: { name: string };
  }>,
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const grouped = {
    overdue: [] as typeof tasks,
    today: [] as typeof tasks,
    tomorrow: [] as typeof tasks,
    thisWeek: [] as typeof tasks,
    later: [] as typeof tasks,
    noDate: [] as typeof tasks,
  };

  for (const task of tasks) {
    // Skip completed tasks
    if (task.status === "completed" || task.status === "cancelled") {
      continue;
    }

    const dueDate = task.dueDate || task.targetDate;
    if (!dueDate) {
      grouped.noDate.push(task);
      continue;
    }

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    if (due < today) {
      grouped.overdue.push(task);
    } else if (due.getTime() === today.getTime()) {
      grouped.today.push(task);
    } else if (due.getTime() === tomorrow.getTime()) {
      grouped.tomorrow.push(task);
    } else if (due < nextWeek) {
      grouped.thisWeek.push(task);
    } else {
      grouped.later.push(task);
    }
  }

  return grouped;
};

// Get priority color
const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case "urgent":
      return "text-red-600 dark:text-red-400";
    case "high":
      return "text-orange-600 dark:text-orange-400";
    case "medium":
      return "text-blue-600 dark:text-blue-400";
    case "low":
      return "text-slate-600 dark:text-slate-400";
    default:
      return "text-muted-foreground";
  }
};

export function TaskList({
  assignedToId,
  clientId,
  showAddButton = true,
  onAddTask,
}: TaskListProps) {
  const utils = trpc.useUtils();

  // Fetch tasks
  const { data, isLoading } = trpc.tasks.list.useQuery({
    assigneeId: assignedToId,
    clientId,
  });

  const tasks = data?.tasks || [];

  // Update task status mutation
  const updateTaskStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task");
    },
  });

  const toggleTaskStatus = (taskId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTaskStatus.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  const grouped = groupTasksByDueDate(tasks);
  const totalActiveTasks =
    grouped.overdue.length +
    grouped.today.length +
    grouped.tomorrow.length +
    grouped.thisWeek.length +
    grouped.later.length +
    grouped.noDate.length;

  // Task group component
  const TaskGroup = ({
    title,
    tasks,
    icon: Icon,
    iconColor,
  }: {
    title: string;
    tasks: typeof grouped.overdue;
    icon: React.ElementType;
    iconColor: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          <Badge variant="secondary" className="ml-auto">
            {tasks.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id, task.status)}
                  className="flex-shrink-0 mt-0.5"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p
                      className={`text-sm font-medium line-clamp-2 ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.priority && (
                      <Badge
                        variant="outline"
                        className={getPriorityColor(task.priority)}
                      >
                        {task.priority}
                      </Badge>
                    )}
                  </div>

                  {/* Task Meta */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{task.assignee.name}</span>
                      </div>
                    )}
                    {(task.dueDate || task.targetDate) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(
                            task.dueDate || task.targetDate || "",
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {showAddButton && onAddTask && (
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-foreground">Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {totalActiveTasks} active task{totalActiveTasks !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      {/* Task Groups */}
      {totalActiveTasks === 0 ? (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold mb-1">No active tasks</h3>
              <p className="text-sm text-muted-foreground">
                All tasks are completed or no tasks exist
              </p>
            </div>
            {showAddButton && onAddTask && (
              <Button size="sm" variant="outline" onClick={onAddTask}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Task
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <TaskGroup
            title="Overdue"
            tasks={grouped.overdue}
            icon={AlertTriangle}
            iconColor="text-red-600 dark:text-red-400"
          />
          <TaskGroup
            title="Today"
            tasks={grouped.today}
            icon={Clock}
            iconColor="text-orange-600 dark:text-orange-400"
          />
          <TaskGroup
            title="Tomorrow"
            tasks={grouped.tomorrow}
            icon={Calendar}
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <TaskGroup
            title="This Week"
            tasks={grouped.thisWeek}
            icon={Calendar}
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <TaskGroup
            title="Later"
            tasks={grouped.later}
            icon={Calendar}
            iconColor="text-slate-600 dark:text-slate-400"
          />
          <TaskGroup
            title="No Due Date"
            tasks={grouped.noDate}
            icon={Circle}
            iconColor="text-muted-foreground"
          />
        </div>
      )}
    </div>
  );
}
