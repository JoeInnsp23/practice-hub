"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_PLACEHOLDERS } from "@/lib/services/template-placeholders";
import { trpc } from "@/lib/trpc/client";

const formSchema = z.object({
  serviceId: z.string().uuid("Please select a service"),
  namePattern: z.string().min(1, "Name pattern is required"),
  descriptionPattern: z.string().optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]),
  taskType: z.string().min(1, "Task type is required"),
  dueDateOffsetDays: z.coerce.number().int().min(0).default(0),
  dueDateOffsetMonths: z.coerce.number().int().min(0).default(0),
  isRecurring: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
  onSuccess: () => void;
}

export function TaskTemplateFormDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: TaskTemplateFormDialogProps) {
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const isEditing = !!templateId;

  // Fetch services for dropdown
  const { data: servicesData } = trpc.services.list.useQuery({});
  const services = servicesData?.services || [];

  // Fetch template data if editing
  const { data: template, isLoading: isLoadingTemplate } =
    trpc.taskTemplates.getById.useQuery(templateId!, {
      enabled: !!templateId,
    });

  // Create mutation
  const createMutation = trpc.taskTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

  // Update mutation
  const updateMutation = trpc.taskTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceId: "",
      namePattern: "",
      descriptionPattern: "",
      estimatedHours: 0,
      priority: "medium",
      taskType: "compliance",
      dueDateOffsetDays: 0,
      dueDateOffsetMonths: 0,
      isRecurring: false,
    },
  });

  // Reset form when template data loads
  useEffect(() => {
    if (template) {
      form.reset({
        serviceId: template.serviceId,
        namePattern: template.namePattern,
        descriptionPattern: template.descriptionPattern || "",
        estimatedHours: template.estimatedHours || undefined,
        priority: template.priority as
          | "low"
          | "medium"
          | "high"
          | "urgent"
          | "critical",
        taskType: template.taskType || "compliance",
        dueDateOffsetDays: template.dueDateOffsetDays,
        dueDateOffsetMonths: template.dueDateOffsetMonths,
        isRecurring: template.isRecurring,
      });
    }
  }, [template, form]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({
        id: templateId,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the task template settings below"
              : "Create a new task template with placeholder support"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingTemplate ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Service Selection */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} ({service.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The service this template is associated with
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name Pattern */}
              <FormField
                control={form.control}
                name="namePattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name Pattern *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Prepare {service_name} for {client_name}"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Task name template with placeholder support.{" "}
                      <button
                        type="button"
                        onClick={() => setShowPlaceholders(!showPlaceholders)}
                        className="text-primary hover:underline"
                      >
                        {showPlaceholders ? "Hide" : "Show"} available
                        placeholders
                      </button>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Placeholder Help */}
              {showPlaceholders && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Available Placeholders:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(SUPPORTED_PLACEHOLDERS).map(
                          ([key, description]) => (
                            <Badge
                              key={key}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={() => {
                                const currentValue =
                                  form.getValues("namePattern");
                                form.setValue(
                                  "namePattern",
                                  `${currentValue}{${key}}`,
                                );
                              }}
                            >
                              {`{${key}}`}
                            </Badge>
                          ),
                        )}
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        Click a placeholder to insert it into the name pattern
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Pattern */}
              <FormField
                control={form.control}
                name="descriptionPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description Pattern</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Complete {service_name} for {client_name} - Tax Year {tax_year}"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Task description template (optional, supports
                      placeholders)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Task Type and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select task type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="bookkeeping">
                            Bookkeeping
                          </SelectItem>
                          <SelectItem value="advisory">Advisory</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="client_communication">
                            Client Communication
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Estimated Hours */}
              <FormField
                control={form.control}
                name="estimatedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="e.g., 8"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Expected time to complete this task (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date Offset Row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDateOffsetMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date Offset (Months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 3"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Months after service activation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDateOffsetDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date Offset (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g., 30"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Days after service activation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Recurring Checkbox */}
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Task</FormLabel>
                      <FormDescription>
                        Mark this template for recurring task generation (e.g.,
                        quarterly VAT returns)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Update Template" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
