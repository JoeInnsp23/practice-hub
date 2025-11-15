"use client";

import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ToilBalanceWidget } from "@/components/employee-hub/toil/toil-balance-widget";
import { ToilHistoryTable } from "@/components/employee-hub/toil/toil-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ToilPage() {
  // Fetch TOIL data
  const { data: toilBalance, isLoading: balanceLoading } =
    trpc.toil.getBalance.useQuery({});
  const { data: toilHistoryResponse, isLoading: historyLoading } =
    trpc.toil.getHistory.useQuery({});
  const { data: expiringToil, isLoading: expiringLoading } =
    trpc.toil.getExpiringToil.useQuery({});

  const toilHistory = toilHistoryResponse?.history ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">TOIL Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your Time Off In Lieu (TOIL) balance
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget
          title="Current TOIL Balance"
          value={
            toilBalance
              ? `${toilBalance.balance.toFixed(1)} hours`
              : "Loading..."
          }
          icon={TrendingUp}
          loading={balanceLoading}
          iconColor="text-primary"
        />
        <KPIWidget
          title="Balance in Days"
          value={
            toilBalance ? `${toilBalance.balanceInDays} days` : "Loading..."
          }
          icon={Clock}
          loading={balanceLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Expiring Soon"
          value={
            expiringToil
              ? `${expiringToil.totalExpiringHours.toFixed(1)} hours`
              : "Loading..."
          }
          icon={AlertTriangle}
          loading={expiringLoading}
          iconColor="text-orange-600"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOIL History - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                TOIL Accrual History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-full"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              ) : toilHistory && toilHistory.length > 0 ? (
                <ToilHistoryTable history={toilHistory} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No TOIL accrual history yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    TOIL is accrued when you work overtime hours
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - TOIL Balance Widget */}
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

          {/* TOIL Info Card */}
          <Card className="mt-6 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              About TOIL
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Time Off In Lieu (TOIL) is accrued when you work overtime hours
                beyond your standard working week.
              </p>
              <div className="border-t pt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Accrual Rate:</span>
                  <span className="font-medium">1:1 (hour for hour)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry:</span>
                  <span className="font-medium">6 months</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
