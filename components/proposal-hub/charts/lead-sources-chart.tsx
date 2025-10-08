"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface LeadSourceData {
  source: string | null;
  count: number;
}

interface LeadSourcesChartProps {
  data: LeadSourceData[];
  isLoading?: boolean;
}

// Color palette for sources
const COLORS = [
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#6366f1", // indigo
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function LeadSourcesChart({
  data,
  isLoading = false,
}: LeadSourcesChartProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    name: item.source || "Unknown",
    value: Number(item.count),
  }));

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Lead Sources</h3>
          <p className="text-sm text-muted-foreground">
            Distribution of leads by source
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0 || total === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">Lead Sources</h3>
          <p className="text-sm text-muted-foreground">
            Distribution of leads by source
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No lead data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create some leads to see source distribution
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Lead Sources</h3>
        <p className="text-sm text-muted-foreground">
          {total} leads from {chartData.length} sources
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => {
              const percent = (((entry.value as number) / total) * 100).toFixed(0);
              return `${entry.name} (${percent}%)`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: recharts requires index as key
                  index
                }`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} leads`, "Count"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
