"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface UtilizationHeatmapProps {
  staff:
    | Array<{
        userId: string;
        firstName: string | null;
        lastName: string | null;
        departmentName: string | null;
        utilization: number;
        status: "overallocated" | "underutilized" | "optimal";
      }>
    | undefined;
  isLoading?: boolean;
}

export function UtilizationHeatmap({
  staff,
  isLoading,
}: UtilizationHeatmapProps) {
  const getColorClass = (utilization: number) => {
    if (utilization > 100) {
      return "bg-red-500 hover:bg-red-600"; // Overallocated
    }
    if (utilization >= 60 && utilization <= 100) {
      return "bg-green-500 hover:bg-green-600"; // Optimal
    }
    if (utilization >= 40 && utilization < 60) {
      return "bg-yellow-500 hover:bg-yellow-600"; // Underutilized
    }
    return "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"; // Severely underutilized
  };

  const getStatusLabel = (utilization: number) => {
    if (utilization > 100) return "Overallocated";
    if (utilization >= 60 && utilization <= 100) return "Optimal";
    if (utilization >= 40 && utilization < 60) return "Underutilized";
    return "Severely Underutilized";
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="flex gap-2">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!staff || staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No staff data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-sm">Overallocated (&gt;100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-sm">Optimal (60-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span className="text-sm">Underutilized (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          <span className="text-sm">Severely Underutilized (&lt;40%)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-2">
        {staff.map((member) => (
          <div key={member.userId} className="flex items-center gap-2 group">
            {/* Staff Name Column */}
            <div className="w-48 flex-shrink-0">
              <div className="font-medium">
                {member.firstName ?? ""} {member.lastName ?? ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {member.departmentName || "No Department"}
              </div>
            </div>

            {/* Utilization Cell */}
            <div className="flex-1 relative">
              <div
                className={cn(
                  "h-12 rounded transition-all cursor-pointer flex items-center justify-center text-white font-semibold",
                  getColorClass(member.utilization),
                )}
                title={`${member.firstName ?? ""} ${member.lastName ?? ""}: ${member.utilization}% - ${getStatusLabel(member.utilization)}`}
              >
                {member.utilization}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center pt-4 border-t">
        Showing utilization heatmap for {staff.length} staff member
        {staff.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
