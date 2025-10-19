"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ComplexityData {
  complexity: string;
  count: number;
  totalValue: number;
  avgValue: number;
}

interface ComplexityChartProps {
  data: ComplexityData[];
  isLoading?: boolean;
}

// Color palette for complexity levels
const COMPLEXITY_COLORS: Record<string, string> = {
  Clean: "#10b981", // green
  Average: "#3b82f6", // blue
  Complex: "#f59e0b", // amber
  Disaster: "#ef4444", // red
  Unknown: "#64748b", // slate
};

export function ComplexityChart({
  data,
  isLoading = false,
}: ComplexityChartProps) {
  // Filter out unknown and transform data
  const chartData = data
    .filter((item) => item.complexity !== "Unknown" && item.count > 0)
    .map((item) => ({
      name: item.complexity,
      value: Number(item.count),
      avgPrice: Number(item.avgValue),
    }));

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Complexity Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            Bookkeeping complexity breakdown
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
          <h3 className="text-lg font-semibold text-foreground">
            Complexity Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            Bookkeeping complexity breakdown
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">
              No complexity data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Proposals with bookkeeping services will show here
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Complexity Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          {total} proposals with bookkeeping services
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
              const percent = (((entry.value as number) / total) * 100).toFixed(
                0,
              );
              return `${entry.name} (${percent}%)`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={COMPLEXITY_COLORS[entry.name] || "#64748b"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "value") {
                return [`${value} proposals`, "Count"];
              }
              return [value, name];
            }}
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

      {/* Average pricing by complexity */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        {chartData.map((item) => (
          <div key={item.name}>
            <p className="text-xs text-muted-foreground">{item.name} Avg</p>
            <p className="text-sm font-semibold">
              £{Math.round(item.avgPrice).toLocaleString()}/mo
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
