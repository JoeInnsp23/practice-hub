"use client";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChecklistItem {
  id: string;
  text: string;
  isRequired?: boolean;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string | null;
  stageOrder: number;
  isRequired: boolean;
  estimatedHours: string | null;
  autoComplete: boolean | null;
  requiresApproval: boolean | null;
  checklistItems: ChecklistItem[];
}

interface VersionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  versionId1: string;
  versionId2: string;
  version1Number: number;
  version2Number: number;
}

export function VersionComparisonModal({
  isOpen,
  onClose,
  workflowId,
  versionId1,
  versionId2,
  version1Number,
  version2Number,
}: VersionComparisonModalProps) {
  const { data: comparison, isLoading } =
    trpc.workflows.compareVersions.useQuery(
      {
        workflowId,
        versionId1,
        versionId2,
      },
      { enabled: isOpen },
    );

  if (!comparison && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Compare Versions
            <Badge variant="secondary" className="font-mono">
              v{version1Number}
            </Badge>
            <ArrowRight className="h-4 w-4" />
            <Badge variant="secondary" className="font-mono">
              v{version2Number}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View differences between workflow versions
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {comparison.summary.stagesAdded}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stages Added
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {comparison.summary.stagesRemoved}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stages Removed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {comparison.summary.stagesModified}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Stages Modified
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {comparison.summary.metadataChanged ? "Yes" : "No"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Metadata Changed
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata Changes */}
            {comparison.metadataChanges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata Changes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {comparison.metadataChanges.includes("name") && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Name
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm line-through text-red-600">
                          {comparison.version1.name}
                        </div>
                        <div className="text-sm text-green-600">
                          {comparison.version2.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {comparison.metadataChanges.includes("description") && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Description
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm line-through text-red-600">
                          {comparison.version1.description || "(none)"}
                        </div>
                        <div className="text-sm text-green-600">
                          {comparison.version2.description || "(none)"}
                        </div>
                      </div>
                    </div>
                  )}
                  {comparison.metadataChanges.includes("estimatedDays") && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Est. Days
                      </Badge>
                      <div className="flex-1 space-y-1">
                        <div className="text-sm line-through text-red-600">
                          {comparison.version1.estimatedDays || "N/A"}
                        </div>
                        <div className="text-sm text-green-600">
                          {comparison.version2.estimatedDays || "N/A"}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Removed Stages */}
            {comparison.stageDiff.removed.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                    <MinusCircle className="h-4 w-4" />
                    Removed Stages ({comparison.stageDiff.removed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {comparison.stageDiff.removed.map((stage: WorkflowStage) => (
                    <div
                      key={stage.id}
                      className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded"
                    >
                      <div className="font-medium text-sm">{stage.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stage.checklistItems?.length || 0} checklist items
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Added Stages */}
            {comparison.stageDiff.added.length > 0 && (
              <Card className="border-green-200 dark:border-green-900">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                    <PlusCircle className="h-4 w-4" />
                    Added Stages ({comparison.stageDiff.added.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {comparison.stageDiff.added.map((stage: WorkflowStage) => (
                    <div
                      key={stage.id}
                      className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded"
                    >
                      <div className="font-medium text-sm">{stage.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stage.checklistItems?.length || 0} checklist items
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Modified Stages */}
            {comparison.stageDiff.modified.length > 0 && (
              <Card className="border-yellow-200 dark:border-yellow-900">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Modified Stages ({comparison.stageDiff.modified.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comparison.stageDiff.modified.map(
                    (item: {
                      old: WorkflowStage;
                      new: WorkflowStage;
                      changes: string[];
                    }) => (
                      <div
                        key={item.new.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-900 rounded"
                      >
                        <div className="font-medium text-sm mb-2">
                          {item.new.name}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.changes.map((change: string) => (
                            <Badge
                              key={change}
                              variant="outline"
                              className="text-xs"
                            >
                              {change}
                            </Badge>
                          ))}
                        </div>

                        {item.changes.includes("checklistItems") && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Checklist: {item.old.checklistItems?.length || 0} →{" "}
                            {item.new.checklistItems?.length || 0} items
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Changes */}
            {comparison.stageDiff.added.length === 0 &&
              comparison.stageDiff.removed.length === 0 &&
              comparison.stageDiff.modified.length === 0 &&
              comparison.metadataChanges.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">No differences found</p>
                  <p className="text-sm">These versions are identical</p>
                </div>
              )}
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
