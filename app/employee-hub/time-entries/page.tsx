"use client";

import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Send,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { DatePickerButton } from "@/components/employee-hub/timesheets/date-picker-button";
import { WeeklySummaryCard } from "@/components/employee-hub/timesheets/weekly-summary-card";
import { WeeklyTimesheetGrid } from "@/components/employee-hub/timesheets/weekly-timesheet-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export default function TimePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const utils = trpc.useUtils();

  const { data: submissionStatus } =
    trpc.timesheets.getSubmissionStatus.useQuery({
      weekStartDate: weekStartStr,
    });

  const { data: summary } = trpc.timesheets.summary.useQuery({
    startDate: weekStartStr,
    endDate: weekEndStr,
  });

  const { data: weeklySummary } = trpc.timesheets.getWeeklySummary.useQuery({
    weekStartDate: weekStartStr,
    weekEndDate: weekEndStr,
  });

  const { data: leaveBalance } = trpc.leave.getBalance.useQuery({});

  // Fetch user timesheet settings (Story 6.3)
  const { data: timesheetSettings } =
    trpc.settings.getTimesheetSettings.useQuery();

  const submitMutation = trpc.timesheets.submit.useMutation({
    onSuccess: () => {
      toast.success("Timesheet submitted for approval");
      utils.timesheets.getSubmissionStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit timesheet");
    },
  });

  const copyPreviousWeekMutation = trpc.timesheets.copyPreviousWeek.useMutation(
    {
      onSuccess: (result) => {
        if (result.entriesCopied === 0) {
          toast.error("Previous week is empty. Nothing to copy.");
        } else {
          toast.success(
            `Copied ${result.entriesCopied} entries from previous week`,
          );
          utils.timesheets.getWeek.invalidate();
          utils.timesheets.summary.invalidate();
          utils.timesheets.getWeeklySummary.invalidate();
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to copy previous week");
      },
    },
  );

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

  const handleCopyPreviousWeek = () => {
    copyPreviousWeekMutation.mutate({
      currentWeekStartDate: weekStartStr,
      currentWeekEndDate: weekEndStr,
    });
  };

  const isSubmitted = submissionStatus !== null;
  const isReadOnly = isSubmitted && submissionStatus?.status === "pending";
  const totalHours = summary?.totalHours || 0;
  // Use user's configured minimum weekly hours (default 37.5)
  const minimumHours = timesheetSettings?.minWeeklyHours ?? 37.5;
  const canSubmit = totalHours >= minimumHours && !isSubmitted;

  // Calculate TOIL balance in days
  const toilBalanceHours = leaveBalance?.balance?.toilBalance || 0;
  const toilBalanceDays = (toilBalanceHours / 7.5).toFixed(1);

  // Calculate holiday balance
  const annualRemaining = leaveBalance?.annualRemaining || 0;

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
        return <Badge variant="destructive">Rejected</Badge>;
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
          {/* Enhanced Date Picker (AC12) */}
          <DatePickerButton
            selectedWeekStart={currentWeekStart}
            onWeekChange={setCurrentWeekStart}
            displayFormat="short"
          />
        </div>
      </div>

      {/* TOIL & Holiday Balance Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              TOIL Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {toilBalanceHours.toFixed(1)} hours
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ({toilBalanceDays} days)
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Leave Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{annualRemaining} days</p>
            <p className="text-sm text-muted-foreground mt-1">
              {leaveBalance?.balance
                ? `${leaveBalance.balance.annualEntitlement} - ${leaveBalance.balance.annualUsed} used`
                : "Not yet configured"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg shadow dark:shadow-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              Week of {format(currentWeekStart, "MMM d")} -{" "}
              {format(weekEnd, "MMM d, yyyy")}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-muted-foreground">
                Total Hours:{" "}
                <span className="font-semibold text-foreground">
                  {totalHours}h
                </span>
                {!isSubmitted && (
                  <span className="ml-1 text-xs">
                    (
                    {totalHours >= minimumHours
                      ? "Ready to submit"
                      : `Need ${minimumHours - totalHours}h more`}
                    )
                  </span>
                )}
              </p>
              {getStatusBadge()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSubmitted && (
              <>
                <Button
                  onClick={handleCopyPreviousWeek}
                  disabled={copyPreviousWeekMutation.isPending || isReadOnly}
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copyPreviousWeekMutation.isPending
                    ? "Copying..."
                    : "Copy Last Week"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitMutation.isPending
                    ? "Submitting..."
                    : "Submit Week for Approval"}
                </Button>
              </>
            )}
          </div>
        </div>

        {submissionStatus?.status === "rejected" &&
          submissionStatus.reviewerComments && (
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
              This week has been submitted for approval. Time entries are
              read-only until reviewed.
            </p>
          </div>
        )}

        {/* Weekly Timesheet Grid (AC1-AC4, AC11, AC14) */}
        <WeeklyTimesheetGrid
          weekStartDate={currentWeekStart}
          isReadOnly={isReadOnly}
          dailyTargetHours={timesheetSettings?.dailyTargetHours ?? 7.5}
        />
      </div>

      {/* Weekly Summary Card with Pie Chart */}
      {weeklySummary && (
        <WeeklySummaryCard
          summary={{
            totalHours: weeklySummary.totalHours,
            billableHours: weeklySummary.billableHours,
            nonBillableHours: weeklySummary.nonBillableHours,
            billablePercentage: weeklySummary.billablePercentage,
            workTypeBreakdown: weeklySummary.workTypeBreakdown,
          }}
        />
      )}
    </div>
  );
}
