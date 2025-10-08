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

interface ConversionData {
  totalLeads: number;
  totalProposals: number;
  signedProposals: number;
  leadToProposalRate: number;
  proposalToSignedRate: number;
  overallConversionRate: number;
}

interface WinLossChartProps {
  data: ConversionData | undefined;
  isLoading?: boolean;
}

export function WinLossChart({ data, isLoading = false }: WinLossChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Conversion Funnel
          </h3>
          <p className="text-sm text-muted-foreground">
            Lead → Proposal → Signed conversion rates
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      </Card>
    );
  }

  if (!data || data.totalLeads === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Conversion Funnel
          </h3>
          <p className="text-sm text-muted-foreground">
            Lead → Proposal → Signed conversion rates
          </p>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No conversion data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create leads and proposals to see conversion metrics
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Create funnel data
  const chartData = [
    {
      stage: "Leads",
      count: data.totalLeads,
      percentage: 100,
    },
    {
      stage: "Proposals",
      count: data.totalProposals,
      percentage: Number(data.leadToProposalRate.toFixed(1)),
    },
    {
      stage: "Signed",
      count: data.signedProposals,
      percentage: Number(data.overallConversionRate.toFixed(1)),
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Conversion Funnel
        </h3>
        <p className="text-sm text-muted-foreground">
          {data.totalLeads} leads → {data.totalProposals} proposals → {data.signedProposals} signed ({data.overallConversionRate.toFixed(1)}% overall)
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="stage"
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="rgb(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgb(var(--card))",
              border: "1px solid rgb(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => {
              if (name === "count") {
                return [value, "Count"];
              }
              return [`${value}%`, "Conversion Rate"];
            }}
          />
          <Legend
            iconType="line"
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">
                {value === "count" ? "Count" : "Conversion Rate"}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            name="count"
          />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
            name="percentage"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Conversion Rate Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Lead → Proposal</p>
          <p className="text-lg font-semibold text-blue-600">
            {data.leadToProposalRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Proposal → Signed</p>
          <p className="text-lg font-semibold text-purple-600">
            {data.proposalToSignedRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Overall Conversion</p>
          <p className="text-lg font-semibold text-green-600">
            {data.overallConversionRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  );
}
