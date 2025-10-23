"use client";

import { format } from "date-fns";
import { Clock, FileText, History, User } from "lucide-react";
import { useState } from "react";
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
import { trpc } from "@/lib/trpc/client";

interface LegalVersionHistoryDialogProps {
  pageType: "privacy" | "terms" | "cookie_policy";
  pageTitle: string;
  currentVersion: number;
}

/**
 * Legal Version History Dialog Component
 * Displays version history for legal pages via activity logs
 */
export function LegalVersionHistoryDialog({
  pageType,
  pageTitle,
  currentVersion,
}: LegalVersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);

  // Fetch version history from activity logs
  const { data: historyData, isLoading } =
    trpc.legal.getVersionHistory.useQuery(
      { pageType },
      {
        enabled: open, // Only fetch when dialog is opened
      },
    );

  const versions = historyData || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View all versions of "{pageTitle}"
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
              Versions are created when you edit the legal page
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
                    className={`border rounded-lg p-4 ${
                      isCurrent ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Version Header */}
                      <div className="flex items-center gap-2">
                        <Badge variant={isCurrent ? "default" : "secondary"}>
                          Version {version.version || "—"}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>

                      {/* Action Description */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                          {version.description || "No description"}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{version.updatedBy || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(
                              new Date(version.updatedAt),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
