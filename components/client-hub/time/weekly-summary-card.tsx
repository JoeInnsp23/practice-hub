"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklySummaryData {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  billablePercentage: number;
  workTypeBreakdown: Array<{
    name: string;
    hours: number;
    percentage: number;
  }>;
}

interface WeeklySummaryCardProps {
  summary: WeeklySummaryData;
}

// Color mapping for work types (matching story requirements)
const WORK_TYPE_COLORS: Record<string, string> = {
  WORK: "#3b82f6", // blue
  TOIL: "#10b981", // green
  HOLIDAY: "#f97316", // orange
  SICK: "#ef4444", // red
  OTHER: "#6b7280", // gray
};

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const { totalHours, billableHours, billablePercentage, workTypeBreakdown } =
    summary;

  // Prepare data for pie chart
  const chartData = workTypeBreakdown.map((item) => ({
    name: item.name,
    value: item.hours,
    percentage: item.percentage,
    fill: WORK_TYPE_COLORS[item.name] || WORK_TYPE_COLORS.OTHER,
  }));

  // Empty state
  if (totalHours === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No time logged this week.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Weekly Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billable</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {billableHours.toFixed(1)}h
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Billable %</p>
            <p className="text-2xl font-bold">
              {billablePercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Work Type Pie Chart */}
        {chartData.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Work Type Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: { name: string; percentage: number }) =>
                    `${entry.name} (${entry.percentage.toFixed(0)}%)`
                  }
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => {
                    const entry = chartData.find((d) => d.name === value);
                    return entry
                      ? `${value}: ${entry.value.toFixed(1)}h`
                      : value;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
