"use client";

import { AlertCircle, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/app/providers/trpc-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffUtilizationPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();

  // Fetch current utilization
  const { data: utilizationData, isLoading: utilizationLoading } =
    trpc.staffCapacity.getUtilization.useQuery({
      userId: selectedUserId,
    });

  // Fetch utilization trends (12 weeks)
  const { data: trendsData, isLoading: trendsLoading } =
    trpc.staffCapacity.getUtilizationTrends.useQuery({
      userId: selectedUserId,
      weeks: 12,
    });

  // Fetch recommendations
  const { data: recommendationsData } =
    trpc.staffCapacity.getRecommendations.useQuery();

  // Calculate team statistics
  const teamStats = {
    totalStaff: utilizationData?.utilization.length ?? 0,
    overallocated:
      utilizationData?.utilization.filter((u) => u.status === "overallocated")
        .length ?? 0,
    underutilized:
      utilizationData?.utilization.filter((u) => u.status === "underutilized")
        .length ?? 0,
    optimal:
      utilizationData?.utilization.filter((u) => u.status === "optimal")
        .length ?? 0,
  };

  // Transform trends data for chart
  const chartData = trendsData?.trends.map((trend) => ({
    week: new Date(trend.weekStart).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    ...trend.data.reduce(
      (acc, user) => {
        acc[user.userName] = user.utilizationPercent;
        return acc;
      },
      {} as Record<string, number>,
    ),
  }));

  // Get unique user names for chart legend
  const userNames = [
    ...new Set(
      trendsData?.trends.flatMap((t) => t.data.map((d) => d.userName)) ?? [],
    ),
  ];

  // Color palette for chart lines
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Staff Utilization Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track staff utilization and identify resource allocation
            opportunities
          </p>
        </div>

        {/* Team Statistics */}
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
                Optimal Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {teamStats.optimal}
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

        {/* Recommendations */}
        {recommendationsData?.recommendations &&
          recommendationsData.recommendations.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Workload Balancing Recommendations</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {recommendationsData.recommendations.map((rec) => (
                    <li key={rec.message}>{rec.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

        {/* Staff Utilization Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Current Week Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {utilizationLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "skeleton-0",
                  "skeleton-1",
                  "skeleton-2",
                  "skeleton-3",
                  "skeleton-4",
                  "skeleton-5",
                ].map((key) => (
                  <div key={key} className="border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : !utilizationData?.utilization ||
              utilizationData.utilization.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No utilization data available
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {utilizationData.utilization.map((staff) => (
                  <div
                    key={staff.userId}
                    className={`border rounded-lg p-4 space-y-3 ${
                      staff.status === "overallocated"
                        ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                        : staff.status === "underutilized"
                          ? "border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20"
                          : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{staff.userName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {staff.weeklyHours} hrs/week capacity
                        </p>
                      </div>
                      <Badge
                        variant={
                          staff.status === "overallocated"
                            ? "destructive"
                            : staff.status === "underutilized"
                              ? "secondary"
                              : "default"
                        }
                      >
                        {staff.utilizationPercent.toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <Progress
                        value={Math.min(staff.utilizationPercent, 100)}
                        className={
                          staff.status === "overallocated"
                            ? "[&>div]:bg-red-600"
                            : staff.status === "underutilized"
                              ? "[&>div]:bg-yellow-600"
                              : ""
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        {staff.actualHours.toFixed(1)} hrs logged this week
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        setSelectedUserId(
                          selectedUserId === staff.userId
                            ? undefined
                            : staff.userId,
                        )
                      }
                    >
                      {selectedUserId === staff.userId
                        ? "Show All Trends"
                        : "View Individual Trends"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilization Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>12-Week Utilization Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : !chartData || chartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No trend data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis
                    label={{
                      value: "Utilization %",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  {userNames.map((name, index) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
