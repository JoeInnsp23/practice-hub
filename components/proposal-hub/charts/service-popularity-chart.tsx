"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ServiceData {
  componentCode: string;
  componentName: string;
  count: number;
  avgPrice: number;
  totalRevenue: number;
  percentage: number;
}

interface ServicePopularityChartProps {
  data: ServiceData[];
  isLoading?: boolean;
}

export function ServicePopularityChart({
  data,
  isLoading = false,
}: ServicePopularityChartProps) {
  // Transform data for chart (horizontal bars)
  const chartData = data.map((item) => ({
    name: item.componentName.length > 30
      ? item.componentName.substring(0, 30) + "..."
      : item.componentName,
    fullName: item.componentName,
    count: Number(item.count),
    percentage: Number(item.percentage),
    avgPrice: Number(item.avgPrice),
  }));

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Service Popularity
          </h3>
          <p className="text-sm text-muted-foreground">
            Most selected services in proposals
          </p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
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
            Service Popularity
          </h3>
          <p className="text-sm text-muted-foreground">
            Most selected services in proposals
          </p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">No service data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create proposals with services to see popularity
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
          Service Popularity
        </h3>
        <p className="text-sm text-muted-foreground">
          Top {chartData.length} most selected services
        </p>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 150, right: 20, top: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            opacity={0.3}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type="number"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="rgb(var(--muted-foreground))"
            fontSize={11}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string, entry: any) => {
              if (name === "percentage") {
                return [
                  `${value.toFixed(1)}% (${entry.payload.count} proposals)`,
                  "Selection Rate",
                ];
              }
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullName;
              }
              return label;
            }}
          />
          <Bar
            dataKey="percentage"
            fill="#8b5cf6"
            radius={[0, 4, 4, 0]}
            name="percentage"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
