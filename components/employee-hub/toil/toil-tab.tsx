"use client";

import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ToilBalanceWidget } from "@/components/employee-hub/toil/toil-balance-widget";
import { ToilHistoryTable } from "@/components/employee-hub/toil/toil-history-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ToilTabProps {
  onRequestToilLeave: () => void;
}

export function ToilTab({ onRequestToilLeave }: ToilTabProps) {
  // Fetch TOIL data
  const { data: toilBalance, isLoading: balanceLoading } =
    trpc.toil.getBalance.useQuery({});
  const { data: toilHistoryResponse, isLoading: historyLoading } =
    trpc.toil.getHistory.useQuery({});
  const { data: expiringToil } = trpc.toil.getExpiringToil.useQuery({
    daysAhead: 30,
  });

  // Extract TOIL history
  const toilHistory = toilHistoryResponse?.history ?? [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalHours = toilBalance?.balance || 0;
    const totalDays = Number.parseFloat(toilBalance?.balanceInDays || "0");
    const expiringHours = expiringToil?.totalExpiringHours || 0;

    return {
      totalHours,
      totalDays,
      expiringHours,
      expiringDays: Number.parseFloat(expiringToil?.totalExpiringDays || "0"),
    };
  }, [toilBalance, expiringToil]);

  // Check if we have expiring TOIL to show alert
  const hasExpiringToil = stats.expiringHours > 0;

  return (
    <div className="space-y-6">
      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget
          title="TOIL Balance (Hours)"
          value={stats.totalHours.toFixed(1)}
          icon={Clock}
          loading={balanceLoading}
          iconColor="text-primary"
        />
        <KPIWidget
          title="TOIL Balance (Days)"
          value={stats.totalDays.toFixed(1)}
          icon={Calendar}
          loading={balanceLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Expiring Soon (30 days)"
          value={`${stats.expiringHours.toFixed(1)} hrs`}
          icon={AlertTriangle}
          loading={balanceLoading}
          iconColor="text-orange-600"
        />
      </div>

      {/* Expiring TOIL Alert */}
      {hasExpiringToil && (
        <Alert className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">
            TOIL Expiring Soon
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            You have {stats.expiringHours.toFixed(1)} hours (
            {stats.expiringDays.toFixed(1)} days) of TOIL expiring in the next
            30 days. Request leave to use it before it expires.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={onRequestToilLeave} variant="default">
          <Calendar className="h-4 w-4 mr-2" />
          Request TOIL as Leave
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOIL History (2 columns) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              TOIL Accrual History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ) : (
              <ToilHistoryTable history={toilHistory} />
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* TOIL Balance Widget */}
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
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-20 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </div>
            </Card>
          )}

          {/* How TOIL Works Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How TOIL Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Accrual Rate</h4>
                <p className="text-muted-foreground">
                  TOIL is earned at a 1:1 rate for overtime hours worked beyond
                  your contracted hours
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Expiry Period</h4>
                <p className="text-muted-foreground">
                  TOIL expires 6 months after accrual. Use it or lose it!
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Usage</h4>
                <p className="text-muted-foreground">
                  Request TOIL as leave time off. 7.5 hours = 1 day
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Tracking</h4>
                <p className="text-muted-foreground">
                  TOIL is automatically calculated from your approved timesheets
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
