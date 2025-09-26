"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { WorkflowTemplateModal } from "@/components/client-hub/workflows/workflow-template-modal";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  GitBranch,
  Plus,
  Settings,
  FileText,
  Package,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Layers,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

// Mock task usage count for templates (in production, this would come from database)
const mockTaskUsageCount: { [key: string]: number } = {
  "1": 12, // 12 tasks using VAT Return template
  "2": 8,  // 8 tasks using Year-End Accounts
  "3": 15, // 15 tasks using Monthly Payroll
  "4": 6,  // 6 tasks using Corporation Tax Return
  "5": 10, // 10 tasks using Management Accounts
  "6": 0,  // 0 tasks using Company Formation (inactive)
};

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
  const [workflowTemplates, setWorkflowTemplates] = useState(mockWorkflowTemplates);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const handleToggleTemplate = (templateId: string, isActive: boolean) => {
    setWorkflowTemplates(templates =>
      templates.map(t =>
        t.id === templateId ? { ...t, is_active: !isActive } : t
      )
    );
    toast.success(isActive ? "Template deactivated" : "Template activated");
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = workflowTemplates.find(t => t.id === templateId);
    if (template && window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      setWorkflowTemplates(templates => templates.filter(t => t.id !== templateId));
      toast.success("Template deleted successfully");
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const template = workflowTemplates.find(t => t.id === templateId);
    if (template) {
      const newTemplate = {
        ...template,
        id: Date.now().toString(),
        name: `${template.name} (Copy)`,
      };
      setWorkflowTemplates([...workflowTemplates, newTemplate]);
      toast.success("Template duplicated successfully");
    }
  };

  const templateStats = [
    {
      title: "Total Templates",
      value: workflowTemplates.length.toString(),
      icon: FileText,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Active Templates",
      value: workflowTemplates
        .filter((t) => t.is_active)
        .length.toString(),
      icon: Activity,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Total Stages",
      value: workflowTemplates
        .reduce((sum, t) => sum + (t.stages?.length || 0), 0)
        .toString(),
      icon: Layers,
      change: "",
      changeType: "neutral" as const,
    },
    {
      title: "Tasks Using Templates",
      value: Object.values(mockTaskUsageCount)
        .reduce((sum, count) => sum + count, 0)
        .toString(),
      icon: GitBranch,
      change: "",
      changeType: "neutral" as const,
    },
  ];

  const handleSaveTemplate = (data: any) => {
    if (editingTemplate) {
      setWorkflowTemplates(templates =>
        templates.map(t =>
          t.id === editingTemplate.id ? { ...editingTemplate, ...data } : t
        )
      );
      toast.success("Template updated successfully");
    } else {
      const newTemplate = {
        ...data,
        id: Date.now().toString(),
        is_active: true,
      };
      setWorkflowTemplates([...workflowTemplates, newTemplate]);
      toast.success("Template created successfully");
    }
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Workflow Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage workflow templates for tasks
          </p>
        </div>
        <Button onClick={() => {
          setEditingTemplate(null);
          setIsTemplateModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templateStats.map((stat, index) => (
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

      {/* Workflow Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {workflowTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "hover:shadow-lg transition-shadow",
                    !template.is_active && "opacity-60"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {template.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.service.code}
                          </Badge>
                          {!template.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingTemplate(template);
                              setIsTemplateModalOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateTemplate(template.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleTemplate(template.id, template.is_active)}
                          >
                            {template.is_active ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-muted-foreground" />
                          <span>{template.stages.length} stages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-muted-foreground" />
                          <span>{mockTaskUsageCount[template.id] || 0} tasks</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Est. {template.estimatedDays} days
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {template.service.name}
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
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No workflow templates created yet
              </p>
              <Button onClick={() => {
                setEditingTemplate(null);
                setIsTemplateModalOpen(true);
              }}>
                Create Your First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
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