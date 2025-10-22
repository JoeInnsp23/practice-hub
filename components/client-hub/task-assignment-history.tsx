"use client";

import { format } from "date-fns";
import { ArrowRight, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

interface TaskAssignmentHistoryProps {
  taskId: string;
}

export function TaskAssignmentHistory({ taskId }: TaskAssignmentHistoryProps) {
  const { data: history, isLoading } = trpc.tasks.getAssignmentHistory.useQuery(
    { taskId },
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No assignment changes yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case "preparer":
        return "Preparer";
      case "reviewer":
        return "Reviewer";
      case "assigned_to":
        return "Assigned To";
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Assignment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="relative flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
            >
              {/* Timeline connector */}
              {index < history.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border" />
              )}

              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                <User className="h-4 w-4 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getAssignmentTypeLabel(entry.assignmentType)}
                    </Badge>

                    {entry.fromUser ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium">
                          {entry.fromUser.firstName} {entry.fromUser.lastName}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-primary">
                          {entry.toUser.firstName} {entry.toUser.lastName}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Assigned to:{" "}
                        </span>
                        <span className="font-medium text-primary">
                          {entry.toUser.firstName} {entry.toUser.lastName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.changedAt), "MMM d, yyyy h:mm a")}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Changed by:{" "}
                  <span className="font-medium">
                    {entry.changedBy.firstName} {entry.changedBy.lastName}
                  </span>
                </div>

                {entry.changeReason && (
                  <div className="mt-2 p-2 rounded bg-muted/50 text-sm text-muted-foreground">
                    <span className="font-medium">Reason:</span>{" "}
                    {entry.changeReason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
