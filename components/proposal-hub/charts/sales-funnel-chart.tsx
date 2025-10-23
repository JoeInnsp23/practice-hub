"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { SALES_STAGES } from "@/lib/constants/sales-stages";

interface FunnelStageData {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
}

interface SalesFunnelData {
  funnel: FunnelStageData[];
  totalProposals: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
}

interface SalesFunnelChartProps {
  data: SalesFunnelData | undefined;
  isLoading?: boolean;
}

export function SalesFunnelChart({
  data,
  isLoading = false,
}: SalesFunnelChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sales Funnel
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal progression through sales stages
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.totalProposals === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Sales Funnel
          </h3>
          <p className="text-sm text-muted-foreground">
            Proposal progression through sales stages
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-muted-foreground">
              No sales funnel data available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create proposals to see sales stage progression
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Format chart data with stage labels
  const chartData = data.funnel.map((stage) => {
    const stageConfig = SALES_STAGES[stage.stage as keyof typeof SALES_STAGES];
    return {
      name: stageConfig?.label || stage.stage,
      count: stage.count,
      value: stage.value,
      conversionRate: stage.conversionRate,
      stage: stage.stage,
    };
  });

  // Get colors for each stage
  const getStageColor = (stage: string) => {
    const stageConfig = SALES_STAGES[stage as keyof typeof SALES_STAGES];
    // Extract hex color from Tailwind class (simplified mapping)
    const colorMap: Record<string, string> = {
      enquiry: "#64748b", // slate
      qualified: "#9333ea", // purple
      proposal_sent: "#f59e0b", // amber
      follow_up: "#3b82f6", // blue
      won: "#10b981", // green
      lost: "#ef4444", // red
      dormant: "#f97316", // orange
    };
    return colorMap[stage] || "#6b7280";
  };

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">Sales Funnel</h3>
        <p className="text-sm text-muted-foreground">
          {data.totalProposals} total proposals | {data.wonCount} won |{" "}
          {data.lostCount} lost | {data.winRate}% win rate
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="name"
            stroke="rgb(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
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
              if (name === "value") {
                return [`£${value.toLocaleString()}`, "Total Value"];
              }
              if (name === "conversionRate") {
                return [`${value}%`, "Conversion Rate"];
              }
              return [value, name];
            }}
          />
          <Legend
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">
                {value === "count"
                  ? "Proposals"
                  : value === "value"
                    ? "Total Value (£)"
                    : "Conversion Rate (%)"}
              </span>
            )}
          />
          <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.stage} fill={getStageColor(entry.stage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stage Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Active Pipeline</p>
          <p className="text-lg font-semibold text-blue-600">
            {data.funnel
              .filter((s) =>
                ["enquiry", "qualified", "proposal_sent", "follow_up"].includes(
                  s.stage,
                ),
              )
              .reduce((sum, s) => sum + s.count, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Won</p>
          <p className="text-lg font-semibold text-green-600">
            {data.wonCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lost</p>
          <p className="text-lg font-semibold text-red-600">{data.lostCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-lg font-semibold text-purple-600">
            {data.winRate}%
          </p>
        </div>
      </div>
    </Card>
  );
}
