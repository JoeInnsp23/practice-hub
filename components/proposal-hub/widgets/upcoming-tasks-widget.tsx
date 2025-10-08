"use client";

import { format, isAfter, isBefore, isToday, startOfDay } from "date-fns";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Card } from "@/components/ui/card";

export function UpcomingTasksWidget() {
  const utils = trpc.useUtils();

  // Fetch tasks due in next 7 days
  const { data, isLoading } = trpc.tasks.list.useQuery({
    status: "todo",
  });

  // Complete task mutation
  const completeTask = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task completed");
      utils.tasks.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to complete task");
    },
  });

  const tasks = data?.tasks || [];

  // Filter to tasks due in next 7 days
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return (
        isBefore(dueDate, sevenDaysFromNow) || isToday(dueDate)
      );
    })
    .slice(0, 5); // Limit to 5 tasks

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground text-sm">Loading tasks...</div>
        </div>
      </Card>
    );
  }

  if (upcomingTasks.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle2 className="h-12 w-12 text-green-500/50" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              No tasks due in the next 7 days
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleComplete = (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    completeTask.mutate({ id: taskId, status: "completed" });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
        <span className="text-xs text-muted-foreground">
          Next 7 days
        </span>
      </div>
      <div className="space-y-2">
        {upcomingTasks.map((task) => {
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          const isOverdue = dueDate && isBefore(dueDate, startOfDay(new Date()));
          const isDueToday = dueDate && isToday(dueDate);

          return (
            <div
              key={task.id}
              className="block hover:bg-accent/50 rounded-lg p-3 transition-colors border"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => handleComplete(task.id, e)}
                  className="mt-0.5 flex-shrink-0"
                  disabled={completeTask.isPending}
                >
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {dueDate && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3" />
                      <span
                        className={`text-xs ${
                          isOverdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : isDueToday
                              ? "text-amber-600 dark:text-amber-400 font-medium"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isOverdue && "Overdue: "}
                        {isDueToday && "Today: "}
                        {format(dueDate, "MMM d")}
                      </span>
                    </div>
                  )}
                </div>
                {task.priority === "high" && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      High
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
