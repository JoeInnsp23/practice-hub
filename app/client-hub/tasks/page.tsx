"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/client-hub/tasks/task-board";
import { TaskList } from "@/components/client-hub/tasks/task-list";
import { TaskModal } from "@/components/client-hub/tasks/task-modal";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Search,
  LayoutGrid,
  List,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { DataExportButton } from "@/components/client-hub/data-export-button";
import { DataImportModal } from "@/components/client-hub/data-import-modal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (priorityFilter !== "all") params.append("priority", priorityFilter);
        if (assigneeFilter !== "all") params.append("assigneeId", assigneeFilter);

        const response = await fetch(`/api/tasks?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        } else {
          console.error("Failed to fetch tasks");
          toast.error("Failed to load tasks");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [debouncedSearchTerm, statusFilter, priorityFilter, assigneeFilter, refreshKey]);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (
        searchTerm &&
        !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !task.client?.toLowerCase().includes(searchTerm.toLowerCase()) &&
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
      if (
        assigneeFilter !== "all" &&
        task.assignee?.name !== assigneeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  // Get unique assignees for filter
  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => t.assignee?.name).filter(Boolean))
  );

  // Task statistics
  const taskStats = [
    {
      title: "Total Tasks",
      value: tasks.length.toString(),
      icon: CheckSquare,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "In Progress",
      value: tasks
        .filter((t) => t.status === "in_progress")
        .length.toString(),
      icon: Clock,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Due This Week",
      value: tasks
        .filter((t) => {
          const dueDate = new Date(t.dueDate);
          const today = new Date();
          const nextWeek = new Date(
            today.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          return dueDate >= today && dueDate <= nextWeek;
        })
        .length.toString(),
      icon: Calendar,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Overdue",
      value: tasks
        .filter((t) => new Date(t.dueDate) < new Date() && t.status !== "completed")
        .length.toString(),
      icon: AlertTriangle,
      change: "",
      changeType: "negative" as const,
    },
  ];

  const handleBulkSelect = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Task cancelled successfully");
          setRefreshKey((prev) => prev + 1);
        } else {
          toast.error("Failed to delete task");
        }
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  const handleSaveTask = async (data: any) => {
    try {
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : "/api/tasks";
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(
          editingTask
            ? "Task updated successfully"
            : "Task created successfully"
        );
        setIsModalOpen(false);
        setEditingTask(null);
        setRefreshKey((prev) => prev + 1);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save task");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success("Task status updated");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
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
          <DataExportButton
            endpoint="/api/export/tasks"
            filename="tasks"
            filters={{
              status: statusFilter,
              priority: priorityFilter,
              assigneeId: assigneeFilter === "all" ? undefined : assigneeFilter,
            }}
          />
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStats.map((stat, index) => (
          <KPIWidget
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>All Tasks</CardTitle>
            <div className="flex items-center gap-2">
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
              </div>
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
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedTaskIds.length > 0 && viewMode === "list" && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedTaskIds.length} task{selectedTaskIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Bulk Update Status
                </Button>
                <Button size="sm" variant="outline">
                  Bulk Assign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Task View */}
          {viewMode === "board" ? (
            <TaskBoard
              tasks={filteredTasks}
              onEditTask={handleEditTask}
              onDeleteTask={(task) => handleDeleteTask(task.id)}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              selectedTaskIds={selectedTaskIds}
              onBulkSelect={handleBulkSelect}
            />
          )}
        </CardContent>
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
        templateEndpoint="/api/import/tasks"
        entityName="Tasks"
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}