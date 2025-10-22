"use client";

import { useState } from "react";
import { addDays, startOfWeek, endOfWeek, format } from "date-fns";
import { ChevronLeft, ChevronRight, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import toast from "react-hot-toast";

export default function TimePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const utils = trpc.useUtils();

  const { data: submissionStatus } = trpc.timesheets.getSubmissionStatus.useQuery({
    weekStartDate: weekStartStr,
  });

  const { data: summary } = trpc.timesheets.summary.useQuery({
    startDate: weekStartStr,
    endDate: weekEndStr,
  });

  const submitMutation = trpc.timesheets.submit.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted for approval");
      utils.timesheets.getSubmissionStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit timesheet");
    },
  });

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      weekStartDate: weekStartStr,
      weekEndDate: weekEndStr,
    });
  };

  const isSubmitted = submissionStatus !== null;
  const isReadOnly = isSubmitted && submissionStatus?.status === "pending";
  const totalHours = summary?.totalHours || 0;
  const minimumHours = 37.5;
  const canSubmit = totalHours >= minimumHours && !isSubmitted;

  const getStatusBadge = () => {
    if (!submissionStatus) return null;

    switch (submissionStatus.status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            Pending Approval
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            Rejected
          </Badge>
        );
      case "resubmitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Resubmitted
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">
            Time Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your time and submit for approval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisWeek}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow dark:shadow-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              Week of {format(currentWeekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-muted-foreground">
                Total Hours: <span className="font-semibold text-foreground">{totalHours}h</span>
                {!isSubmitted && (
                  <span className="ml-1 text-xs">
                    ({totalHours >= minimumHours ? "Ready to submit" : `Need ${minimumHours - totalHours}h more`})
                  </span>
                )}
              </p>
              {getStatusBadge()}
            </div>
          </div>

          {!isSubmitted && (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit Week for Approval"}
            </Button>
          )}
        </div>

        {submissionStatus?.status === "rejected" && submissionStatus.reviewerComments && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Rejection Feedback
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300">
              {submissionStatus.reviewerComments}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Please correct and resubmit your timesheet.
            </p>
          </div>
        )}

        {isReadOnly && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              This week has been submitted for approval. Time entries are read-only until reviewed.
            </p>
          </div>
        )}

        <div className="border-t pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">Time entry interface coming soon</p>
            <p className="text-sm">
              This will display your time entries for the week with the ability to add, edit, and delete entries
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Billable Hours
          </h3>
          <p className="text-2xl font-bold">{summary?.billableHours || 0}h</p>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Non-Billable Hours
          </h3>
          <p className="text-2xl font-bold">{summary?.nonBillableHours || 0}h</p>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Days Worked
          </h3>
          <p className="text-2xl font-bold">{summary?.daysWorked || 0}</p>
        </div>
      </div>
    </div>
  );
}
