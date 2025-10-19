"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { ComplexityChart } from "@/components/proposal-hub/charts/complexity-chart";
import { ModelComparisonChart } from "@/components/proposal-hub/charts/model-comparison-chart";
import { ServicePopularityChart } from "@/components/proposal-hub/charts/service-popularity-chart";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PricingAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Build date range filter
  const dateRange = {
    startDate: dateFrom?.toISOString(),
    endDate: dateTo?.toISOString(),
  };

  // Fetch analytics data
  const { data: modelData, isLoading: modelLoading } =
    trpc.analytics.getModelComparison.useQuery(dateRange);
  const { data: serviceData, isLoading: serviceLoading } =
    trpc.analytics.getServicePopularity.useQuery({
      ...dateRange,
      limit: 10,
    });
  const { data: discountData, isLoading: discountLoading } =
    trpc.analytics.getDiscountAnalysis.useQuery(dateRange);
  const { data: complexityData, isLoading: complexityLoading } =
    trpc.analytics.getComplexityDistribution.useQuery(dateRange);

  const modelStats = modelData?.byModel || [];
  const avgSavingsB = modelData?.avgSavingsWhenModelB || 0;
  const services = serviceData?.services || [];
  const discounts = discountData?.byType || [];
  const complexity = complexityData?.distribution || [];

  // Clear filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Pricing Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Model comparison, service popularity, and discount analysis
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <span className="text-sm font-medium text-foreground">
            Date Range:
          </span>
          <div className="flex gap-2 items-center flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Model A vs Model B Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ModelComparisonChart
            data={modelStats as any}
            avgSavingsB={avgSavingsB}
            isLoading={modelLoading}
          />
        </div>
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Savings Analysis</h3>
            </div>
            {modelLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    When Model B Chosen
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    £{Math.round(avgSavingsB).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    saved on average
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Total Proposals
                  </p>
                  <p className="text-xl font-semibold">
                    {modelData?.totalProposals || 0}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Service Popularity Section */}
      <ServicePopularityChart data={services} isLoading={serviceLoading} />

      {/* Discount Analysis Section */}
      <Card className="p-6">
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Discount Frequency Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Usage of different discount types
          </p>
        </div>
        {discountLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading discounts...</div>
          </div>
        ) : discounts.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-muted-foreground">
                No discount data available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Discounts will appear here when applied to proposals
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discount Type</TableHead>
                  <TableHead className="text-right">Usage Count</TableHead>
                  <TableHead className="text-right">Avg Amount</TableHead>
                  <TableHead className="text-right">Total Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.type}>
                    <TableCell className="font-medium capitalize">
                      {discount.type === "newClient"
                        ? "New Client"
                        : discount.type}
                    </TableCell>
                    <TableCell className="text-right">
                      {discount.count}
                    </TableCell>
                    <TableCell className="text-right">
                      £{Math.round(discount.avgAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      £{Math.round(discount.totalAmount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Complexity Distribution Section */}
      <ComplexityChart data={complexity} isLoading={complexityLoading} />
    </div>
  );
}
