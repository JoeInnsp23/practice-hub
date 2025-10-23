"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface MonthlyTrendData {
  month: string;
  proposals: number;
  won: number;
  lost: number;
  revenue: number;
}

interface MonthlyTrendChartProps {
  data: { trend: MonthlyTrendData[] } | undefined;
  isLoading?: boolean;
}

export function MonthlyTrendChart({
  data,
  isLoading = false,
}: MonthlyTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Monthly Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposals, wins, and losses over time
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.trend.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Monthly Trend
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposals, wins, and losses over time
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-muted-foreground">No trend data</p>
            <p className="text-xs text-muted-foreground mt-1">
              Trends will appear here once you have historical data
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Format month for display (YYYY-MM -> MMM YYYY)
  const chartData = data.trend.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      ...item,
      monthLabel: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
    };
  });

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Monthly Trend</h3>
        <p className="text-sm text-muted-foreground">
          Proposals, wins, and losses over time
        </p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
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
          <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                proposals: "Proposals",
                won: "Won",
                lost: "Lost",
              };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            iconType="line"
            formatter={(value) => {
              const labels: Record<string, string> = {
                proposals: "Proposals",
                won: "Won",
                lost: "Lost",
              };
              return (
                <span className="text-sm text-muted-foreground">
                  {labels[value] || value}
                </span>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="proposals"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            name="proposals"
          />
          <Line
            type="monotone"
            dataKey="won"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            name="won"
          />
          <Line
            type="monotone"
            dataKey="lost"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: "#ef4444", r: 4 }}
            name="lost"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
