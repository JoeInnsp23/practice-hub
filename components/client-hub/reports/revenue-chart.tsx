"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

interface RevenueData {
  month: string;
  revenue: number;
  invoiced: number;
  collected: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  period: string;
}

export function RevenueChart({ data, period }: RevenueChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{period}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No revenue data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.invoiced, d.collected)),
    1, // Fallback to prevent -Infinity
  );
  const total = data.reduce((sum, d) => sum + d.collected, 0);
  const avgMonthly = data.length > 0 ? total / data.length : 0;
  const trend =
    data.length > 0
      ? (((data[data.length - 1]?.collected || 0) - (data[0]?.collected || 0)) /
          (data[0]?.collected || 1)) *
        100
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{period}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            <p className="text-sm text-muted-foreground">Total Collected</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Average</p>
              <p className="font-semibold">{formatCurrency(avgMonthly)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth Trend</p>
              <p
                className={`font-semibold flex items-center gap-1 ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
              >
                <TrendingUp className="h-4 w-4" />
                {trend.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Month</p>
              <p className="font-semibold">
                {data.length > 0
                  ? data.reduce((best, current) =>
                      current.collected > best.collected ? current : best,
                    ).month
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.month} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.month}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.collected)}
                  </span>
                </div>
                <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {/* Invoiced bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-200 dark:bg-blue-900"
                    style={{
                      width: `${(item.invoiced / maxValue) * 100}%`,
                    }}
                  />
                  {/* Collected bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-600"
                    style={{
                      width: `${(item.collected / maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span className="text-sm text-muted-foreground">Invoiced</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
