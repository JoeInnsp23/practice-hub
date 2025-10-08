"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface ModelData {
  model: string;
  count: number;
  avgMonthly: number;
  totalRevenue: number;
}

interface ModelComparisonChartProps {
  data: ModelData[];
  avgSavingsB: number;
  isLoading?: boolean;
}

// Color palette for models
const MODEL_COLORS: Record<string, string> = {
  "Model A": "#3b82f6", // blue
  "Model B": "#10b981", // green
};

export function ModelComparisonChart({
  data,
  avgSavingsB,
  isLoading = false,
}: ModelComparisonChartProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    name: item.model,
    value: Number(item.count),
    avgPrice: Number(item.avgMonthly),
    totalRevenue: Number(item.totalRevenue),
  }));

  // Calculate total
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Model A vs Model B
          </h3>
          <p className="text-sm text-muted-foreground">
            Pricing model selection distribution
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
            Model A vs Model B
          </h3>
          <p className="text-sm text-muted-foreground">
            Pricing model selection distribution
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No pricing model data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create proposals to see model distribution
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
          Model A vs Model B
        </h3>
        <p className="text-sm text-muted-foreground">
          {total} proposals across {chartData.length} pricing models
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
              const percent = ((entry.value / total) * 100).toFixed(0);
              return `${entry.name} (${percent}%)`;
            }}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={MODEL_COLORS[entry.name] || "#64748b"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string, entry: any) => {
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

      {/* Stats below chart */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        {chartData.map((model) => (
          <div key={model.name}>
            <p className="text-xs text-muted-foreground">{model.name} Avg</p>
            <p className="text-lg font-semibold">
              £{Math.round(model.avgPrice).toLocaleString()}/mo
            </p>
          </div>
        ))}
      </div>

      {avgSavingsB > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Average Savings (Model B)
          </p>
          <p className="text-lg font-semibold text-green-600">
            £{Math.round(avgSavingsB).toLocaleString()}/mo
          </p>
        </div>
      )}
    </Card>
  );
}
