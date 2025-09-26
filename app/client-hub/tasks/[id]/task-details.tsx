"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Play,
  CheckCheck,
  Edit,
  Archive,
  Trash2,
  Plus,
  FileText,
  Timer,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface TaskDetailsProps {
  taskId: string;
}

// Enhanced mock data - in production this would come from the database
const mockTasksWithDetails = [
  {
    id: "1",
    title: "Complete VAT return for ABC Company",
    description: "Q4 VAT return submission - Ensure all receipts are collected and calculations are verified before submission.",
    status: "in_progress" as const,
    priority: "high" as const,
    task_type: "compliance",
    dueDate: new Date("2024-09-30"),
    targetDate: new Date("2024-09-28"),
    assignee: { id: "u1", name: "John Smith", email: "john@example.com" },
    reviewer: { id: "u2", name: "Jane Wilson", email: "jane@example.com" },
    client: { id: "c1", name: "ABC Company Ltd", code: "ABC001" },
    service: { id: "s1", name: "VAT Services" },
    estimatedHours: 3,
    actualHours: 1.5,
    progress: 65,
    tags: ["VAT", "Q4", "Compliance"],
    createdAt: new Date("2024-09-01"),
    updatedAt: new Date("2024-09-26"),
    notes: [
      { id: "n1", content: "Client provided additional receipts", author: "John Smith", createdAt: new Date("2024-09-25") },
      { id: "n2", content: "Need to clarify expense categorization", author: "Jane Wilson", createdAt: new Date("2024-09-26") }
    ],
    timeEntries: [
      { id: "te1", date: new Date("2024-09-25"), hours: 1.0, description: "Initial data collection", user: "John Smith" },
      { id: "te2", date: new Date("2024-09-26"), hours: 0.5, description: "Receipt review", user: "John Smith" }
    ],
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
            estimated_hours: 1,
            checklist_items: [
              { id: "item1", text: "Collect sales invoices", completed: true, completedBy: "John Smith", completedAt: new Date("2024-09-25") },
              { id: "item2", text: "Collect purchase invoices", completed: true, completedBy: "John Smith", completedAt: new Date("2024-09-25") },
              { id: "item3", text: "Review expense receipts", completed: false },
              { id: "item4", text: "Verify bank statements", completed: false },
            ],
          },
          {
            id: "stage2",
            name: "Calculation & Verification",
            description: "Calculate VAT amounts and verify accuracy",
            stage_order: 2,
            is_required: true,
            estimated_hours: 1,
            checklist_items: [
              { id: "item5", text: "Calculate output VAT", completed: true, completedBy: "John Smith", completedAt: new Date("2024-09-26") },
              { id: "item6", text: "Calculate input VAT", completed: false },
              { id: "item7", text: "Reconcile with accounts", completed: false },
              { id: "item8", text: "Cross-check calculations", completed: false },
            ],
          },
          {
            id: "stage3",
            name: "Review & Submission",
            description: "Final review and submit to HMRC",
            stage_order: 3,
            is_required: true,
            estimated_hours: 1,
            checklist_items: [
              { id: "item9", text: "Manager review", completed: false },
              { id: "item10", text: "Client approval", completed: false },
              { id: "item11", text: "Submit to HMRC", completed: false },
              { id: "item12", text: "File documentation", completed: false },
            ],
          },
        ],
      },
    },
  },
  // Add other tasks here for completeness
];

export default function TaskDetails({ taskId }: TaskDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [task, setTask] = useState(() =>
    mockTasksWithDetails.find((t) => t.id === taskId) || mockTasksWithDetails[0]
  );

  // Calculate progress based on checklist
  const calculateProgress = useCallback(() => {
    if (!task.workflowInstance) return task.progress || 0;

    const allItems = task.workflowInstance.template.stages.flatMap(stage => stage.checklist_items);
    const completedItems = allItems.filter(item => item.completed);

    return Math.round((completedItems.length / allItems.length) * 100);
  }, [task]);

  const currentProgress = useMemo(() => calculateProgress(), [calculateProgress]);

  // Toggle stage expansion
  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  // Handle checklist item toggle
  const handleChecklistToggle = (stageId: string, itemId: string) => {
    setTask((prevTask) => {
      if (!prevTask.workflowInstance) return prevTask;

      const newTask = { ...prevTask };
      const stages = newTask.workflowInstance.template.stages;

      stages.forEach((stage) => {
        if (stage.id === stageId) {
          stage.checklist_items.forEach((item) => {
            if (item.id === itemId) {
              item.completed = !item.completed;
              if (item.completed) {
                item.completedBy = "Current User";
                item.completedAt = new Date();
              } else {
                delete item.completedBy;
                delete item.completedAt;
              }
            }
          });
        }
      });

      // Update overall progress
      const allItems = stages.flatMap(s => s.checklist_items);
      const completedItems = allItems.filter(i => i.completed);
      newTask.progress = Math.round((completedItems.length / allItems.length) * 100);

      return newTask;
    });

    toast.success("Checklist updated");
  };

  // Handle status update
  const handleStatusUpdate = (newStatus: string) => {
    setTask((prev) => ({ ...prev, status: newStatus as any }));
    toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
  };

  // Get status badge config
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Not Started", className: "bg-gray-100 text-gray-800" },
      in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-800" },
      review: { label: "Review", className: "bg-amber-100 text-amber-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      blocked: { label: "Blocked", className: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="secondary" className={config?.className}>
        {config?.label || status}
      </Badge>
    );
  };

  // Get priority badge config
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      urgent: { label: "Urgent", className: "bg-red-100 text-red-800 border-red-300" },
      high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-300" },
      medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      low: { label: "Low", className: "bg-blue-100 text-blue-800 border-blue-300" },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge variant="outline" className={config?.className}>
        {config?.label || priority}
      </Badge>
    );
  };

  // Calculate days until dates
  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate stage progress
  const getStageProgress = (stage: any) => {
    const completedItems = stage.checklist_items.filter((item: any) => item.completed).length;
    return Math.round((completedItems / stage.checklist_items.length) * 100);
  };

  if (!task) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The task you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/client-hub/tasks")}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntil(task.dueDate);
  const daysUntilTarget = task.targetDate ? getDaysUntil(task.targetDate) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/client-hub/tasks")}
          className="hover:text-foreground p-0 h-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Tasks
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-md">{task.title}</span>
      </div>

      {/* Header Card */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-2xl mb-2">{task.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {task.client.name}
                </span>
                {task.service && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {task.service.name}
                  </span>
                )}
                <span className="text-xs">ID: {task.id}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Target Date */}
            {task.targetDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Target Date</p>
                <div className="flex items-center gap-2">
                  <AlertCircle className={cn(
                    "h-4 w-4",
                    daysUntilTarget && daysUntilTarget < 0 ? "text-amber-600" : "text-amber-500"
                  )} />
                  <div>
                    <span className={cn(
                      daysUntilTarget && daysUntilTarget < 0 && "text-amber-600 font-medium"
                    )}>
                      {task.targetDate.toLocaleDateString()}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {daysUntilTarget === 0 ? "Today" :
                       daysUntilTarget === 1 ? "Tomorrow" :
                       daysUntilTarget && daysUntilTarget > 0 ? `${daysUntilTarget} days` :
                       daysUntilTarget && daysUntilTarget < 0 ? `${Math.abs(daysUntilTarget)} days past` : ""}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Due Date</p>
              <div className="flex items-center gap-2">
                <Calendar className={cn(
                  "h-4 w-4",
                  daysUntilDue < 0 ? "text-red-600" : "text-red-500"
                )} />
                <div>
                  <span className={cn(
                    daysUntilDue < 0 && "text-red-600 font-medium"
                  )}>
                    {task.dueDate.toLocaleDateString()}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {daysUntilDue === 0 ? "Today" :
                     daysUntilDue === 1 ? "Tomorrow" :
                     daysUntilDue > 0 ? `${daysUntilDue} days` :
                     `${Math.abs(daysUntilDue)} days overdue`}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="space-y-1">
                <Progress value={currentProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">{currentProgress}% Complete</p>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Time Tracking</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <span>{task.actualHours || 0} / {task.estimatedHours} hours</span>
                  <div className="text-xs text-muted-foreground">
                    {((task.actualHours || 0) / task.estimatedHours * 100).toFixed(0)}% time used
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Preparer</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span>{task.assignee?.name || "Unassigned"}</span>
                {!task.assignee && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Needs Assignment
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Reviewer</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span>{task.reviewer?.name || "Unassigned"}</span>
                {!task.reviewer && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Needs Assignment
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
              <p className="text-foreground">{task.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            {task.status === "pending" && (
              <Button
                onClick={() => handleStatusUpdate("in_progress")}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Task
              </Button>
            )}
            {task.status === "in_progress" && (
              <Button
                onClick={() => handleStatusUpdate("review")}
                variant="outline"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Ready for Review
              </Button>
            )}
            {task.status === "review" && (
              <Button
                onClick={() => handleStatusUpdate("completed")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            <Button variant="outline">
              <Timer className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-12 w-full bg-slate-100 dark:bg-slate-800 p-1 grid grid-cols-4">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="checklist"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Checklist
          </TabsTrigger>
          <TabsTrigger
            value="time"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Time Tracking
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900"
          >
            Notes & History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Task Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Details</label>
                    <div className="mt-1">
                      <div className="font-medium">{task.client.name}</div>
                      <div className="text-sm text-muted-foreground">Code: {task.client.code}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Information</label>
                    <div className="mt-1">
                      <div>{task.service?.name || "No service"}</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tags</label>
                    <div className="mt-1 flex gap-2">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Task Details</label>
                    <div className="mt-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created:</span>
                        <span className="text-sm">
                          {task.createdAt.toLocaleDateString()} {task.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">
                          {task.updatedAt.toLocaleDateString()} {task.updatedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Task Type:</span>
                        <span className="text-sm capitalize">
                          {task.task_type || "General"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          {task.workflowInstance ? (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Workflow Checklist</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.workflowInstance.name} - {currentProgress}% Complete
                    </p>
                  </div>
                  <Progress value={currentProgress} className="w-32 h-2" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {task.workflowInstance.template.stages.map((stage) => {
                      const stageProgress = getStageProgress(stage);
                      const isExpanded = expandedStages.has(stage.id);

                      return (
                        <Card key={stage.id} className="glass-card">
                          <CardHeader
                            className="cursor-pointer"
                            onClick={() => toggleStage(stage.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <div>
                                  <h4 className="font-medium">{stage.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {stage.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={stageProgress === 100 ? "default" : "secondary"}>
                                  {stageProgress}%
                                </Badge>
                                {stage.is_required && (
                                  <Badge variant="outline">Required</Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent>
                              <div className="space-y-3">
                                {stage.checklist_items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={item.completed}
                                      onCheckedChange={() => handleChecklistToggle(stage.id, item.id)}
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <p className={cn(
                                        "text-sm",
                                        item.completed && "line-through text-muted-foreground"
                                      )}>
                                        {item.text}
                                      </p>
                                      {item.completed && item.completedBy && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Completed by {item.completedBy} on{" "}
                                          {item.completedAt?.toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Workflow Assigned</h3>
                  <p className="text-muted-foreground mb-4">
                    This task doesn't have a workflow checklist assigned.
                  </p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Time Entries</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {task.timeEntries && task.timeEntries.length > 0 ? (
                <div className="space-y-3">
                  {task.timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.user} • {entry.date.toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{entry.hours}h</Badge>
                    </div>
                  ))}
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Time</span>
                      <span className="font-medium">
                        {task.actualHours || 0} / {task.estimatedHours} hours
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No time entries yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Notes & Activity</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {task.notes && task.notes.length > 0 ? (
                <div className="space-y-4">
                  {task.notes.map((note) => (
                    <div key={note.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{note.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {note.createdAt.toLocaleDateString()} at {note.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notes yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}