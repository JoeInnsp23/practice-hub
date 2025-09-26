"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskBoard } from "@/components/practice-hub/tasks/task-board";
import { TaskModal } from "@/components/practice-hub/tasks/task-modal";
import { KPIWidget } from "@/components/practice-hub/dashboard/kpi-widget";
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

// Mock data
const mockTasks = [
  {
    id: "1",
    title: "Complete VAT return for ABC Company",
    description: "Q4 VAT return submission",
    status: "in_progress" as const,
    priority: "high" as const,
    dueDate: new Date("2024-09-30"),
    assignee: { name: "John Smith" },
    client: "ABC Company Ltd",
    estimatedHours: 3,
    tags: ["VAT", "Q4"],
  },
  {
    id: "2",
    title: "Prepare annual accounts",
    description: "Year-end accounts preparation for XYZ Ltd",
    status: "pending" as const,
    priority: "urgent" as const,
    dueDate: new Date("2024-09-28"),
    assignee: { name: "Jane Wilson" },
    client: "XYZ Ltd",
    estimatedHours: 8,
    tags: ["Accounts", "Year-End"],
  },
  {
    id: "3",
    title: "Client meeting - Tax planning",
    description: "Discuss tax planning strategies",
    status: "pending" as const,
    priority: "medium" as const,
    dueDate: new Date("2024-10-05"),
    assignee: { name: "Bob Johnson" },
    client: "John Doe",
    estimatedHours: 1.5,
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
    tags: ["Bookkeeping", "Monthly"],
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;

    return tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  // Calculate KPIs
  const kpis = [
    {
      title: "Total Tasks",
      value: tasks.length.toString(),
      icon: CheckSquare,
      iconColor: "text-blue-600",
    },
    {
      title: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length.toString(),
      icon: Clock,
      iconColor: "text-orange-600",
    },
    {
      title: "Due This Week",
      value: tasks.filter((t) => {
        if (!t.dueDate) return false;
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return t.dueDate <= weekFromNow && t.status !== "completed";
      }).length.toString(),
      icon: Calendar,
      iconColor: "text-purple-600",
    },
    {
      title: "Overdue",
      value: tasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate < new Date() && t.status !== "completed";
      }).length.toString(),
      icon: AlertTriangle,
      iconColor: "text-red-600",
    },
  ];

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (task: any) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task deleted successfully");
    }
  };

  const handleSaveTask = (data: any) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id ? { ...t, ...data, id: t.id } : t
        )
      );
    } else {
      const newTask = {
        ...data,
        id: (tasks.length + 1).toString(),
        tags: data.category ? [data.category] : [],
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleStatusChange = (taskId: string, status: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, status: status as any }
          : task
      )
    );
    toast.success("Task status updated");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tasks
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track and manage all your tasks and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPIWidget
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      {/* Search and View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Task Board</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="board" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="h-4 w-4" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "board" ? (
            <TaskBoard
              tasks={filteredTasks}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              List view coming soon...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}