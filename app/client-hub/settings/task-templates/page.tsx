"use client";

import { Copy, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { TaskTemplateFormDialog } from "@/components/client-hub/task-template-form-dialog";
import { TaskTemplatePreviewDialog } from "@/components/client-hub/task-template-preview-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

export default function TaskTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // Fetch templates
  const {
    data: templates,
    isLoading,
    refetch,
  } = trpc.taskTemplates.list.useQuery({
    includeInactive,
  });

  // Fetch services for filter dropdown
  const { data: servicesData } = trpc.services.list.useQuery({});
  const services = servicesData?.services || [];

  // Delete mutation
  const deleteMutation = trpc.taskTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
      setTemplateToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });

  // Clone mutation
  const cloneMutation = trpc.taskTemplates.clone.useMutation({
    onSuccess: (data) => {
      toast.success("Template cloned successfully");
      refetch();
      // Open edit form for cloned template
      setSelectedTemplate(data.newTemplateId);
      setIsFormOpen(true);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clone template");
    },
  });

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.namePattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.descriptionPattern
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesService =
      serviceFilter === "all" || template.serviceId === serviceFilter;

    const matchesTaskType =
      taskTypeFilter === "all" || template.taskType === taskTypeFilter;

    return matchesSearch && matchesService && matchesTaskType;
  });

  const handleEdit = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsFormOpen(true);
  };

  const handlePreview = (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsPreviewOpen(true);
  };

  const handleClone = (templateId: string) => {
    cloneMutation.mutate({ templateId });
  };

  const handleDelete = (templateId: string) => {
    setTemplateToDelete(templateId);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate({ id: templateToDelete });
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage task templates for automated task generation
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedTemplate(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services?.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Task Types</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="bookkeeping">Bookkeeping</SelectItem>
                <SelectItem value="advisory">Advisory</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="client_communication">
                  Client Communication
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeInactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeInactive" className="text-sm">
                Show inactive
              </label>
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="glass-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name Pattern</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date Offset</TableHead>
                <TableHead>Est. Hours</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading templates...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filteredTemplates?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No templates found. Create your first template to get
                    started.
                  </TableCell>
                </TableRow>
              )}
              {filteredTemplates?.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {template.namePattern}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {template.serviceName || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {template.taskType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(template.priority)}>
                      {template.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {template.dueDateOffsetMonths > 0 && (
                      <span>{template.dueDateOffsetMonths}mo </span>
                    )}
                    {template.dueDateOffsetDays > 0 && (
                      <span>{template.dueDateOffsetDays}d</span>
                    )}
                    {template.dueDateOffsetMonths === 0 &&
                      template.dueDateOffsetDays === 0 && (
                        <span className="text-muted-foreground">Same day</span>
                      )}
                  </TableCell>
                  <TableCell>
                    {template.estimatedHours
                      ? `${template.estimatedHours}h`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {template.isRecurring ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {template.isActive ? (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template.id)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template.id)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClone(template.id)}
                        title="Clone"
                        disabled={cloneMutation.isPending}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredTemplates && filteredTemplates.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredTemplates.length} of {templates?.length || 0}{" "}
            templates
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <TaskTemplateFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        templateId={selectedTemplate}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
          setSelectedTemplate(null);
        }}
      />

      {/* Preview Dialog */}
      {selectedTemplate && (
        <TaskTemplatePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          templateId={selectedTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This will soft
              delete the template, making it inactive. Tasks already generated
              from this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
