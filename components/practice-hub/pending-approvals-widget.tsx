"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";

export function PendingApprovalsWidget() {
  const router = useRouter();
  const { data: session } = useSession();

  // Query pending approvals - server-side authorization handles role checks
  const { data: submissions, isLoading } =
    trpc.timesheets.getPendingApprovals.useQuery(undefined, {
      enabled: !!session?.user,
      retry: false,
      refetchOnWindowFocus: false,
    });

  // Don't show widget if no session or no pending approvals
  if (!session?.user || isLoading || !submissions || submissions.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              Pending Timesheet Approvals
            </h3>
            <p className="text-sm text-muted-foreground">
              {submissions.length} timesheet
              {submissions.length !== 1 ? "s" : ""} awaiting your review
            </p>
          </div>
        </div>

        <Button
          onClick={() => router.push("/client-hub/time/approvals")}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Review Now
        </Button>
      </div>

      {/* Show preview of pending submissions */}
      {submissions.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-muted-foreground font-medium">
            Recent Submissions:
          </div>
          <div className="space-y-1">
            {submissions.slice(0, 3).map((submission) => (
              <div
                key={submission.id}
                className="text-sm flex items-center justify-between py-1 px-2 rounded bg-muted/50"
              >
                <span>
                  {submission.user.firstName} {submission.user.lastName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {Number(submission.totalHours)}h
                </span>
              </div>
            ))}
          </div>
          {submissions.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{submissions.length - 3} more...
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
