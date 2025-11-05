"use client";

import { AlertCircle, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamCapacityWidget() {
  const router = useRouter();

  // Fetch current utilization
  const { data, isLoading } = trpc.staffCapacity.getUtilization.useQuery({});

  // Fetch recommendations
  const { data: recommendationsData } =
    trpc.staffCapacity.getRecommendations.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Capacity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalCapacity =
    data?.utilization.reduce((sum, u) => sum + u.weeklyHours, 0) ?? 0;
  const totalActual =
    data?.utilization.reduce((sum, u) => sum + u.actualHours, 0) ?? 0;
  const teamUtilization =
    totalCapacity > 0 ? (totalActual / totalCapacity) * 100 : 0;

  const overallocated =
    data?.utilization.filter((u) => u.status === "overallocated").length ?? 0;
  const underutilized =
    data?.utilization.filter((u) => u.status === "underutilized").length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Capacity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Utilization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Team at {teamUtilization.toFixed(1)}% capacity
            </span>
            <span className="text-sm text-muted-foreground">
              {totalActual.toFixed(0)} / {totalCapacity} hrs
            </span>
          </div>
          <Progress
            value={Math.min(teamUtilization, 100)}
            className={
              teamUtilization > 100
                ? "[&>div]:bg-red-600"
                : teamUtilization < 75
                  ? "[&>div]:bg-yellow-600"
                  : "[&>div]:bg-green-600"
            }
          />
        </div>

        {/* Alerts */}
        {(overallocated > 0 || underutilized > 0) && (
          <div className="space-y-2">
            {overallocated > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{overallocated} staff overallocated</span>
              </div>
            )}
            {underutilized > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>{underutilized} staff underutilized</span>
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendationsData?.recommendations &&
          recommendationsData.recommendations.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>{recommendationsData.recommendations[0].message}</p>
            </div>
          )}

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => router.push("/admin/staff/utilization")}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          View Utilization Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
