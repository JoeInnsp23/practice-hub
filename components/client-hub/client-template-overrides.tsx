"use client";

import { Ban, Calendar, Flag, RotateCcw, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { GLASS_DROPDOWN_MENU_STYLES } from "@/lib/utils/dropdown-styles";

interface ClientTemplateOverridesProps {
  clientId: string;
}

export function ClientTemplateOverrides({
  clientId,
}: ClientTemplateOverridesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    isDisabled: false,
    customPriority: undefined as string | undefined,
    customDueDate: undefined as string | undefined,
  });

  // Fetch client templates with overrides
  const {
    data: templates,
    isLoading,
    refetch,
  } = trpc.taskTemplates.getClientTemplates.useQuery({
    clientId,
  });

  // Set override mutation
  const setOverrideMutation = trpc.taskTemplates.setClientOverride.useMutation({
    onSuccess: () => {
      toast.success("Template override saved");
      refetch();
      setIsDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save override");
    },
  });

  // Remove override mutation
  const removeOverrideMutation =
    trpc.taskTemplates.removeClientOverride.useMutation({
      onSuccess: () => {
        toast.success("Template override removed");
        refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove override");
      },
    });

  const handleOpenDialog = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData({
        isDisabled: template.override?.isDisabled || false,
        customPriority: template.override?.customPriority || undefined,
        customDueDate: template.override?.customDueDate || undefined,
      });
      setIsDialogOpen(true);
    }
  };

  const handleSaveOverride = () => {
    if (!selectedTemplate) return;

    setOverrideMutation.mutate({
      clientId,
      templateId: selectedTemplate,
      isDisabled: formData.isDisabled,
      customPriority: formData.customPriority as
        | "low"
        | "medium"
        | "high"
        | "urgent"
        | "critical"
        | undefined,
      customDueDate: formData.customDueDate,
    });
  };

  const handleRemoveOverride = (templateId: string) => {
    removeOverrideMutation.mutate({
      clientId,
      templateId,
    });
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      urgent:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      high: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const selectedTemplateData = templates?.find(
    (t) => t.id === selectedTemplate,
  );

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading template overrides...</p>
        </div>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Task Template Overrides</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No task templates available for this client's services.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Task Template Overrides</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Customize task templates for this specific client. You can disable
        templates, change priorities, or adjust due date offsets.
      </p>

      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Default Priority</TableHead>
              <TableHead>Override Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => {
              const hasOverride = !!template.override;
              const isDisabled = template.override?.isDisabled || false;

              return (
                <TableRow
                  key={template.id}
                  className={isDisabled ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">
                    {template.namePattern}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{template.serviceName}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(template.priority)}>
                      {template.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isDisabled && (
                      <Badge variant="destructive" className="mr-2">
                        <Ban className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                    {hasOverride && !isDisabled && (
                      <Badge variant="secondary">
                        {template.override?.customPriority && (
                          <span className="mr-2">
                            <Flag className="h-3 w-3 inline mr-1" />
                            Priority Override
                          </span>
                        )}
                        {template.override?.customDueDate && (
                          <span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Date Override
                          </span>
                        )}
                      </Badge>
                    )}
                    {!hasOverride && (
                      <span className="text-sm text-muted-foreground">
                        No override
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(template.id)}
                        title="Configure Override"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {hasOverride && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOverride(template.id)}
                          title="Reset to Default"
                          disabled={removeOverrideMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Override Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Template Override</DialogTitle>
            <DialogDescription>
              Customize this template for {selectedTemplateData?.namePattern}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Disable Template */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label>Disable Template</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent tasks from being generated from this template
                </p>
              </div>
              <Switch
                checked={formData.isDisabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDisabled: checked })
                }
              />
            </div>

            {/* Custom Priority */}
            <div className="space-y-2">
              <Label>Custom Priority</Label>
              <Select
                value={formData.customPriority || "default"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    customPriority: value === "default" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use default priority" />
                </SelectTrigger>
                <SelectContent className={cn(GLASS_DROPDOWN_MENU_STYLES)}>
                  <SelectItem value="default">
                    Use Default ({selectedTemplateData?.priority})
                  </SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Override the default priority for this client
              </p>
            </div>

            {/* Custom Due Date Offset */}
            <div className="space-y-2">
              <Label>Custom Due Date (Fixed Date)</Label>
              <Input
                type="date"
                value={formData.customDueDate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customDueDate: e.target.value || undefined,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Set a specific due date (overrides offset calculation)
              </p>
            </div>

            {/* Current Settings Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Default Settings</h4>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Priority:</span>{" "}
                  <Badge
                    className={getPriorityBadge(
                      selectedTemplateData?.priority || "medium",
                    )}
                  >
                    {selectedTemplateData?.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Due Date Offset:
                  </span>{" "}
                  {selectedTemplateData?.dueDateOffsetMonths || 0} months +{" "}
                  {selectedTemplateData?.dueDateOffsetDays || 0} days
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOverride}
              disabled={setOverrideMutation.isPending}
            >
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
