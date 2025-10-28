"use client";

import { format } from "date-fns";
import { ChevronRight, Clock, FileText, History, User } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface VersionHistoryDialogProps {
  proposalId: string;
  proposalTitle: string;
}

export function VersionHistoryDialog({
  proposalId,
  proposalTitle,
}: VersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );

  // Fetch version history
  const { data: historyData, isLoading } =
    trpc.proposals.getVersionHistory.useQuery(proposalId, {
      enabled: open,
    });

  // Fetch selected version details
  const { data: versionData } = trpc.proposals.getVersionById.useQuery(
    selectedVersionId!,
    {
      enabled: !!selectedVersionId,
    },
  );

  const versions = historyData?.versions || [];
  const currentVersion = historyData?.currentVersion || 1;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View all versions of "{proposalTitle}"
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading version history...
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No version history available yet
              </p>
              <p className="text-xs text-muted-foreground">
                Versions are created when you edit the proposal
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-3">
                {versions.map((version) => {
                  const isCurrent = version.version === currentVersion;
                  return (
                    <div
                      key={version.id}
                      className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
                        isCurrent ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Version Header */}
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isCurrent ? "default" : "secondary"}
                            >
                              Version {version.version}
                            </Badge>
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>

                          {/* Change Description */}
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm font-medium">
                              {version.changeDescription || "No description"}
                            </p>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{version.createdByName || "Unknown"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(
                                  new Date(version.createdAt),
                                  "MMM d, yyyy 'at' h:mm a",
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="flex gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">
                                Monthly:
                              </span>{" "}
                              <span className="font-medium">
                                £{Number(version.monthlyTotal).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Annual:
                              </span>{" "}
                              <span className="font-medium">
                                £{Number(version.annualTotal).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Services:
                              </span>{" "}
                              <span className="font-medium">
                                {Array.isArray(version.services)
                                  ? version.services.length
                                  : 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedVersionId(version.id)}
                        >
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Details Sheet */}
      <Sheet
        open={!!selectedVersionId}
        onOpenChange={(open) => !open && setSelectedVersionId(null)}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {versionData?.version && (
            <>
              <SheetHeader>
                <SheetTitle>
                  Version {versionData.version.version} Details
                </SheetTitle>
                <SheetDescription>
                  {versionData.version.changeDescription || "No description"}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Metadata */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Metadata</h3>
                  <div className="border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Version Number:
                      </span>
                      <span className="font-medium">
                        {versionData.version.version}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created By:</span>
                      <span className="font-medium">
                        {versionData.version.createdByName || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created At:</span>
                      <span className="font-medium">
                        {format(
                          new Date(versionData.version.createdAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">
                        {versionData.version.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Pricing</h3>
                  <div className="border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Pricing Model:
                      </span>
                      <Badge variant="outline">
                        Model {versionData.version.pricingModelUsed || "—"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Monthly Total:
                      </span>
                      <span className="font-semibold text-lg">
                        £{Number(versionData.version.monthlyTotal).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Annual Total:
                      </span>
                      <span className="font-medium">
                        £{Number(versionData.version.annualTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Services</h3>
                  <div className="border rounded-lg divide-y">
                    {Array.isArray(versionData.version.services) &&
                    versionData.version.services.length > 0 ? (
                      versionData.version.services.map(
                        (
                          service: {
                            componentName: string;
                            componentCode: string;
                            calculation?: string;
                            price: number | string;
                          },
                          index: number,
                        ) => (
                          <div key={index} className="p-3 space-y-1">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {service.componentName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {service.componentCode}
                                </p>
                                {service.calculation && (
                                  <p className="text-xs text-muted-foreground italic mt-1">
                                    {service.calculation}
                                  </p>
                                )}
                              </div>
                              <span className="font-semibold text-sm whitespace-nowrap ml-4">
                                £{Number(service.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ),
                      )
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No services in this version
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {versionData.version.notes && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Internal Notes</h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {versionData.version.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                {versionData.version.termsAndConditions && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Terms & Conditions
                    </h3>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {versionData.version.termsAndConditions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
