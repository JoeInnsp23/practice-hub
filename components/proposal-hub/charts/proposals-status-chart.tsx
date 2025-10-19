"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ProposalStatusData {
  status: string;
  count: number;
  totalValue: number;
}

interface ProposalsStatusChartProps {
  data: ProposalStatusData[];
  isLoading?: boolean;
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  draft: "#64748b", // slate
  sent: "#3b82f6", // blue
  viewed: "#8b5cf6", // purple
  signed: "#10b981", // green
  rejected: "#ef4444", // red
  expired: "#f59e0b", // amber
};

export function ProposalsStatusChart({
  data,
  isLoading = false,
}: ProposalsStatusChartProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: Number(item.count),
    value: Number(item.totalValue || 0),
    fill: STATUS_COLORS[item.status] || "#64748b",
  }));

  // Calculate totals
  const totalProposals = chartData.reduce((sum, item) => sum + item.count, 0);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Proposals by Status
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal counts and values by status
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Proposals by Status
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal counts and values by status
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No proposal data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create some proposals to see status distribution
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
          Proposals by Status
        </h3>
        <p className="text-sm text-muted-foreground">
          {totalProposals} proposals worth £
          {Math.round(totalValue).toLocaleString()}/mo
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="status"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => value.toString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "count") {
                return [value, "Proposals"];
              }
              return [`£${Math.round(value).toLocaleString()}`, "Total Value"];
            }}
          />
          <Legend
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground capitalize">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="count"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            name="count"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
