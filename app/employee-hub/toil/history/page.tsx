"use client";

import { Clock, Download, TrendingUp } from "lucide-react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ToilHistoryTable } from "@/components/employee-hub/toil/toil-history-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ToilHistoryPage() {
  // Fetch TOIL data
  const { data: toilBalance, isLoading: balanceLoading } =
    trpc.toil.getBalance.useQuery({});
  const { data: toilHistoryResponse, isLoading: historyLoading } =
    trpc.toil.getHistory.useQuery({});

  const toilHistory = toilHistoryResponse?.history ?? [];

  // Calculate stats from history
  const stats = {
    totalAccrued: toilHistory.reduce((sum, h) => sum + h.hoursAccrued, 0) || 0,
    totalUsed: 0, // Usage tracking not yet implemented
    totalExpired:
      toilHistory
        .filter((h) => h.expired)
        .reduce((sum, h) => sum + h.hoursAccrued, 0) || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            TOIL Accrual History
          </h1>
          <p className="text-muted-foreground mt-2">
            View your complete TOIL accrual and usage history
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPIWidget
          title="Current Balance"
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
          title="Total Accrued"
          value={`${stats.totalAccrued.toFixed(1)} hours`}
          icon={Clock}
          loading={historyLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Total Used"
          value={`${stats.totalUsed.toFixed(1)} hours`}
          icon={Clock}
          loading={historyLoading}
          iconColor="text-primary"
        />
        <KPIWidget
          title="Total Expired"
          value={`${stats.totalExpired.toFixed(1)} hours`}
          icon={Clock}
          loading={historyLoading}
          iconColor="text-orange-600"
        />
      </div>

      {/* TOIL History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-8 bg-muted rounded w-full"></div>
            </div>
          ) : toilHistory && toilHistory.length > 0 ? (
            <ToilHistoryTable history={toilHistory} />
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No TOIL history yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                TOIL is accrued when you work overtime hours beyond your
                standard week
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
