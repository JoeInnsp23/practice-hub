"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface SalesCycleData {
  avgDaysToWon: number;
  medianDays: number;
  minDays: number;
  maxDays: number;
  byMonth: Array<{
    month: string;
    avgDays: number;
    count: number;
  }>;
}

interface SalesCycleChartProps {
  data: SalesCycleData | undefined;
  isLoading?: boolean;
}

export function SalesCycleChart({
  data,
  isLoading = false,
}: SalesCycleChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sales Cycle Duration
          </h3>
          <p className="text-sm text-muted-foreground">
            Average days to close won deals
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.byMonth.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sales Cycle Duration
          </h3>
          <p className="text-sm text-muted-foreground">
            Average days to close won deals
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-muted-foreground">No won deals data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sales cycle data will appear here when deals are won
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Format month for display (YYYY-MM -> MMM YYYY)
  const chartData = data.byMonth.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      ...item,
      monthLabel: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      median: data.medianDays,
    };
  });

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Sales Cycle Duration
        </h3>
        <p className="text-sm text-muted-foreground">
          Avg: {data.avgDaysToWon} days | Median: {data.medianDays} days |
          Range: {data.minDays}-{data.maxDays} days
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="monthLabel"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            label={{
              value: "Days",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "avgDays") {
                return [`${value} days`, "Avg Duration"];
              }
              if (name === "median") {
                return [`${value} days`, "Median"];
              }
              if (name === "count") {
                return [value, "Deals Won"];
              }
              return [value, name];
            }}
          />
          <Legend
            iconType="line"
            formatter={(value) => {
              const labels: Record<string, string> = {
                avgDays: "Avg Duration",
                median: "Median",
              };
              return (
                <span className="text-sm text-muted-foreground">
                  {labels[value] || value}
                </span>
              );
            }}
          />
          <Bar
            dataKey="avgDays"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="avgDays"
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="median"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
