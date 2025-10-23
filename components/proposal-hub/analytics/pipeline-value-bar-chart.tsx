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

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface PipelineValueBarChartProps {
  data: { stages: StageData[]; totalValue: number } | undefined;
  isLoading?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  qualified: "Qualified",
  proposal_sent: "Proposal Sent",
  follow_up: "Follow Up",
  won: "Won",
  lost: "Lost",
  dormant: "Dormant",
};

export function PipelineValueBarChart({
  data,
  isLoading = false,
}: PipelineValueBarChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Pipeline Value by Stage
          </h3>
          <p className="text-sm text-muted-foreground">
            Active deals value distribution
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.stages.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Pipeline Value by Stage
          </h3>
          <p className="text-sm text-muted-foreground">
            Active deals value distribution
          </p>
        </div>
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className="text-muted-foreground">No active pipeline</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline value will appear here when deals are created
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const chartData = data.stages.map((stage) => ({
    stage: STAGE_LABELS[stage.stage] || stage.stage,
    value: stage.value,
    count: stage.count,
  }));

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Pipeline Value by Stage
        </h3>
        <p className="text-sm text-muted-foreground">
          Total: £{Math.round(data.totalValue).toLocaleString()}
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
            dataKey="stage"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "value") {
                return [`£${value.toLocaleString()}`, "Value"];
              }
              return [value, name];
            }}
          />
          <Legend
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">
                {value === "value" ? "Value (£)" : value}
              </span>
            )}
          />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="value"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
