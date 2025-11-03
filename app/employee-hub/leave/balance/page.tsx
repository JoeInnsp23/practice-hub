"use client";

import { Calendar, Clock, Gift, TrendingUp } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { LeaveBalanceWidget } from "@/components/employee-hub/leave/leave-balance-widget";
import { ToilBalanceWidget } from "@/components/employee-hub/toil/toil-balance-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaveBalancePage() {
  // Fetch leave balance
  const { data: balanceResponse, isLoading } = trpc.leave.getBalance.useQuery(
    {},
  );

  // Fetch TOIL data
  const { data: toilBalance } = trpc.toil.getBalance.useQuery({});
  const { data: expiringToil } = trpc.toil.getExpiringToil.useQuery({});

  // Fetch leave history for upcoming leave
  const { data: historyResponse } = trpc.leave.getHistory.useQuery({});
  const leaveHistory = historyResponse?.requests ?? [];

  const balance = balanceResponse?.balance
    ? {
        entitlement: balanceResponse.balance.annualEntitlement,
        used: balanceResponse.balance.annualUsed,
        remaining: balanceResponse.annualRemaining,
        carriedOver: balanceResponse.balance.carriedOver,
        toilBalance: balanceResponse.balance.toilBalance,
        sickUsed: balanceResponse.balance.sickUsed,
      }
    : undefined;

  const annualRemaining = balanceResponse?.annualRemaining || 0;
  const annualEntitlement = balance?.entitlement || 0;
  const annualUsed = balance?.used || 0;
  const sickUsed = balance?.sickUsed || 0;
  const carriedOver = balance?.carriedOver || 0;

  // Calculate upcoming leave
  const upcomingLeave = leaveHistory
    .filter(
      (r) => r.status === "approved" && new Date(r.startDate) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const nextLeave = upcomingLeave[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            My Leave Balances
          </h1>
          <p className="text-muted-foreground mt-2">
            View your current leave balances and entitlements
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/employee-hub/leave/request">Request Leave</Link>
        </Button>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIWidget
          title="Annual Remaining"
          value={`${annualRemaining.toFixed(1)} days`}
          icon={Calendar}
          loading={isLoading}
          iconColor="text-emerald-600"
        />
        <KPIWidget
          title="Total Entitlement"
          value={`${annualEntitlement} days`}
          icon={Gift}
          loading={isLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Used This Year"
          value={`${annualUsed} days`}
          icon={Clock}
          loading={isLoading}
          iconColor="text-orange-600"
        />
        <KPIWidget
          title="Carried Over"
          value={`${carriedOver} days`}
          icon={TrendingUp}
          loading={isLoading}
          iconColor="text-purple-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balance Details - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {balance ? (
            <LeaveBalanceWidget balance={balance} />
          ) : (
            <Card className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </Card>
          )}

          {/* Sick Leave Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sick Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Used This Year
                  </span>
                  <span className="text-2xl font-bold">{sickUsed} days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sick leave is unlimited but monitored for patterns
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Leave */}
          {nextLeave && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Next Booked Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium text-lg">
                    {new Date(nextLeave.startDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {nextLeave.daysCount}{" "}
                    {nextLeave.daysCount === 1 ? "day" : "days"} (
                    {nextLeave.leaveType.replace("_", " ")})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(nextLeave.startDate).toLocaleDateString()} -{" "}
                    {new Date(nextLeave.endDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - TOIL Balance */}
        <div className="lg:col-span-1">
          {toilBalance && expiringToil ? (
            <ToilBalanceWidget
              balance={{
                totalHours: toilBalance.balance,
                totalDays: Number.parseFloat(toilBalance.balanceInDays),
                expiringHours: expiringToil.totalExpiringHours,
                expiringDays: Number.parseFloat(expiringToil.totalExpiringDays),
                expiryDate:
                  expiringToil.expiringToil.length > 0
                    ? expiringToil.expiringToil[0].expiryDate
                    : null,
              }}
            />
          ) : (
            <Card className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
