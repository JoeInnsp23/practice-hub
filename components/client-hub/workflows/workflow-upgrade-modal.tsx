"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkflowUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  newVersionId: string;
  newVersionNumber: number;
  onUpgradeComplete: () => void;
}

export function WorkflowUpgradeModal({
  isOpen,
  onClose,
  workflowId,
  newVersionId,
  newVersionNumber,
  onUpgradeComplete,
}: WorkflowUpgradeModalProps) {
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(
    new Set(),
  );
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: instances = [], isLoading } =
    trpc.workflows.getActiveInstances.useQuery(workflowId, { enabled: isOpen });

  const migrateMutation = trpc.workflows.migrateInstances.useMutation();

  const handleToggleInstance = (instanceId: string) => {
    const newSelected = new Set(selectedInstances);
    if (newSelected.has(instanceId)) {
      newSelected.delete(instanceId);
    } else {
      newSelected.add(instanceId);
    }
    setSelectedInstances(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedInstances(new Set(oldVersionInstances.map((i) => i.instanceId)));
  };

  const handleDeselectAll = () => {
    setSelectedInstances(new Set());
  };

  const handleUpgrade = async () => {
    if (selectedInstances.size === 0) {
      toast.error("Please select at least one task to upgrade");
      return;
    }

    setIsUpgrading(true);
    try {
      await migrateMutation.mutateAsync({
        instanceIds: Array.from(selectedInstances),
        newVersionId,
      });
      toast.success(
        `Upgraded ${selectedInstances.size} task(s) to version ${newVersionNumber}`,
      );
      onUpgradeComplete();
      onClose();
    } catch (_error) {
      toast.error("Failed to upgrade tasks");
    } finally {
      setIsUpgrading(false);
    }
  };

  const oldVersionInstances = instances.filter(
    (i) => i.currentVersion < newVersionNumber,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">
          Upgrade Active Tasks to New Version
        </DialogTitle>
        <DialogDescription className="sr-only">
          Select which tasks should be upgraded to version {newVersionNumber}
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle>Upgrade Active Tasks to New Version</CardTitle>
            <CardDescription>
              Select which tasks should be upgraded to version{" "}
              {newVersionNumber}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-8 md:px-10">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : oldVersionInstances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <p className="font-medium">
                  All active tasks are already on the latest version
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">
                      {oldVersionInstances.length} task
                      {oldVersionInstances.length !== 1 ? "s" : ""} on older
                      versions
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {oldVersionInstances.map((instance) => (
                    <div
                      key={instance.instanceId}
                      className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={instance.instanceId}
                        checked={selectedInstances.has(instance.instanceId)}
                        onCheckedChange={() =>
                          handleToggleInstance(instance.instanceId)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor={instance.instanceId}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{instance.taskTitle}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            v{instance.currentVersion}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge className="font-mono text-xs">
                            v{newVersionNumber}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            Progress: {instance.progress}%
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">
                    What happens when you upgrade:
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>
                      ✓ Tasks will use the new workflow structure and checklist
                      items
                    </li>
                    <li>
                      ✓ Existing completed items will be preserved where
                      possible
                    </li>
                    <li>✓ New checklist items will appear as uncompleted</li>
                    <li>✓ Removed checklist items will no longer be visible</li>
                    <li>
                      ✓ Progress percentage may change based on new total items
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end px-8 pt-6 pb-4 md:px-10 md:pt-8 md:pb-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpgrading}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              Cancel
            </Button>
            {oldVersionInstances.length > 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedInstances(
                      new Set(oldVersionInstances.map((i) => i.instanceId)),
                    );
                    handleUpgrade();
                  }}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    `Upgrade All (${oldVersionInstances.length})`
                  )}
                </Button>
                <Button
                  onClick={handleUpgrade}
                  disabled={selectedInstances.size === 0 || isUpgrading}
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    `Upgrade Selected (${selectedInstances.size})`
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
