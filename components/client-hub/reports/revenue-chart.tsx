"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
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
  const maxValue = Math.max(...data.map(d => Math.max(d.invoiced, d.collected)));
  const total = data.reduce((sum, d) => sum + d.collected, 0);
  const avgMonthly = total / data.length;
  const trend = ((data[data.length - 1]?.collected || 0) - (data[0]?.collected || 0)) / (data[0]?.collected || 1) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
            <p className="text-sm text-slate-600 mt-1">{period}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            <p className="text-sm text-slate-600">Total Collected</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div>
              <p className="text-sm text-slate-600">Monthly Average</p>
              <p className="font-semibold">{formatCurrency(avgMonthly)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Growth Trend</p>
              <p className={`font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-4 w-4" />
                {trend.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Best Month</p>
              <p className="font-semibold">
                {data.reduce((best, current) =>
                  current.collected > best.collected ? current : best
                ).month}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{item.month}</span>
                  <span className="text-slate-600">{formatCurrency(item.collected)}</span>
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
              <span className="text-sm text-slate-700">Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span className="text-sm text-slate-700">Invoiced</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}