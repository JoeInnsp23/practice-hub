"use client";

import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffUtilizationCardProps {
  staff: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    departmentName: string | null;
    utilization: number;
    totalLoggedHours: number;
    capacityHours: number;
    billablePercentage: number;
    status: "overallocated" | "underutilized" | "optimal";
  };
  onViewTrend?: (userId: string) => void;
}

export function StaffUtilizationCard({
  staff,
  onViewTrend,
}: StaffUtilizationCardProps) {
  return (
    <div
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
          <h3 className="font-semibold">
            {staff.firstName ?? ""} {staff.lastName ?? ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            {staff.role ?? "No Role"}
          </p>
          <p className="text-xs text-muted-foreground">
            {staff.departmentName || "No Department"}
          </p>
        </div>
        <div
          className={`text-2xl font-bold ${
            staff.status === "overallocated"
              ? "text-red-600"
              : staff.status === "underutilized"
                ? "text-yellow-600"
                : "text-green-600"
          }`}
        >
          {staff.utilization}%
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Logged Hours</span>
          <span className="font-medium">
            {staff.totalLoggedHours.toFixed(1)} /{" "}
            {staff.capacityHours.toFixed(1)} hrs
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Billable</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {staff.billablePercentage}%
          </span>
        </div>
      </div>

      {onViewTrend && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewTrend(staff.userId)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          View 12-Week Trend
        </Button>
      )}
    </div>
  );
}
