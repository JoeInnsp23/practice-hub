"use client";

import * as Sentry from "@sentry/nextjs";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  Clock,
  LayoutGrid,
  List,
  Maximize2,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { DataExportButton } from "@/components/client-hub/data-export-button";
import { DataImportModal } from "@/components/client-hub/data-import-modal";
import { BulkActionBar } from "@/components/client-hub/tasks/bulk-action-bar";
import { TaskBoard } from "@/components/client-hub/tasks/task-board";
import { TaskList } from "@/components/client-hub/tasks/task-list";
import { TaskModal } from "@/components/client-hub/tasks/task-modal";
import type {
  TaskFormPayload,
  TaskStatus,
  TaskSummary,
} from "@/components/client-hub/tasks/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/lib/hooks/use-debounce";

export default function TasksPage() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSummary | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Sorting state (null = default ordering)
  const [sortBy, setSortBy] = useState<
    | "title"
    | "clientName"
    | "status"
    | "priority"
    | "dueDate"
    | "assigneeName"
    | "progress"
    | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch tasks using tRPC
  const { data: tasksData } = trpc.tasks.list.useQuery({
    search: debouncedSearchTerm || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    assigneeId: assigneeFilter !== "all" ? assigneeFilter : undefined,
    sortBy: sortBy ?? undefined,
    sortOrder,
  });

  const tasks: TaskSummary[] = (tasksData?.tasks as TaskSummary[]) || [];

  // Filter tasks based on search and filters
  const filteredTasks: TaskSummary[] = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Assignee filter
      if (assigneeFilter !== "all" && task.assigneeName !== assigneeFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  // Get unique assignees for filter
  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => t.assigneeName).filter(Boolean)),
  );

  // Task statistics
  const taskStats = [
    {
      title: "Total Tasks",
      value: tasks.length.toString(),
      icon: CheckSquare,
    },
    {
      title: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length.toString(),
      icon: Clock,
    },
    {
      title: "Due This Week",
      value: tasks
        .filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate >= today && dueDate <= nextWeek;
        })
        .length.toString(),
      icon: Calendar,
    },
    {
      title: "Overdue",
      value: tasks
        .filter(
          (t) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "completed",
        )
        .length.toString(),
      icon: AlertTriangle,
    },
  ];

  const handleBulkSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleEditTask = (task: TaskSummary) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task cancelled successfully");
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "delete_task" },
        extra: { errorMessage: error.message },
      });
      toast.error("Failed to delete task");
    },
  });

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (
      task &&
      window.confirm(`Are you sure you want to delete "${task.title}"?`)
    ) {
      deleteMutation.mutate(taskId);
    }
  };

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      setIsModalOpen(false);
      setEditingTask(null);
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "create_task" },
        extra: { errorMessage: error.message },
      });
      toast.error(error.message || "Failed to save task");
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      setIsModalOpen(false);
      setEditingTask(null);
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "update_task" },
        extra: { taskId: editingTask?.id, errorMessage: error.message },
      });
      toast.error(error.message || "Failed to save task");
    },
  });

  const handleSaveTask = async (data: TaskFormPayload) => {
    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        data: data as Record<string, unknown>,
      });
    } else {
      // Ensure required fields are present - must have title
      if (!data.title) {
        return;
      }
      const taskData: Record<string, unknown> = {
        ...data,
        title: data.title,
        createdById: data.createdById,
      };
      createMutation.mutate(
        taskData as Parameters<typeof createMutation.mutate>[0],
      );
    }
  };

  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task status updated");
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "update_task_status" },
        extra: { errorMessage: error.message },
      });
      toast.error("Failed to update task status");
    },
  });

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    updateStatusMutation.mutate({
      id: taskId,
      status,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage all your tasks and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <DataExportButton data={filteredTasks} filename="tasks" />
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            data-testid="task-create-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStats.map((stat) => (
          <KPIWidget
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Content */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">All Tasks</h3>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "board" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("board")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              {viewMode === "board" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreenOpen(true)}
                  title="Fullscreen Kanban View"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {uniqueAssignees.map((assignee) => (
                  <SelectItem key={assignee} value={assignee || ""}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {/* Bulk Actions */}
          {selectedTaskIds.length > 0 && viewMode === "list" && (
            <BulkActionBar
              selectedTaskIds={selectedTaskIds}
              onClearSelection={handleClearSelection}
              onSuccess={() => utils.tasks.list.invalidate()}
            />
          )}

          {/* Task View */}
          {viewMode === "board" ? (
            <div className="p-6">
              <TaskBoard
                tasks={filteredTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              selectedTaskIds={selectedTaskIds}
              onBulkSelect={handleBulkSelect}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={(column) => {
                if (sortBy !== column) {
                  setSortBy(column);
                  setSortOrder(column === "dueDate" ? "asc" : "asc");
                } else if (sortOrder === "asc") {
                  setSortOrder("desc");
                } else {
                  setSortBy(null);
                  setSortOrder("asc");
                }
              }}
            />
          )}
        </div>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />

      {/* Import Modal */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        endpoint="/api/import/tasks"
        templateEndpoint="/api/import/template?type=tasks&example=true"
        entityName="Tasks"
        onSuccess={() => utils.tasks.list.invalidate()}
      />

      {/* Fullscreen Kanban Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent
          className="max-w-none w-screen h-screen m-0 p-0 rounded-none border-0"
          showCloseButton={true}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-2xl font-bold">
              Tasks - Kanban View
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 h-[calc(100vh-80px)] overflow-hidden">
            <TaskBoard
              tasks={filteredTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
