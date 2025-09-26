"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

// Enhanced mock data with workflow instances
const mockTasks = [
  {
    id: "1",
    title: "Complete VAT return for ABC Company",
    description: "Q4 VAT return submission",
    status: "in_progress" as const,
    priority: "high" as const,
    dueDate: new Date("2024-09-30"),
    targetDate: new Date("2024-09-28"),
    assignee: { name: "John Smith" },
    reviewer: { name: "Jane Wilson" },
    client: "ABC Company Ltd",
    estimatedHours: 3,
    progress: 65,
    tags: ["VAT", "Q4"],
    workflowInstance: {
      id: "wf1",
      name: "VAT Return Workflow",
      status: "active",
      template: {
        name: "Standard VAT Return",
        stages: [
          {
            id: "stage1",
            name: "Data Collection",
            description: "Gather all VAT records",
            stage_order: 1,
            is_required: true,
            checklist_items: [
              { id: "item1", text: "Collect sales invoices", completed: true },
              { id: "item2", text: "Collect purchase invoices", completed: true },
              { id: "item3", text: "Review expense receipts", completed: false },
            ],
          },
          {
            id: "stage2",
            name: "Calculation",
            description: "Calculate VAT amounts",
            stage_order: 2,
            is_required: true,
            checklist_items: [
              { id: "item4", text: "Calculate output VAT", completed: true },
              { id: "item5", text: "Calculate input VAT", completed: false },
              { id: "item6", text: "Reconcile with accounts", completed: false },
            ],
          },
        ],
      },
    },
  },
  {
    id: "2",
    title: "Prepare annual accounts",
    description: "Year-end accounts preparation for XYZ Ltd",
    status: "pending" as const,
    priority: "urgent" as const,
    dueDate: new Date("2024-09-28"),
    targetDate: new Date("2024-09-26"),
    assignee: { name: "Jane Wilson" },
    client: "XYZ Ltd",
    estimatedHours: 8,
    progress: 0,
    tags: ["Accounts", "Year-End"],
  },
  {
    id: "3",
    title: "Client meeting - Tax planning",
    description: "Discuss tax planning strategies",
    status: "review" as const,
    priority: "medium" as const,
    dueDate: new Date("2024-10-05"),
    assignee: { name: "Bob Johnson" },
    reviewer: { name: "Alice Brown" },
    client: "John Doe",
    estimatedHours: 1.5,
    progress: 85,
    tags: ["Meeting", "Tax"],
  },
  {
    id: "4",
    title: "Submit CT600 return",
    description: "Corporation tax return submission",
    status: "completed" as const,
    priority: "high" as const,
    dueDate: new Date("2024-09-25"),
    assignee: { name: "Alice Brown" },
    client: "Tech Innovations Ltd",
    estimatedHours: 4,
    progress: 100,
    tags: ["Tax", "CT600"],
  },
  {
    id: "5",
    title: "Bookkeeping for September",
    description: "Monthly bookkeeping tasks",
    status: "in_progress" as const,
    priority: "low" as const,
    dueDate: new Date("2024-10-10"),
    assignee: { name: "John Smith" },
    client: "Small Business Co",
    estimatedHours: 5,
    progress: 40,
    tags: ["Bookkeeping", "Monthly"],
  },
  {
    id: "6",
    title: "Payroll Processing - October",
    description: "Process monthly payroll for all clients",
    status: "blocked" as const,
    priority: "high" as const,
    dueDate: new Date("2024-10-01"),
    targetDate: new Date("2024-09-30"),
    assignee: { name: "Jane Wilson" },
    client: "Multiple Clients",
    estimatedHours: 6,
    progress: 20,
    tags: ["Payroll", "Monthly"],
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

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

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted successfully");
    }
  };

  const handleSaveTask = (data: any) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...data } : t
        )
      );
      toast.success("Task updated successfully");
    } else {
      const newTask = {
        ...data,
        id: Date.now().toString(),
        status: "pending" as const,
        progress: 0,
      };
      setTasks((prev) => [...prev, newTask]);
      toast.success("Task created successfully");
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleStatusChange = (taskId: string, status: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: status as any } : task
      )
    );
    toast.success("Task status updated");
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
    </div>
  );
}