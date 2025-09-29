"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitBranch, Layers, Clock } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import toast from "react-hot-toast";

interface WorkflowAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onAssigned?: () => void;
}

export function WorkflowAssignmentModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onAssigned,
}: WorkflowAssignmentModalProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch available workflows
  const { data: workflows = [], isLoading } = trpc.workflows.list.useQuery({
    isActive: true,
  });

  // Assign workflow mutation
  const assignWorkflowMutation = trpc.tasks.assignWorkflow.useMutation();

  const handleAssign = async () => {
    if (!selectedWorkflowId) {
      toast.error("Please select a workflow");
      return;
    }

    setIsAssigning(true);
    try {
      await assignWorkflowMutation.mutateAsync({
        taskId,
        workflowId: selectedWorkflowId,
      });
      toast.success("Workflow assigned successfully");
      onAssigned?.();
      onClose();
    } catch (error) {
      toast.error("Failed to assign workflow");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Workflow to Task</DialogTitle>
          <DialogDescription>
            Select a workflow template to assign to: <strong>{taskTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No active workflows available</p>
            </div>
          ) : (
            <RadioGroup value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
              <div className="space-y-3">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedWorkflowId(workflow.id)}
                  >
                    <RadioGroupItem value={workflow.id} id={workflow.id} />
                    <Label htmlFor={workflow.id} className="flex-1 cursor-pointer">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{workflow.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {workflow.type}
                          </Badge>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {workflow.stageCount || 0} stages
                          </span>
                          {workflow.estimatedDays && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Est. {workflow.estimatedDays} days
                            </span>
                          )}
                          {workflow.service && (
                            <span>
                              Service: {workflow.service.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedWorkflowId || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Workflow"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}