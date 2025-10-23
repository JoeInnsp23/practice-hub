"use client";

import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface TimesheetSubmission {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: string;
  submittedAt: Date;
  status: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface TimesheetSubmissionCardProps {
  submission: TimesheetSubmission;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
}

export function TimesheetSubmissionCard({
  submission,
  onApprove,
  onReject,
  isSelected,
  onSelectionChange,
}: TimesheetSubmissionCardProps) {
  const userName =
    `${submission.user.firstName || ""} ${submission.user.lastName || ""}`.trim() ||
    submission.user.email;

  const getStatusBadge = () => {
    switch (submission.status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "resubmitted":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
          >
            <Clock className="h-3 w-3 mr-1" />
            Resubmitted
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-start gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelectionChange(submission.id, checked === true)
          }
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-semibold text-lg">{userName}</h3>
              <p className="text-sm text-muted-foreground">
                {submission.user.email}
              </p>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <p className="text-sm text-muted-foreground">Week</p>
              <p className="font-medium">
                {format(new Date(submission.weekStartDate), "MMM d")} -{" "}
                {format(new Date(submission.weekEndDate), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-medium">{submission.totalHours}h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => onApprove(submission.id)}
            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(submission.id)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}
