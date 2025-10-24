import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UtilizationAlertsProps {
  stats:
    | Array<{
        userId: string;
        firstName: string | null;
        lastName: string | null;
        utilization: number;
        totalLoggedHours: number;
        capacityHours: number;
        status: "overallocated" | "underutilized" | "optimal";
      }>
    | undefined;
}

export function UtilizationAlerts({ stats }: UtilizationAlertsProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  const overallocated = stats.filter((s) => s.status === "overallocated");
  const underutilized = stats.filter((s) => s.status === "underutilized");

  // Don't show alerts if everyone is optimal
  if (overallocated.length === 0 && underutilized.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overallocated Alert */}
      {overallocated.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            Overallocated Staff ({overallocated.length})
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              The following staff members are working over their capacity.
              Consider redistributing workload or reviewing their assignments:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {overallocated.map((staff) => {
                const overHours = (
                  staff.totalLoggedHours - staff.capacityHours
                ).toFixed(1);
                return (
                  <li key={staff.userId} className="text-sm">
                    <span className="font-medium">
                      {staff.firstName ?? ""} {staff.lastName ?? ""}
                    </span>{" "}
                    - {staff.utilization}% utilization ({overHours} hours over
                    capacity)
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Underutilized Alert */}
      {underutilized.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            Underutilized Staff ({underutilized.length})
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              The following staff members have available capacity. Consider
              assigning additional work or reviewing their workload:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {underutilized.map((staff) => {
                const availableHours = (
                  staff.capacityHours - staff.totalLoggedHours
                ).toFixed(1);
                return (
                  <li key={staff.userId} className="text-sm">
                    <span className="font-medium">
                      {staff.firstName ?? ""} {staff.lastName ?? ""}
                    </span>{" "}
                    - {staff.utilization}% utilization ({availableHours} hours
                    available)
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
