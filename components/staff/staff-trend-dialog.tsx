"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/app/providers/trpc-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffTrendDialogProps {
  userId: string | null;
  staffName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffTrendDialog({
  userId,
  staffName,
  open,
  onOpenChange,
}: StaffTrendDialogProps) {
  // Only fetch when dialog is open and userId is set
  const { data: trend, isLoading } =
    trpc.staffStatistics.getStaffUtilizationTrend.useQuery(
      { userId: userId ?? "", weeks: 12 },
      { enabled: open && !!userId },
    );

  // Transform data for chart
  const chartData =
    trend?.weeks.map((week) => ({
      week: new Date(week.weekStartDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      utilization: week.utilization,
      hours: week.loggedHours,
    })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            12-Week Utilization Trend{staffName ? ` - ${staffName}` : ""}
          </DialogTitle>
          <DialogDescription>
            Weekly utilization percentage over the past 12 weeks
            {trend && (
              <span className="block mt-1 text-sm">
                Capacity: {trend.weeklyCapacity} hours per week
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : !chartData || chartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                No trend data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  label={{
                    value: "Utilization %",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-3 border shadow-lg">
                          <p className="font-semibold">
                            {payload[0].payload.week}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Utilization: {payload[0].value}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Hours: {payload[0].payload.hours.toFixed(1)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {/* Reference lines for thresholds */}
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: "100% Capacity",
                    position: "right",
                    fontSize: 12,
                  }}
                />
                <ReferenceLine
                  y={60}
                  stroke="#eab308"
                  strokeDasharray="3 3"
                  label={{
                    value: "60% Threshold",
                    position: "right",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Utilization %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
