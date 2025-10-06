"use client";

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import {
  Activity,
  Copy,
  Edit,
  FileText,
  GitBranch,
  Layers,
  MoreVertical,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import type { AppRouter } from "@/app/server";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { WorkflowTemplateModal } from "@/components/client-hub/workflows/workflow-template-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type WorkflowTemplate =
  inferRouterOutputs<AppRouter>["workflows"]["list"][number];
type WorkflowCreateInput = inferRouterInputs<AppRouter>["workflows"]["create"];
type WorkflowUpdateArgs = inferRouterInputs<AppRouter>["workflows"]["update"];
type WorkflowUpdateInput = WorkflowUpdateArgs["data"];

export default function WorkflowsPage() {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<WorkflowTemplate | null>(null);

  // Fetch workflows from database
  const { data: workflowTemplates = [], refetch } =
    trpc.workflows.list.useQuery();
  const toggleActiveMutation = trpc.workflows.toggleActive.useMutation();
  const deleteWorkflowMutation = trpc.workflows.delete.useMutation();
  const createWorkflowMutation = trpc.workflows.create.useMutation();
  const updateWorkflowMutation = trpc.workflows.update.useMutation();

  const handleToggleTemplate = async (
    templateId: string,
    isActive: boolean,
  ) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: templateId,
        isActive: !isActive,
      });
      toast.success(isActive ? "Template deactivated" : "Template activated");
      refetch();
    } catch (_error) {
      toast.error("Failed to toggle template status");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = workflowTemplates.find((t) => t.id === templateId);
    if (
      template &&
      window.confirm(`Are you sure you want to delete "${template.name}"?`)
    ) {
      try {
        await deleteWorkflowMutation.mutateAsync(templateId);
        toast.success("Template deleted successfully");
        refetch();
      } catch (_error) {
        toast.error("Failed to delete template");
      }
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    const template = workflowTemplates.find((t) => t.id === templateId);
    if (template) {
      try {
        await createWorkflowMutation.mutateAsync({
          name: `${template.name} (Copy)`,
          description: template.description,
          type: template.type,
          config: {},
          trigger: template.trigger,
          serviceComponentId: template.serviceComponentId,
          isActive: template.isActive,
          estimatedDays: template.estimatedDays,
        });
        toast.success("Template duplicated successfully");
        refetch();
      } catch (_error) {
        toast.error("Failed to duplicate template");
      }
    }
  };

  const templateStats = [
    {
      title: "Total Templates",
      value: workflowTemplates.length.toString(),
      icon: FileText,
    },
    {
      title: "Active Templates",
      value: workflowTemplates.filter((t) => t.isActive).length.toString(),
      icon: Activity,
    },
    {
      title: "Total Stages",
      value: workflowTemplates
        .reduce((sum, t) => sum + (t.stageCount || 0), 0)
        .toString(),
      icon: Layers,
    },
    {
      title: "Tasks Using Templates",
      value: "0",
      icon: GitBranch,
    },
  ];

  const handleSaveTemplate = async (
    data: WorkflowCreateInput | WorkflowUpdateInput,
  ) => {
    try {
      if (editingTemplate) {
        await updateWorkflowMutation.mutateAsync({
          id: editingTemplate.id,
          data: data as WorkflowUpdateInput,
        });
        toast.success("Template updated successfully");
      } else {
        await createWorkflowMutation.mutateAsync(data as WorkflowCreateInput);
        toast.success("Template created successfully");
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      refetch();
    } catch (_error) {
      toast.error("Failed to save template");
    }
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
        <Button
          onClick={() => {
            setEditingTemplate(null);
            setIsTemplateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templateStats.map((stat) => (
          <KPIWidget
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
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
                    !template.isActive && "opacity-60",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {template.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {template.service && (
                            <Badge variant="outline" className="text-xs">
                              {template.service.code}
                            </Badge>
                          )}
                          {!template.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
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
                            onClick={() =>
                              handleToggleTemplate(
                                template.id,
                                template.isActive,
                              )
                            }
                          >
                            {template.isActive ? (
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
                          <span>{template.stageCount || 0} stages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-muted-foreground" />
                          <span>0 tasks</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Est. {template.estimatedDays} days
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {template.service?.name || "No Service"}
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
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsTemplateModalOpen(true);
                }}
              >
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
