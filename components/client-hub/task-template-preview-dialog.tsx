"use client";

import { format } from "date-fns";
import { Calendar, Clock, Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import {
  calculateDueDate,
  type PlaceholderData,
  replacePlaceholders,
} from "@/lib/services/template-placeholders";

interface TaskTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
}

export function TaskTemplatePreviewDialog({
  open,
  onOpenChange,
  templateId,
}: TaskTemplatePreviewDialogProps) {
  const [sampleData, setSampleData] = useState<PlaceholderData>({
    clientName: "Acme Ltd",
    serviceName: "Corporation Tax Return",
    period: "Q1 2025",
    taxYear: "2024/25",
    companyNumber: "12345678",
    activationDate: new Date(),
  });

  // Fetch template data
  const { data: template, isLoading } = trpc.taskTemplates.getById.useQuery(
    templateId,
    {
      enabled: open && !!templateId,
    },
  );

  if (!template) return null;

  const previewName = replacePlaceholders(template.namePattern, sampleData);
  const previewDescription = template.descriptionPattern
    ? replacePlaceholders(template.descriptionPattern, sampleData)
    : undefined;

  const dueDate = calculateDueDate(
    sampleData.activationDate || new Date(),
    template.dueDateOffsetDays,
    template.dueDateOffsetMonths,
  );

  const targetDate = new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const getPriorityColor = (priority: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Task Template Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview how this template will generate tasks with sample data
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Task Template Preview</CardTitle>
            <CardDescription>
              Preview how this template will generate tasks with sample data
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 md:px-10 pb-8 md:pb-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Sample Data Inputs */}
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                  <h3 className="font-semibold text-sm">
                    Sample Data (Edit to Preview)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName" className="text-xs">
                        Client Name
                      </Label>
                      <Input
                        id="clientName"
                        value={sampleData.clientName}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            clientName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serviceName" className="text-xs">
                        Service Name
                      </Label>
                      <Input
                        id="serviceName"
                        value={sampleData.serviceName}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            serviceName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period" className="text-xs">
                        Period
                      </Label>
                      <Input
                        id="period"
                        value={sampleData.period}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            period: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxYear" className="text-xs">
                        Tax Year
                      </Label>
                      <Input
                        id="taxYear"
                        value={sampleData.taxYear}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            taxYear: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyNumber" className="text-xs">
                        Company Number
                      </Label>
                      <Input
                        id="companyNumber"
                        value={sampleData.companyNumber}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            companyNumber: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activationDate" className="text-xs">
                        Activation Date
                      </Label>
                      <Input
                        id="activationDate"
                        type="date"
                        value={format(
                          sampleData.activationDate || new Date(),
                          "yyyy-MM-dd",
                        )}
                        onChange={(e) =>
                          setSampleData({
                            ...sampleData,
                            activationDate: new Date(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Generated Task Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Generated Task Preview</h3>

                  {/* Task Name */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Task Name
                    </Label>
                    <div className="rounded-lg border border-border bg-background p-4">
                      <p className="font-semibold text-lg">{previewName}</p>
                    </div>
                  </div>

                  {/* Task Description */}
                  {previewDescription && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Task Description
                      </Label>
                      <div className="rounded-lg border border-border bg-background p-4">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {previewDescription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Task Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center">
                        <Flag className="h-3 w-3 mr-1" />
                        Priority
                      </Label>
                      <div>
                        <Badge className={getPriorityColor(template.priority)}>
                          {template.priority}
                        </Badge>
                      </div>
                    </div>

                    {/* Task Type */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Task Type
                      </Label>
                      <div>
                        <Badge variant="outline" className="capitalize">
                          {template.taskType}
                        </Badge>
                      </div>
                    </div>

                    {/* Estimated Hours */}
                    {template.estimatedHours && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Estimated Hours
                        </Label>
                        <p className="text-sm font-medium">
                          {template.estimatedHours}h
                        </p>
                      </div>
                    )}

                    {/* Due Date */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Due Date
                      </Label>
                      <p className="text-sm font-medium">
                        {format(dueDate, "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (
                        {template.dueDateOffsetMonths > 0 &&
                          `${template.dueDateOffsetMonths} month${template.dueDateOffsetMonths > 1 ? "s" : ""} `}
                        {template.dueDateOffsetDays > 0 &&
                          `${template.dueDateOffsetDays} day${template.dueDateOffsetDays > 1 ? "s" : ""} `}
                        after activation)
                      </p>
                    </div>

                    {/* Target Date */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Target Date
                      </Label>
                      <p className="text-sm font-medium">
                        {format(targetDate, "PPP")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Due date - 7 days)
                      </p>
                    </div>

                    {/* Recurring */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Recurring
                      </Label>
                      <div>
                        {template.isRecurring ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Associated Service
                    </Label>
                    <div className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{template.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {template.serviceCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Original Template Patterns */}
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Original Template</h3>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Name Pattern
                      </Label>
                      <p className="text-sm font-mono">
                        {template.namePattern}
                      </p>
                    </div>
                    {template.descriptionPattern && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Description Pattern
                        </Label>
                        <p className="text-sm font-mono">
                          {template.descriptionPattern}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
