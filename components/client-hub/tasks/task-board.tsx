"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status:
    | "pending"
    | "in_progress"
    | "review"
    | "completed"
    | "cancelled"
    | "blocked"
    | "records_received"
    | "queries_sent"
    | "queries_received";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignee?: {
    name: string;
    avatar?: string;
  };
  client?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  workflowInstance?: {
    name?: string;
  };
}

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

const columns = [
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
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
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
                          draggable
                          onDragStart={() => handleDragStart(task)}
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
