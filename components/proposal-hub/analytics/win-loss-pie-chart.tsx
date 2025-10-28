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

interface WinLossData {
  won: number;
  lost: number;
  winRate: number;
  lossRate: number;
}

interface WinLossPieChartProps {
  data: WinLossData | undefined;
  isLoading?: boolean;
}

export function WinLossPieChart({
  data,
  isLoading = false,
}: WinLossPieChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Win/Loss Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal outcome breakdown
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || (data.won === 0 && data.lost === 0)) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Win/Loss Distribution
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal outcome breakdown
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No closed deals</p>
            <p className="text-xs text-muted-foreground mt-1">
              Win and loss data will appear here when deals are closed
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = [
    { name: "Won", value: data.won, color: "#10b981" },
    { name: "Lost", value: data.lost, color: "#ef4444" },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Win/Loss Distribution
        </h3>
        <p className="text-sm text-muted-foreground">
          {data.won} won, {data.lost} lost ({data.winRate.toFixed(1)}% win rate)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${((percent as number) * 100).toFixed(0)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [value, "Count"]}
          />
          <Legend
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
