"use client";

import { AlertCircle, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { DepartmentUtilizationChart } from "@/components/staff/department-utilization-chart";
import { StaffComparisonTable } from "@/components/staff/staff-comparison-table";
import { StaffTrendDialog } from "@/components/staff/staff-trend-dialog";
import { StaffUtilizationCard } from "@/components/staff/staff-utilization-card";
import { UtilizationAlerts } from "@/components/staff/utilization-alerts";
import { UtilizationHeatmap } from "@/components/staff/utilization-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { exportStaffUtilizationToCSV } from "@/lib/utils/export-csv";

export default function StaffStatisticsPage() {
  // Date range state - default to current week
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const getEndOfWeek = () => {
    const startDate = new Date(getStartOfWeek());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate.toISOString().split("T")[0];
  };

  const [dateRange, _setDateRange] = useState({
    startDate: getStartOfWeek(),
    endDate: getEndOfWeek(),
  });
  const [selectedDepartment, _setSelectedDepartment] = useState<
    string | undefined
  >();
  const [trendDialogUserId, setTrendDialogUserId] = useState<string | null>(
    null,
  );
  const [trendDialogStaffName, setTrendDialogStaffName] = useState<string>("");

  // Fetch staff utilization data
  const { data: stats, isLoading: statsLoading } =
    trpc.staffStatistics.getStaffUtilization.useQuery({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      departmentId: selectedDepartment,
    });

  // Fetch department utilization
  const { data: deptStats, isLoading: deptLoading } =
    trpc.staffStatistics.getDepartmentUtilization.useQuery({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  // Calculate team statistics
  const teamStats = {
    totalStaff: stats?.summary.totalStaff ?? 0,
    averageUtilization: stats?.summary.averageUtilization ?? 0,
    overallocated: stats?.summary.overallocated ?? 0,
    underutilized: stats?.summary.underutilized ?? 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Statistics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track staff utilization and identify resource allocation
            opportunities
          </p>
        </div>

        {/* Team Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {teamStats.totalStaff}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {teamStats.averageUtilization}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overallocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  {teamStats.overallocated}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Underutilized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-600">
                  {teamStats.underutilized}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilization Alerts */}
        <UtilizationAlerts stats={stats?.staff} />

        {/* Advanced Analytics Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="cards" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="cards">Individual View</TabsTrigger>
                <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                <TabsTrigger value="comparison">Comparison Table</TabsTrigger>
              </TabsList>

              {/* Individual Cards View */}
              <TabsContent value="cards" className="mt-0">
                {statsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : !stats?.staff || stats.staff.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No utilization data available for the selected period
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.staff.map((staff) => (
                      <StaffUtilizationCard
                        key={staff.userId}
                        staff={staff}
                        onViewTrend={(userId) => {
                          setTrendDialogUserId(userId);
                          setTrendDialogStaffName(
                            `${staff.firstName} ${staff.lastName}`,
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Heatmap View */}
              <TabsContent value="heatmap" className="mt-0">
                <UtilizationHeatmap
                  staff={stats?.staff}
                  isLoading={statsLoading}
                />
              </TabsContent>

              {/* Comparison Table View */}
              <TabsContent value="comparison" className="mt-0">
                <StaffComparisonTable
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onExport={exportStaffUtilizationToCSV as any}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Department Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Department Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <DepartmentUtilizationChart
              data={deptStats?.departments}
              isLoading={deptLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Dialog */}
      <StaffTrendDialog
        userId={trendDialogUserId}
        staffName={trendDialogStaffName}
        open={!!trendDialogUserId}
        onOpenChange={(open) => {
          if (!open) {
            setTrendDialogUserId(null);
            setTrendDialogStaffName("");
          }
        }}
      />
    </div>
  );
}
