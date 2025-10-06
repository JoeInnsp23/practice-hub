"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import type { TaskStatus, TaskSummary } from "./types";

interface TaskBoardProps {
  tasks: TaskSummary[];
  onEditTask: (task: TaskSummary) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const columns: Array<{ id: TaskStatus; title: string; color: string }> = [
  { id: "pending", title: "To Do", color: "bg-gray-100 dark:bg-gray-800" },
  {
    id: "in_progress",
    title: "In Progress",
    color: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "review",
    title: "Review",
    color: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    id: "queries_sent",
    title: "Queries Sent",
    color: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    id: "queries_received",
    title: "Queries Received",
    color: "bg-amber-100 dark:bg-amber-900/20",
  },
  {
    id: "records_received",
    title: "Records Received",
    color: "bg-indigo-100 dark:bg-indigo-900/20",
  },
  { id: "blocked", title: "Blocked", color: "bg-red-100 dark:bg-red-900/20" },
  {
    id: "completed",
    title: "Completed",
    color: "bg-green-100 dark:bg-green-900/20",
  },
  {
    id: "cancelled",
    title: "Cancelled",
    color: "bg-gray-200 dark:bg-gray-700",
  },
];

export function TaskBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<TaskSummary | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: TaskSummary) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    if (draggedTask) {
      onStatusChange(draggedTask.id, columnId);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max px-1">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isOver = dragOverColumn === column.id;

          return (
            <Card
              key={column.id}
              className={cn(
                "w-80 min-w-[320px] h-full transition-colors",
                isOver && "ring-2 ring-primary ring-opacity-50",
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <CardHeader className={cn(column.color, "rounded-t-lg")}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {column.title}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    {columnTasks.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tasks</p>
                        <p className="text-xs mt-1">Drag tasks here</p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleDragStart(task);
                            }
                          }}
                          className="cursor-move"
                        >
                          <TaskCard
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            onStatusChange={onStatusChange}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
