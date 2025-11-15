"use client";

import { AlertTriangle, Calendar, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { ToilBalanceWidget } from "@/components/employee-hub/toil/toil-balance-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ToilBalancePage() {
  // Fetch TOIL data
  const { data: toilBalance, isLoading: balanceLoading } =
    trpc.toil.getBalance.useQuery({});
  const { data: expiringToil, isLoading: expiringLoading } =
    trpc.toil.getExpiringToil.useQuery({});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My TOIL Balance</h1>
        <p className="text-muted-foreground mt-2">
          View your current TOIL balance and usage
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOIL Balance Details */}
        <div>
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

        {/* TOIL Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                How TOIL Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Accrual</h4>
                <p className="text-sm text-muted-foreground">
                  TOIL is accrued when you work overtime hours beyond your
                  standard working week (37.5 hours). Accrual is automatic when
                  your manager approves timesheets with overtime.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage</h4>
                <p className="text-sm text-muted-foreground">
                  You can request to use your TOIL balance as leave days. 7.5
                  hours of TOIL = 1 day off.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Expiry</h4>
                <p className="text-sm text-muted-foreground">
                  TOIL expires 6 months after it's accrued. Use it or lose it!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="default" className="w-full">
                <Link href="/employee-hub/leave/request">
                  <Calendar className="h-4 w-4 mr-2" />
                  Request TOIL as Leave
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/employee-hub/toil/history">
                  <Clock className="h-4 w-4 mr-2" />
                  View Accrual History
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expiring TOIL Alert */}
      {expiringToil && expiringToil.totalExpiringHours > 0 && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              TOIL Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              You have {expiringToil.totalExpiringHours.toFixed(1)} hours (
              {expiringToil.totalExpiringDays} days) of TOIL expiring in the
              next 30 days. Request leave to use it before it expires!
            </p>
            <Button
              asChild
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Link href="/employee-hub/leave/request">Request Leave Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
