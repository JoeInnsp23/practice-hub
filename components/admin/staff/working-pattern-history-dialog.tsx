"use client";

import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";

// Pattern type labels
const PATTERN_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  compressed_hours: "Compressed Hours",
  job_share: "Job Share",
  custom: "Custom",
};

interface WorkingPatternHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function WorkingPatternHistoryDialog({
  open,
  onOpenChange,
  userId,
}: WorkingPatternHistoryDialogProps) {
  // Fetch pattern history for user
  const { data, isLoading } = trpc.workingPatterns.getByUser.useQuery(userId, {
    enabled: open && !!userId,
  });

  // Format working pattern summary
  const formatPatternSummary = (pattern: any): string => {
    const days = [
      { name: "Mon", hours: pattern.mondayHours },
      { name: "Tue", hours: pattern.tuesdayHours },
      { name: "Wed", hours: pattern.wednesdayHours },
      { name: "Thu", hours: pattern.thursdayHours },
      { name: "Fri", hours: pattern.fridayHours },
      { name: "Sat", hours: pattern.saturdayHours },
      { name: "Sun", hours: pattern.sundayHours },
    ];

    const workingDays = days.filter((d) => d.hours > 0);
    const offDays = days.filter((d) => d.hours === 0);

    let summary = "";

    if (workingDays.length > 0) {
      // Group consecutive days with same hours
      const groups: Array<{ days: string[]; hours: number }> = [];
      let currentGroup: { days: string[]; hours: number } | null = null;

      for (const day of workingDays) {
        if (!currentGroup || currentGroup.hours !== day.hours) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { days: [day.name], hours: day.hours };
        } else {
          currentGroup.days.push(day.name);
        }
      }
      if (currentGroup) groups.push(currentGroup);

      summary = groups
        .map((g) => {
          const dayStr =
            g.days.length === 1
              ? g.days[0]
              : `${g.days[0]}-${g.days[g.days.length - 1]}`;
          return `${dayStr} ${g.hours}h`;
        })
        .join(", ");
    }

    if (offDays.length > 0 && offDays.length < 7) {
      const offStr =
        offDays.length === 1
          ? offDays[0].name
          : `${offDays[0].name}-${offDays[offDays.length - 1].name}`;
      summary += summary ? `, ${offStr} off` : `${offStr} off`;
    }

    return summary;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Working Pattern History</DialogTitle>
          <DialogDescription>
            View all historical working patterns for this staff member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          ) : data?.patterns && data.patterns.length > 0 ? (
            <div className="glass-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Pattern Type</TableHead>
                    <TableHead>Weekly Schedule</TableHead>
                    <TableHead className="text-right">
                      Contracted Hours
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.patterns.map((pattern, index) => {
                    const isCurrentPattern = index === 0;
                    const patternDate = new Date(pattern.effectiveFrom);
                    const today = new Date();
                    const isFuture = patternDate > today;

                    return (
                      <TableRow
                        key={pattern.id}
                        className={isCurrentPattern ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(patternDate, "MMM d, yyyy")}</span>
                            {isCurrentPattern && !isFuture && (
                              <Badge variant="default">Current</Badge>
                            )}
                            {isFuture && (
                              <Badge variant="outline">Future</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {PATTERN_TYPE_LABELS[pattern.patternType] ||
                              pattern.patternType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatPatternSummary(pattern)}
                          </div>
                          {pattern.notes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {pattern.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {pattern.contractedHours}h
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No working pattern history found for this staff member.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
