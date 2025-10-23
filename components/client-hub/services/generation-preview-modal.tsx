"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";

interface GenerationPreviewModalProps {
  serviceId: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal to preview and confirm task generation from templates
 * Shows what tasks will be created before committing
 */
export function GenerationPreviewModal({
  serviceId,
  clientId,
  open,
  onOpenChange,
}: GenerationPreviewModalProps) {
  const utils = trpc.useUtils();

  // Fetch preview data
  const {
    data: preview,
    isLoading,
    error,
  } = trpc.taskGeneration.previewGeneration.useQuery(
    {
      serviceId,
      clientId,
    },
    {
      enabled: open, // Only fetch when modal is open
    },
  );

  // Generate tasks mutation
  const generateMutation =
    trpc.taskGeneration.bulkGenerateForService.useMutation({
      onSuccess: (result) => {
        if (result.generated > 0) {
          toast.success(
            `Successfully generated ${result.generated} task${result.generated !== 1 ? "s" : ""}`,
          );
        }

        if (result.skipped > 0) {
          toast(
            `${result.skipped} task${result.skipped !== 1 ? "s" : ""} skipped (duplicates)`,
            {
              icon: "ℹ️",
            },
          );
        }

        if (result.failed > 0) {
          toast.error(
            `${result.failed} task${result.failed !== 1 ? "s" : ""} failed to generate`,
          );
        }

        // Invalidate tasks list to refresh
        utils.tasks.getAll.invalidate();

        // Close modal on success
        if (result.generated > 0 || result.skipped > 0) {
          onOpenChange(false);
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate tasks");
      },
    });

  const handleGenerate = () => {
    generateMutation.mutate({
      serviceId,
      clientIds: [clientId],
    });
  };

  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Tasks Preview
          </DialogTitle>
          <DialogDescription>
            Review the tasks that will be automatically created from templates
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load preview: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!isLoading && !error && preview && preview.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Task Templates Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                There are no task templates configured for this service. Create
                templates in the Task Templates section to enable
                auto-generation.
              </p>
            </div>
          )}

          {/* Preview List */}
          {!isLoading && preview && preview.length > 0 && (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {preview.length} task{preview.length !== 1 ? "s" : ""} will be
                  created
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {preview.map((task, index) => (
                  <div
                    key={task.templateId}
                    className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                  >
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm leading-tight">
                          {task.taskName}
                        </h4>
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(task.dueDate), "PP")}</span>
                      </div>
                      {task.estimatedHours > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{task.estimatedHours}h estimated</span>
                        </div>
                      )}
                      {task.taskType && (
                        <Badge variant="outline" className="text-xs">
                          {task.taskType}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              !preview ||
              preview.length === 0 ||
              generateMutation.isPending ||
              isLoading
            }
          >
            {generateMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {preview?.length || 0} Task
                {preview?.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
