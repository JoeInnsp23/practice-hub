"use client";

import { format } from "date-fns";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
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

interface CapacityHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CapacityHistoryDialog({
  open,
  onOpenChange,
  userId,
}: CapacityHistoryDialogProps) {
  // Fetch capacity history
  const { data, isLoading } = trpc.staffCapacity.getHistory.useQuery(userId, {
    enabled: open && !!userId,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Capacity History</DialogTitle>
          <DialogDescription>
            Historical capacity records for this staff member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Weekly Hours</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !data?.history || data.history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No capacity history found
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.history.map((record, index) => {
                    const previousRecord = data.history[index + 1];
                    let changeIndicator = null;

                    if (previousRecord) {
                      const diff =
                        record.weeklyHours - previousRecord.weeklyHours;
                      if (diff > 0) {
                        changeIndicator = (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">+{diff} hrs</span>
                          </div>
                        );
                      } else if (diff < 0) {
                        changeIndicator = (
                          <div className="flex items-center text-red-600">
                            <TrendingDown className="h-4 w-4 mr-1" />
                            <span className="text-sm">{diff} hrs</span>
                          </div>
                        );
                      } else {
                        changeIndicator = (
                          <div className="flex items-center text-muted-foreground">
                            <Minus className="h-4 w-4 mr-1" />
                            <span className="text-sm">No change</span>
                          </div>
                        );
                      }
                    }

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(
                            new Date(record.effectiveFrom),
                            "MMM d, yyyy",
                          )}
                        </TableCell>
                        <TableCell>{record.weeklyHours} hrs/week</TableCell>
                        <TableCell>{changeIndicator}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.notes || (
                            <span className="italic">No notes</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(
                            new Date(record.createdAt),
                            "MMM d, yyyy h:mm a",
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
