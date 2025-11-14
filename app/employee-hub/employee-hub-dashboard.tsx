"use client";

import { endOfWeek, format, startOfWeek } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Umbrella,
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardInteractive } from "@/components/ui/card-interactive";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { HUB_COLORS } from "@/lib/utils/hub-colors";

interface EmployeeHubDashboardProps {
  userName?: string;
}

export function EmployeeHubDashboard({ userName }: EmployeeHubDashboardProps) {
  const { data: session } = useSession();

  // Use passed userName or fall back to session user data
  const rawName = userName || session?.user?.name?.split(" ")[0] || "User";
  const displayName = rawName
    .split(/[\s-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // Calculate current week dates
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  // Fetch timesheet data
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = trpc.timesheets.summary.useQuery({
    startDate: weekStartStr,
    endDate: weekEndStr,
  });

  const { data: submissionStatus } =
    trpc.timesheets.getSubmissionStatus.useQuery({
      weekStartDate: weekStartStr,
    });

  const { data: timesheetSettings } =
    trpc.settings.getTimesheetSettings.useQuery();

  // Fetch leave balance
  const {
    data: leaveBalance,
    isLoading: leaveLoading,
    error: leaveError,
  } = trpc.leave.getBalance.useQuery({});

  // Fetch TOIL balance
  const {
    data: toilBalance,
    isLoading: toilLoading,
    error: toilError,
  } = trpc.toil.getBalance.useQuery({});

  // Fetch pending approvals (for managers)
  const { data: pendingTimesheets } =
    trpc.timesheets.getPendingApprovals.useQuery();
  const { data: teamLeave } = trpc.leave.getTeamLeave.useQuery({});

  const totalHours = summary?.totalHours || 0;
  const minimumHours = timesheetSettings?.minWeeklyHours ?? 37.5;
  const hoursPercentage = (totalHours / minimumHours) * 100;
  const isSubmitted = submissionStatus !== null;

  const annualRemaining = leaveBalance?.annualRemaining || 0;
  const annualEntitlement = leaveBalance?.balance?.annualEntitlement || 0;
  const annualUsed = leaveBalance?.balance?.annualUsed || 0;

  const toilBalanceHours = toilBalance?.balance || 0;
  const toilBalanceDays = toilBalance?.balanceInDays || "0.0";

  const pendingTimesheetCount = pendingTimesheets?.length || 0;
  const pendingLeaveCount =
    teamLeave?.requests.filter((r) => r.status === "pending").length || 0;

  // Show error if critical queries fail
  const hasCriticalError = summaryError || leaveError || toilError;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {displayName}! Here's your personal overview.
        </p>
      </div>

      {/* Error Alert */}
      {hasCriticalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            Some dashboard data failed to load. Please refresh the page or
            contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <Card
        className="animate-lift-in"
        style={{ animationDelay: "0s", opacity: 0 }}
      >
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Link href="/employee-hub/time-entries">
              <Clock className="h-4 w-4 mr-2" />
              Log Time
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employee-hub/leave/request">
              <Umbrella className="h-4 w-4 mr-2" />
              Request Leave
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employee-hub/timesheets">
              <CheckCircle className="h-4 w-4 mr-2" />
              View Timesheets
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employee-hub/leave/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Team Calendar
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Timesheet Widget */}
        <CardInteractive
          moduleColor={HUB_COLORS["employee-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
          ariaLabel="This Week's Timesheet"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              This Week's Timesheet
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full pb-6">
            {summaryLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Hours Logged</span>
                    <span className="font-medium">
                      {totalHours.toFixed(1)} / {minimumHours} hrs
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(hoursPercentage, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {hoursPercentage.toFixed(0)}% complete
                  </p>
                  {isSubmitted && (
                    <p className="text-xs text-emerald-600 mt-2 font-medium">
                      ✓ Submitted for approval
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mt-auto"
                >
                  <Link href="/employee-hub/time-entries">View Timesheet</Link>
                </Button>
              </>
            )}
          </CardContent>
        </CardInteractive>

        {/* Leave Balance Widget */}
        <CardInteractive
          moduleColor={HUB_COLORS["employee-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.2s", opacity: 0 }}
          ariaLabel="Leave Balances"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Umbrella className="h-5 w-5 text-emerald-600" />
              Leave Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full pb-6">
            {leaveLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Annual Leave
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {annualRemaining.toFixed(1)} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      TOIL Balance
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {toilBalanceDays} days
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Entitlement
                    </p>
                    <p className="text-sm">
                      {annualEntitlement} days ({annualUsed} used)
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-auto">
                  <Link href="/employee-hub/leave">View Leave Details</Link>
                </Button>
              </>
            )}
          </CardContent>
        </CardInteractive>

        {/* TOIL Widget */}
        <CardInteractive
          moduleColor={HUB_COLORS["employee-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.3s", opacity: 0 }}
          ariaLabel="TOIL Overview"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              TOIL Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full pb-6">
            {toilLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Current Balance
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {toilBalanceHours.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">In Days</span>
                    <span className="font-medium">{toilBalanceDays} days</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-auto">
                  <Link href="/employee-hub/toil">View TOIL History</Link>
                </Button>
              </>
            )}
          </CardContent>
        </CardInteractive>

        {/* Pending Approvals Widget (Managers Only) */}
        <CardInteractive
          moduleColor={HUB_COLORS["employee-hub"]}
          className="animate-lift-in"
          style={{ animationDelay: "0.4s", opacity: 0 }}
          ariaLabel="Pending Approvals"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full pb-6">
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Timesheets
                </span>
                <span className="text-lg font-bold">
                  {pendingTimesheetCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Leave Requests
                </span>
                <span className="text-lg font-bold">{pendingLeaveCount}</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full mt-auto">
              <Link href="/employee-hub/approvals">Review Queue</Link>
            </Button>
          </CardContent>
        </CardInteractive>
      </div>
    </div>
  );
}
