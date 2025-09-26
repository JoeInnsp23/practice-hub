"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { WorkflowInstanceModal } from "@/components/client-hub/workflows/workflow-instance-modal";
import { WorkflowTemplateModal } from "@/components/client-hub/workflows/workflow-template-modal";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Settings,
  Clock,
  AlertCircle,
  User,
  Building2,
  ExternalLink,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Mock data for workflow instances (connected to tasks)
const mockWorkflowInstances = [
  {
    id: "1",
    name: "VAT Return Q4 2024",
    status: "in_progress",
    taskId: "1", // Link to the task
    taskTitle: "Complete VAT return for ABC Company",
    client: { id: "1", name: "ABC Company Ltd" },
    template: { id: "1", name: "Standard VAT Return" },
    checklistItems: [
      { id: "1", status: "completed", progress_percentage: 100 },
      { id: "2", status: "completed", progress_percentage: 100 },
      { id: "3", status: "in_progress", progress_percentage: 60 },
      { id: "4", status: "pending", progress_percentage: 0 },
    ],
    dueDate: new Date("2024-09-30"),
    assignee: "John Smith",
    createdAt: new Date("2024-09-01"),
  },
  {
    id: "2",
    name: "Annual Accounts Preparation",
    status: "in_progress",
    taskId: "2",
    taskTitle: "Prepare annual accounts",
    client: { id: "2", name: "XYZ Ltd" },
    template: { id: "2", name: "Year-End Accounts" },
    checklistItems: [
      { id: "5", status: "completed", progress_percentage: 100 },
      { id: "6", status: "in_progress", progress_percentage: 30 },
      { id: "7", status: "pending", progress_percentage: 0 },
      { id: "8", status: "pending", progress_percentage: 0 },
      { id: "9", status: "pending", progress_percentage: 0 },
    ],
    dueDate: new Date("2024-10-15"),
    assignee: "Jane Wilson",
    createdAt: new Date("2024-09-05"),
  },
  {
    id: "3",
    name: "Payroll Processing October",
    status: "not_started",
    taskId: "6",
    taskTitle: "Payroll Processing - October",
    client: { id: "3", name: "Tech Innovations Ltd" },
    template: { id: "3", name: "Monthly Payroll" },
    checklistItems: [
      { id: "10", status: "pending", progress_percentage: 0 },
      { id: "11", status: "pending", progress_percentage: 0 },
      { id: "12", status: "pending", progress_percentage: 0 },
    ],
    dueDate: new Date("2024-10-01"),
    assignee: "Bob Johnson",
    createdAt: new Date("2024-09-20"),
  },
  {
    id: "4",
    name: "CT600 Submission",
    status: "completed",
    taskId: "4",
    taskTitle: "Submit CT600 return",
    client: { id: "4", name: "Green Solutions Ltd" },
    template: { id: "4", name: "Corporation Tax Return" },
    checklistItems: [
      { id: "13", status: "completed", progress_percentage: 100 },
      { id: "14", status: "completed", progress_percentage: 100 },
      { id: "15", status: "completed", progress_percentage: 100 },
      { id: "16", status: "completed", progress_percentage: 100 },
    ],
    dueDate: new Date("2024-09-15"),
    assignee: "Alice Brown",
    createdAt: new Date("2024-08-15"),
    completedAt: new Date("2024-09-14"),
  },
];

// Mock data for workflow templates
const mockWorkflowTemplates = [
  {
    id: "1",
    name: "Standard VAT Return",
    description: "Complete VAT return submission process including data collection, calculation, and filing",
    service: { name: "VAT Services", code: "VAT" },
    stages: [
      { id: "1", name: "Data Collection", order: 1 },
      { id: "2", name: "Calculation", order: 2 },
      { id: "3", name: "Review", order: 3 },
      { id: "4", name: "Submission", order: 4 },
    ],
    is_active: true,
    estimatedDays: 3,
  },
  {
    id: "2",
    name: "Year-End Accounts",
    description: "Comprehensive year-end accounts preparation including trial balance, adjustments, and financial statements",
    service: { name: "Accounting", code: "ACC" },
    stages: [
      { id: "5", name: "Trial Balance", order: 1 },
      { id: "6", name: "Adjustments", order: 2 },
      { id: "7", name: "Financial Statements", order: 3 },
      { id: "8", name: "Notes", order: 4 },
      { id: "9", name: "Review & Sign-off", order: 5 },
    ],
    is_active: true,
    estimatedDays: 10,
  },
  {
    id: "3",
    name: "Monthly Payroll",
    description: "Process monthly payroll including calculations, submissions, and payslips",
    service: { name: "Payroll", code: "PAY" },
    stages: [
      { id: "10", name: "Data Collection", order: 1 },
      { id: "11", name: "Processing", order: 2 },
      { id: "12", name: "Distribution", order: 3 },
    ],
    is_active: true,
    estimatedDays: 2,
  },
  {
    id: "4",
    name: "Corporation Tax Return",
    description: "Complete CT600 return preparation and submission to HMRC",
    service: { name: "Tax Services", code: "TAX" },
    stages: [
      { id: "13", name: "Data Gathering", order: 1 },
      { id: "14", name: "Computation", order: 2 },
      { id: "15", name: "CT600 Preparation", order: 3 },
      { id: "16", name: "Submission", order: 4 },
    ],
    is_active: true,
    estimatedDays: 5,
  },
  {
    id: "5",
    name: "Management Accounts",
    description: "Monthly management accounts preparation with variance analysis",
    service: { name: "Accounting", code: "ACC" },
    stages: [
      { id: "17", name: "Data Processing", order: 1 },
      { id: "18", name: "Report Generation", order: 2 },
      { id: "19", name: "Analysis", order: 3 },
    ],
    is_active: true,
    estimatedDays: 3,
  },
  {
    id: "6",
    name: "Company Formation",
    description: "New company registration and setup process",
    service: { name: "Company Services", code: "COS" },
    stages: [
      { id: "20", name: "Registration", order: 1 },
      { id: "21", name: "HMRC Setup", order: 2 },
      { id: "22", name: "Bank Setup", order: 3 },
      { id: "23", name: "Documentation", order: 4 },
    ],
    is_active: false,
    estimatedDays: 7,
  },
];

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflowInstances, setWorkflowInstances] = useState(mockWorkflowInstances);
  const [workflowTemplates] = useState(mockWorkflowTemplates);
  const [isInstanceModalOpen, setIsInstanceModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "not_started":
        return <Pause className="h-3 w-3" />;
      case "in_progress":
        return <Play className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Pause className="h-3 w-3" />;
    }
  };

  const calculateProgress = (checklistItems: any[]) => {
    if (!checklistItems || checklistItems.length === 0) return 0;
    const completedItems = checklistItems.filter(
      (item) => item.status === "completed"
    ).length;
    return Math.round((completedItems / checklistItems.length) * 100);
  };

  const workflowStats = [
    {
      title: "Active Workflows",
      value: workflowInstances
        .filter((w) => w.status === "in_progress")
        .length.toString(),
      icon: GitBranch,
      change: "+2 from last week",
      changeType: "positive" as const,
    },
    {
      title: "Completed This Month",
      value: workflowInstances
        .filter((w) => w.status === "completed")
        .length.toString(),
      icon: CheckCircle,
      change: "+5 from last month",
      changeType: "positive" as const,
    },
    {
      title: "Templates Available",
      value: workflowTemplates
        .filter((t) => t.is_active)
        .length.toString(),
      icon: GitBranch,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Pending Start",
      value: workflowInstances
        .filter((w) => w.status === "not_started")
        .length.toString(),
      icon: Clock,
      change: "",
      changeType: "neutral" as const,
    },
  ];

  const handleCreateWorkflow = (data: any) => {
    const newWorkflow = {
      id: Date.now().toString(),
      name: data.name,
      status: "not_started",
      client: data.client,
      template: data.template,
      tasks: data.template.stages.map((stage: any, index: number) => ({
        id: `task-${Date.now()}-${index}`,
        status: "pending",
        progress_percentage: 0,
      })),
      dueDate: data.dueDate,
      assignee: data.assignee,
      createdAt: new Date(),
    };
    setWorkflowInstances([newWorkflow, ...workflowInstances]);
    toast.success("Workflow created successfully");
    setIsInstanceModalOpen(false);
  };

  const handleSaveTemplate = (data: any) => {
    toast.success(editingTemplate ? "Template updated successfully" : "Template created successfully");
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Workflow Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage service delivery workflows
          </p>
        </div>
        <Button onClick={() => setIsInstanceModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowStats.map((stat, index) => (
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

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Workflows</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInstanceModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workflowInstances.filter((w) => w.status !== "completed").length >
          0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowInstances
                .filter((w) => w.status !== "completed")
                .map((workflow) => (
                  <Card
                    key={workflow.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => router.push(`/client-hub/tasks/${workflow.taskId}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                            {workflow.name}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <CheckSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">
                              Task: {workflow.taskTitle}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(workflow.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(workflow.status)}
                            <span className="capitalize">
                              {workflow.status.replace("_", " ")}
                            </span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{workflow.client.name}</span>
                        </div>
                        <span>•</span>
                        <span>{workflow.template.name}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">
                              Checklist Progress
                            </span>
                            <span className="text-xs font-medium">
                              {calculateProgress(workflow.checklistItems)}%
                            </span>
                          </div>
                          <Progress
                            value={calculateProgress(workflow.checklistItems)}
                            className="h-2"
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{workflow.checklistItems.length} checklist items</span>
                          <span>
                            {
                              workflow.checklistItems.filter(
                                (item) => item.status === "completed"
                              ).length
                            }{" "}
                            completed
                          </span>
                        </div>
                        <div className="pt-2 border-t flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Due {format(workflow.dueDate, "dd/MM/yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {workflow.assignee}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No active workflows found
              </p>
              <Button onClick={() => setIsInstanceModalOpen(true)}>
                Create Your First Workflow
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Templates */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Available Templates</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setIsTemplateModalOpen(true);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Templates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workflowTemplates.filter((t) => t.is_active).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates
                .filter((t) => t.is_active)
                .map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">
                        {template.name}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        {template.service.name}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {template.stages.length} stages
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {template.service.code}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Est. {template.estimatedDays} days
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No workflow templates available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <WorkflowInstanceModal
        isOpen={isInstanceModalOpen}
        onClose={() => setIsInstanceModalOpen(false)}
        onSave={handleCreateWorkflow}
        templates={workflowTemplates.filter((t) => t.is_active)}
      />

      <WorkflowTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
      />
    </div>
  );
}