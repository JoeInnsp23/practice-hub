"use client";

import { GripVertical, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ChecklistItem {
  id: string;
  text: string;
}

interface WorkflowStage {
  id?: string;
  name: string;
  description: string;
  stageOrder: number;
  isRequired?: boolean;
  estimatedHours?: string;
  checklistItems?: ChecklistItem[];
  checklist?: string[];
  autoComplete?: boolean;
  requiresApproval?: boolean;
}

interface Service {
  id: string;
  name: string;
  code: string;
}

interface WorkflowTemplateData {
  name: string;
  description: string;
  service: Service | null;
  estimatedDays: number;
  is_active: boolean;
  stages: WorkflowStage[];
}

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkflowTemplateData) => void;
  // Accept any template-like object (from router output or input) - we'll extract what we need
  template?: Record<string, unknown> | null;
}

// Mock services data
const mockServices = [
  { id: "1", name: "VAT Services", code: "VAT" },
  { id: "2", name: "Accounting", code: "ACC" },
  { id: "3", name: "Payroll", code: "PAY" },
  { id: "4", name: "Tax Services", code: "TAX" },
  { id: "5", name: "Company Services", code: "COS" },
];

export function WorkflowTemplateModal({
  isOpen,
  onClose,
  onSave,
  template,
}: WorkflowTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    service: null as Service | null,
    estimatedDays: 1,
    is_active: true,
    stages: [] as WorkflowStage[],
  });

  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");

  const handleReset = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      service: null,
      estimatedDays: 1,
      is_active: true,
      stages: [],
    });
    setNewStageName("");
    setNewStageDescription("");
  }, []);

  useEffect(() => {
    if (template) {
      // Type-safe extraction of template properties
      const stages = Array.isArray(template.stages)
        ? (template.stages as WorkflowStage[])
        : [];
      const stagesWithChecklist = stages.map((stage) => ({
        ...stage,
        checklist: stage.checklist || [],
      }));

      // Extract only the core service fields (id, name, code) from the potentially extended service object
      const templateService = template.service as
        | { id: string; name: string; code: string; [key: string]: unknown }
        | null
        | undefined;
      const serviceData = templateService
        ? {
            id: templateService.id,
            name: templateService.name,
            code: templateService.code,
          }
        : null;

      setFormData({
        name: typeof template.name === "string" ? template.name : "",
        description:
          typeof template.description === "string" ? template.description : "",
        service: serviceData,
        estimatedDays:
          typeof template.estimatedDays === "number"
            ? template.estimatedDays
            : 1,
        is_active:
          typeof template.is_active === "boolean" ? template.is_active : true,
        stages: stagesWithChecklist,
      });
    } else {
      handleReset();
    }
  }, [template, handleReset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.service || formData.stages.length === 0) {
      return;
    }
    onSave(formData);
    handleReset();
  };

  const handleServiceChange = (serviceId: string) => {
    const service = mockServices.find((s) => s.id === serviceId);
    if (service) {
      setFormData({ ...formData, service });
    }
  };

  const addStage = () => {
    if (!newStageName) return;

    const newStage: WorkflowStage = {
      id: Date.now().toString(),
      name: newStageName,
      description: newStageDescription,
      stageOrder: formData.stages.length + 1,
      checklist: [],
    };

    setFormData({
      ...formData,
      stages: [...formData.stages, newStage],
    });
    setNewStageName("");
    setNewStageDescription("");
  };

  const removeStage = (stageId: string | undefined) => {
    const updatedStages = formData.stages
      .filter((s) => s.id !== stageId)
      .map((stage, index) => ({ ...stage, stageOrder: index + 1 }));
    setFormData({ ...formData, stages: updatedStages });
  };

  const addChecklistItem = (stageId: string | undefined, item: string) => {
    if (!item) return;

    const updatedStages = formData.stages.map((stage) =>
      stage.id === stageId
        ? { ...stage, checklist: [...(stage.checklist || []), item] }
        : stage,
    );
    setFormData({ ...formData, stages: updatedStages });
  };

  const removeChecklistItem = (
    stageId: string | undefined,
    itemIndex: number,
  ) => {
    const updatedStages = formData.stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            checklist: (stage.checklist || []).filter(
              (_, i) => i !== itemIndex,
            ),
          }
        : stage,
    );
    setFormData({ ...formData, stages: updatedStages });
  };

  const _moveStage = (fromIndex: number, toIndex: number) => {
    const newStages = [...formData.stages];
    const [movedStage] = newStages.splice(fromIndex, 1);
    if (movedStage) {
      newStages.splice(toIndex, 0, movedStage);
    }

    // Update order numbers
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      stageOrder: index + 1,
    }));

    setFormData({ ...formData, stages: updatedStages });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">
          {template ? "Edit Workflow Template" : "Create Workflow Template"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Define the stages and checklist items for this workflow template
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>
              {template ? "Edit Workflow Template" : "Create Workflow Template"}
            </CardTitle>
            <CardDescription>
              Define the stages and checklist items for this workflow template
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 md:px-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Template Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Standard VAT Return"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the workflow process..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Service */}
                <div className="space-y-2">
                  <Label htmlFor="service">Service Type *</Label>
                  <Select
                    value={formData.service?.id}
                    onValueChange={handleServiceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimated Days */}
                <div className="space-y-2">
                  <Label htmlFor="estimatedDays">Estimated Days</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    min="1"
                    value={formData.estimatedDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedDays: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Template Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              {/* Stages */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Workflow Stages *</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.stages.length} stage
                    {formData.stages.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Add New Stage */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Add New Stage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Stage name"
                    />
                    <Input
                      value={newStageDescription}
                      onChange={(e) => setNewStageDescription(e.target.value)}
                      placeholder="Stage description (optional)"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStage}
                      disabled={!newStageName}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stage
                    </Button>
                  </CardContent>
                </Card>

                {/* Existing Stages */}
                <div className="space-y-3">
                  {formData.stages.map((stage, _index) => (
                    <Card key={stage.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm">
                              {stage.stageOrder}. {stage.name}
                            </CardTitle>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStage(stage.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {stage.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-xs">Checklist Items</Label>
                          {(stage.checklist || []).map((item, itemIndex) => (
                            <div
                              key={item}
                              className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                            >
                              <span>{item}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeChecklistItem(stage.id, itemIndex)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add checklist item"
                              className="text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  addChecklistItem(stage.id, input.value);
                                  input.value = "";
                                }
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <form onSubmit={handleSubmit}>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name ||
                  !formData.service ||
                  formData.stages.length === 0
                }
              >
                {template ? "Update Template" : "Create Template"}
              </Button>
            </form>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
