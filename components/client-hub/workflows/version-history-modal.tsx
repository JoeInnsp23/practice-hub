"use client";

import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  History,
  Layers,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PublishNotesDialog } from "./publish-notes-dialog";
import { VersionComparisonModal } from "./version-comparison-modal";

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

interface StagesSnapshot {
  stages?: WorkflowStage[];
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  onPublishVersion: (
    versionId: string,
    versionNumber: number,
    notes?: string,
  ) => void;
  onRollback?: (
    versionId: string,
    versionNumber: number,
    notes?: string,
  ) => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  workflowId,
  onPublishVersion,
  onRollback,
}: VersionHistoryModalProps) {
  const [comparisonModal, setComparisonModal] = useState<{
    versionId1: string;
    versionId2: string;
    version1Number: number;
    version2Number: number;
  } | null>(null);

  const [publishNotesDialog, setPublishNotesDialog] = useState<{
    versionId: string;
    versionNumber: number;
    action: "publish" | "rollback";
  } | null>(null);

  const { data: versions = [] } = trpc.workflows.listVersions.useQuery(
    workflowId,
    { enabled: isOpen },
  );

  const handleCompare = (versionId: string, versionNumber: number) => {
    // Compare with active version
    const activeVersion = versions.find((v) => v.isActive);
    if (activeVersion && activeVersion.id !== versionId) {
      setComparisonModal({
        versionId1: activeVersion.id,
        versionId2: versionId,
        version1Number: activeVersion.version,
        version2Number: versionNumber,
      });
    } else {
      toast.error("Please select a different version to compare");
    }
  };

  const handlePublishClick = (versionId: string, versionNumber: number) => {
    setPublishNotesDialog({ versionId, versionNumber, action: "publish" });
  };

  const handleRollbackClick = (versionId: string, versionNumber: number) => {
    setPublishNotesDialog({ versionId, versionNumber, action: "rollback" });
  };

  const handlePublishConfirm = (notes: string) => {
    if (!publishNotesDialog) return;

    if (publishNotesDialog.action === "publish") {
      onPublishVersion(
        publishNotesDialog.versionId,
        publishNotesDialog.versionNumber,
        notes,
      );
    } else if (publishNotesDialog.action === "rollback" && onRollback) {
      onRollback(
        publishNotesDialog.versionId,
        publishNotesDialog.versionNumber,
        notes,
      );
    }

    setPublishNotesDialog(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-0 shadow-none">
        <DialogTitle className="sr-only">Version History</DialogTitle>
        <DialogDescription className="sr-only">
          View and manage all versions of this workflow template
        </DialogDescription>

        <Card className="glass-card shadow-xl rounded-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="space-y-1 px-8 pt-4 pb-4 md:px-10 md:pt-6 md:pb-4">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>
              View and manage all versions of this workflow template
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 px-8 md:px-10 pb-8 md:pb-10">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No version history available</p>
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version.id}
                  className={`border rounded-lg p-4 ${
                    version.isActive
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={version.isActive ? "default" : "secondary"}
                          className="font-mono"
                        >
                          v{version.version}
                        </Badge>
                        {version.isActive && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {version.changeType}
                        </Badge>
                      </div>

                      <p className="text-sm font-medium mb-1">{version.name}</p>
                      {version.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {version.description}
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground space-y-1">
                        {version.changeDescription && (
                          <p className="italic">
                            "{version.changeDescription}"
                          </p>
                        )}
                        {version.publishNotes && (
                          <p className="italic text-blue-600 dark:text-blue-400">
                            "{version.publishNotes}"
                          </p>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created{" "}
                            {format(
                              new Date(version.createdAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </span>
                          {version.publishedAt && (
                            <span>
                              Published{" "}
                              {format(
                                new Date(version.publishedAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {(version.stagesSnapshot as StagesSnapshot)?.stages
                            ?.length || 0}{" "}
                          stages
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex gap-2">
                      {!version.isActive && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleCompare(version.id, version.version)
                            }
                          >
                            <GitBranch className="h-3 w-3 mr-1" />
                            Compare
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handlePublishClick(version.id, version.version)
                            }
                          >
                            Activate
                          </Button>
                          {onRollback &&
                            version.version < (versions[0]?.version || 0) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRollbackClick(
                                    version.id,
                                    version.version,
                                  )
                                }
                              >
                                <Undo2 className="h-3 w-3 mr-1" />
                                Rollback
                              </Button>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Comparison Modal */}
        {comparisonModal && (
          <VersionComparisonModal
            isOpen={true}
            onClose={() => setComparisonModal(null)}
            workflowId={workflowId}
            versionId1={comparisonModal.versionId1}
            versionId2={comparisonModal.versionId2}
            version1Number={comparisonModal.version1Number}
            version2Number={comparisonModal.version2Number}
          />
        )}

        {/* Publish Notes Dialog */}
        {publishNotesDialog && (
          <PublishNotesDialog
            isOpen={true}
            onClose={() => setPublishNotesDialog(null)}
            onConfirm={handlePublishConfirm}
            versionNumber={publishNotesDialog.versionNumber}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
