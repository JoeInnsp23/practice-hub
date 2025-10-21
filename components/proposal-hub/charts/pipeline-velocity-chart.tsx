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

interface VelocityStageData {
  stage: string;
  count: number;
  avgDays: number;
  minDays: number;
  maxDays: number;
}

interface PipelineVelocityData {
  velocityByStage: VelocityStageData[];
  avgTimeToWin: number;
  totalTransitions: number;
}

interface PipelineVelocityChartProps {
  data: PipelineVelocityData | undefined;
  isLoading?: boolean;
}

export function PipelineVelocityChart({
  data,
  isLoading = false,
}: PipelineVelocityChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Pipeline Velocity
          </h3>
          <p className="text-sm text-muted-foreground">
            Average time spent in each sales stage
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.totalTransitions === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Pipeline Velocity
          </h3>
          <p className="text-sm text-muted-foreground">
            Average time spent in each sales stage
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">
              No velocity data available yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stage transitions will appear here as proposals move through the
              pipeline
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Format chart data with stage labels (only stages with data)
  const chartData = data.velocityByStage
    .filter((stage) => stage.count > 0) // Only show stages with data
    .map((stage) => {
      const stageConfig = SALES_STAGES[stage.stage as keyof typeof SALES_STAGES];
      return {
        name: stageConfig?.label || stage.stage,
        avgDays: stage.avgDays,
        minDays: stage.minDays,
        maxDays: stage.maxDays,
        count: stage.count,
        stage: stage.stage,
      };
    });

  // Get colors for each stage
  const getStageColor = (stage: string) => {
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

  // Find slowest stage (bottleneck)
  const slowestStage = chartData.reduce((prev, current) =>
    prev.avgDays > current.avgDays ? prev : current,
  );

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Pipeline Velocity
        </h3>
        <p className="text-sm text-muted-foreground">
          Average time: {data.avgTimeToWin} days to win | {data.totalTransitions}{" "}
          total transitions
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
            dataKey="name"
            stroke="rgb(var(--muted-foreground))"
            fontSize={11}
            angle={-45}
            textAnchor="end"
            height={80}
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
                return [value, "Avg Days"];
              }
              if (name === "minDays") {
                return [value, "Min Days"];
              }
              if (name === "maxDays") {
                return [value, "Max Days"];
              }
              if (name === "count") {
                return [value, "Transitions"];
              }
              return [value, name];
            }}
          />
          <Legend
            iconType="rect"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">
                {value === "avgDays" ? "Average Days" : value}
              </span>
            )}
          />
          <Bar dataKey="avgDays" name="avgDays" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.stage} fill={getStageColor(entry.stage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Velocity Insights */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Avg Time to Win</p>
            <p className="text-lg font-semibold text-green-600">
              {data.avgTimeToWin} days
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bottleneck Stage</p>
            <p className="text-lg font-semibold text-amber-600">
              {slowestStage.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Longest Duration</p>
            <p className="text-lg font-semibold text-purple-600">
              {slowestStage.avgDays} days
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
