"use client";

import * as Sentry from "@sentry/nextjs";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { TimesheetRejectModal } from "@/components/employee-hub/timesheets/timesheet-reject-modal";
import { TimesheetSubmissionCard } from "@/components/employee-hub/timesheets/timesheet-submission-card";
import { Button } from "@/components/ui/button";

export default function ApprovalsPage() {
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(
    new Set(),
  );
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);

  const utils = trpc.useUtils();
  const { data: submissions = [], isLoading } =
    trpc.timesheets.getPendingApprovals.useQuery();

  const approveMutation = trpc.timesheets.approve.useMutation({
    onSuccess: () => {
      toast.success("Timesheet approved");
      utils.timesheets.getPendingApprovals.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "approve_timesheet" },
      });
      toast.error(error.message || "Failed to approve timesheet");
    },
  });

  const rejectMutation = trpc.timesheets.reject.useMutation({
    onSuccess: () => {
      toast.success("Timesheet rejected");
      setRejectingId(null);
      utils.timesheets.getPendingApprovals.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "reject_timesheet" },
      });
      toast.error(error.message || "Failed to reject timesheet");
    },
  });

  const bulkApproveMutation = trpc.timesheets.bulkApprove.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} timesheet(s) approved`);
      setSelectedSubmissions(new Set());
      utils.timesheets.getPendingApprovals.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "bulk_approve_timesheets" },
      });
      toast.error(error.message || "Failed to approve timesheets");
    },
  });

  const bulkRejectMutation = trpc.timesheets.bulkReject.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} timesheet(s) rejected`);
      setSelectedSubmissions(new Set());
      setIsBulkRejecting(false);
      utils.timesheets.getPendingApprovals.invalidate();
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { operation: "bulk_reject_timesheets" },
      });
      toast.error(error.message || "Failed to reject timesheets");
    },
  });

  const handleSelectionChange = (id: string, selected: boolean) => {
    const newSelection = new Set(selectedSubmissions);
    if (selected) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedSubmissions(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map((s) => s.id)));
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate({ submissionId: id });
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
  };

  const handleRejectConfirm = (comments: string) => {
    if (rejectingId) {
      rejectMutation.mutate({
        submissionId: rejectingId,
        comments,
      });
    }
  };

  const handleBulkApprove = () => {
    if (selectedSubmissions.size === 0) return;
    bulkApproveMutation.mutate({
      submissionIds: Array.from(selectedSubmissions),
    });
  };

  const handleBulkReject = () => {
    if (selectedSubmissions.size === 0) return;
    setIsBulkRejecting(true);
  };

  const handleBulkRejectConfirm = (comments: string) => {
    bulkRejectMutation.mutate({
      submissionIds: Array.from(selectedSubmissions),
      comments,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-card-foreground">
            Timesheet Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and approve timesheet submissions from your team
          </p>
        </div>

        {submissions.length > 0 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedSubmissions.size === submissions.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>
        )}
      </div>

      {selectedSubmissions.size > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedSubmissions.size} timesheet(s) selected
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={bulkApproveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkReject}
                disabled={bulkRejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="bg-card rounded-lg shadow dark:shadow-slate-900/50 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground">
            All timesheets have been reviewed. New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <TimesheetSubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={handleApprove}
              onReject={handleReject}
              isSelected={selectedSubmissions.has(submission.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </div>
      )}

      <TimesheetRejectModal
        open={rejectingId !== null}
        onOpenChange={(open) => !open && setRejectingId(null)}
        onReject={handleRejectConfirm}
      />

      <TimesheetRejectModal
        open={isBulkRejecting}
        onOpenChange={(open) => !open && setIsBulkRejecting(false)}
        onReject={handleBulkRejectConfirm}
        submissionCount={selectedSubmissions.size}
      />
    </div>
  );
}
