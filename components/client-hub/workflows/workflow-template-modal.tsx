"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, GripVertical } from "lucide-react";

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  checklist: string[];
}

interface WorkflowTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  template?: any;
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
    service: null as any,
    estimatedDays: 1,
    is_active: true,
    stages: [] as WorkflowStage[],
  });

  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        service: template.service || null,
        estimatedDays: template.estimatedDays || 1,
        is_active: template.is_active !== undefined ? template.is_active : true,
        stages: template.stages || [],
      });
    } else {
      handleReset();
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.service || formData.stages.length === 0) {
      return;
    }
    onSave(formData);
    handleReset();
  };

  const handleReset = () => {
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
      order: formData.stages.length + 1,
      checklist: [],
    };

    setFormData({
      ...formData,
      stages: [...formData.stages, newStage],
    });
    setNewStageName("");
    setNewStageDescription("");
  };

  const removeStage = (stageId: string) => {
    const updatedStages = formData.stages
      .filter((s) => s.id !== stageId)
      .map((stage, index) => ({ ...stage, order: index + 1 }));
    setFormData({ ...formData, stages: updatedStages });
  };

  const addChecklistItem = (stageId: string, item: string) => {
    if (!item) return;

    const updatedStages = formData.stages.map((stage) =>
      stage.id === stageId
        ? { ...stage, checklist: [...stage.checklist, item] }
        : stage
    );
    setFormData({ ...formData, stages: updatedStages });
  };

  const removeChecklistItem = (stageId: string, itemIndex: number) => {
    const updatedStages = formData.stages.map((stage) =>
      stage.id === stageId
        ? {
            ...stage,
            checklist: stage.checklist.filter((_, i) => i !== itemIndex),
          }
        : stage
    );
    setFormData({ ...formData, stages: updatedStages });
  };

  const moveStage = (fromIndex: number, toIndex: number) => {
    const newStages = [...formData.stages];
    const [movedStage] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, movedStage);

    // Update order numbers
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      order: index + 1,
    }));

    setFormData({ ...formData, stages: updatedStages });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Workflow Template" : "Create Workflow Template"}
          </DialogTitle>
          <DialogDescription>
            Define the stages and checklist items for this workflow template
          </DialogDescription>
        </DialogHeader>
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
                    estimatedDays: parseInt(e.target.value) || 1,
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
                {formData.stages.length} stage{formData.stages.length !== 1 ? "s" : ""}
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
              {formData.stages.map((stage, index) => (
                <Card key={stage.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">
                          {stage.order}. {stage.name}
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
                      {stage.checklist.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}