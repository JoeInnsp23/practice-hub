"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentUtilizationChartProps {
  data:
    | Array<{
        departmentId: string;
        departmentName: string;
        staffCount: number;
        capacityHours: number;
        loggedHours: number;
        utilization: number;
      }>
    | undefined;
  isLoading?: boolean;
}

export function DepartmentUtilizationChart({
  data,
  isLoading,
}: DepartmentUtilizationChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {["skeleton-0", "skeleton-1", "skeleton-2"].map((key) => (
          <div key={key} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No department data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((dept) => (
        <div key={dept.departmentId} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{dept.departmentName}</h4>
              <p className="text-sm text-muted-foreground">
                {dept.staffCount} staff • {dept.loggedHours.toFixed(1)} /{" "}
                {dept.capacityHours.toFixed(1)} hrs
              </p>
            </div>
            <div
              className={`text-xl font-bold ${
                dept.utilization > 100
                  ? "text-red-600"
                  : dept.utilization < 60
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {dept.utilization}%
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                dept.utilization > 100
                  ? "bg-red-600"
                  : dept.utilization < 60
                    ? "bg-yellow-600"
                    : "bg-green-600"
              }`}
              style={{ width: `${Math.min(dept.utilization, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
