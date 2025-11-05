"use client";

import { CheckCircle, Clock, Umbrella } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApprovalQueuePage() {
  // Fetch pending approvals
  const { data: pendingTimesheets = [], isLoading: timesheetsLoading } =
    trpc.timesheets.getPendingApprovals.useQuery();

  const { data: teamLeave, isLoading: leaveLoading } =
    trpc.leave.getTeamLeave.useQuery({});

  const pendingLeaveCount =
    teamLeave?.requests.filter((r) => r.status === "pending").length || 0;

  const isLoading = timesheetsLoading || leaveLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approval Queue</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve team timesheets and leave requests
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timesheet Approvals Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Timesheet Approvals
              </div>
              {pendingTimesheets.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                >
                  {pendingTimesheets.length} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : pendingTimesheets.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending timesheet approvals
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-emerald-600">
                  {pendingTimesheets.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendingTimesheets.length === 1
                    ? "timesheet awaiting review"
                    : "timesheets awaiting review"}
                </p>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/employee-hub/approvals/timesheets">
                    Review Timesheets
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Approvals Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Umbrella className="h-5 w-5 text-emerald-600" />
                Leave Approvals
              </div>
              {pendingLeaveCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                >
                  {pendingLeaveCount} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : pendingLeaveCount === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No pending leave approvals
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-emerald-600">
                  {pendingLeaveCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pendingLeaveCount === 1
                    ? "leave request awaiting review"
                    : "leave requests awaiting review"}
                </p>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/employee-hub/approvals/leave">
                    Review Leave Requests
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/employee-hub/approvals/timesheets">
              <Clock className="h-4 w-4 mr-2" />
              All Timesheet Approvals
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employee-hub/approvals/leave">
              <Umbrella className="h-4 w-4 mr-2" />
              All Leave Approvals
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
