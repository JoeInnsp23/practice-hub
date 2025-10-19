"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportReport } from "@/lib/utils/export-csv";

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Build date range filter
  const dateRange = {
    startDate: dateFrom?.toISOString(),
    endDate: dateTo?.toISOString(),
  };

  // Fetch report data
  const { data: leadStats, isLoading: leadStatsLoading } =
    trpc.analytics.getLeadStats.useQuery(dateRange);
  const { data: pipelineMetrics, isLoading: pipelineLoading } =
    trpc.analytics.getPipelineMetrics.useQuery(dateRange);
  const { data: modelData, isLoading: modelLoading } =
    trpc.analytics.getModelComparison.useQuery(dateRange);
  const { data: serviceData, isLoading: serviceLoading } =
    trpc.analytics.getServicePopularity.useQuery({
      ...dateRange,
      limit: 20,
    });

  // Clear filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Export handlers
  const handleExportLeadSource = () => {
    if (!leadStats?.bySource || leadStats.bySource.length === 0) {
      toast.error("No data to export");
      return;
    }

    const reportData = leadStats.bySource.map((item) => {
      const total = item.count;
      const converted = item.convertedToProposal || 0;
      const conversionRate = total > 0 ? (converted / total) * 100 : 0;

      return {
        source: item.source || "Unknown",
        totalLeads: total,
        converted,
        conversionRate,
      };
    });

    exportReport("lead-source", reportData);
    toast.success("Lead source report exported");
  };

  const handleExportPipeline = () => {
    if (
      !pipelineMetrics?.leadsByStage ||
      pipelineMetrics.leadsByStage.length === 0
    ) {
      toast.error("No data to export");
      return;
    }

    const reportData = pipelineMetrics.leadsByStage.map((item: any) => ({
      stage: item.stage,
      count: item.count,
      totalValue: item.totalValue || 0,
      avgDealSize:
        item.totalValue && item.count ? item.totalValue / item.count : 0,
    }));

    exportReport("pipeline", reportData);
    toast.success("Pipeline report exported");
  };

  const handleExportProposalSuccess = () => {
    if (!modelData?.byModel || modelData.byModel.length === 0) {
      toast.error("No data to export");
      return;
    }

    const reportData = modelData.byModel.map((item) => {
      const total = item.count;
      // Assuming we don't have signed/rejected breakdown by model in current data
      // This would need additional analytics endpoint for accurate data
      return {
        category: item.model,
        total: total,
        signed: 0, // Would need breakdown from analytics
        rejected: 0, // Would need breakdown from analytics
        successRate: 0, // Would need breakdown from analytics
        avgTimeToSign: 0, // Would need breakdown from analytics
      };
    });

    exportReport("proposal-success", reportData);
    toast.success("Proposal success report exported");
  };

  const handleExportRevenue = () => {
    if (!serviceData?.services || serviceData.services.length === 0) {
      toast.error("No data to export");
      return;
    }

    const reportData = serviceData.services.map((item) => ({
      serviceName: item.componentName,
      count: item.count,
      totalRevenue: item.totalRevenue,
      avgPrice: item.avgPrice,
      percentage: item.percentage,
    }));

    exportReport("revenue-by-service", reportData);
    toast.success("Revenue by service report exported");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">
            Export and analyze business performance data
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

      {/* Reports Tabs */}
      <Tabs defaultValue="lead-source" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lead-source">Lead Source</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="proposal-success">Proposal Success</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Lead Source Report */}
        <TabsContent value="lead-source">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Lead Source Effectiveness
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conversion rates by lead source
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLeadSource}
                disabled={
                  leadStatsLoading ||
                  !leadStats?.bySource ||
                  leadStats.bySource.length === 0
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {leadStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading report...</div>
              </div>
            ) : !leadStats?.bySource || leadStats.bySource.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No lead data available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create leads to generate this report
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Total Leads</TableHead>
                      <TableHead className="text-right">
                        Converted to Proposals
                      </TableHead>
                      <TableHead className="text-right">
                        Conversion Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadStats.bySource.map((source) => {
                      const total = source.count;
                      const converted = source.convertedToProposal || 0;
                      const conversionRate =
                        total > 0 ? (converted / total) * 100 : 0;

                      return (
                        <TableRow key={source.source}>
                          <TableCell className="font-medium">
                            {source.source || "Unknown"}
                          </TableCell>
                          <TableCell className="text-right">{total}</TableCell>
                          <TableCell className="text-right">
                            {converted}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                conversionRate >= 50
                                  ? "text-green-600 font-semibold"
                                  : conversionRate >= 25
                                    ? "text-primary"
                                    : "text-muted-foreground"
                              }
                            >
                              {conversionRate.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Pipeline Report */}
        <TabsContent value="pipeline">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Sales Pipeline Report
                </h3>
                <p className="text-sm text-muted-foreground">
                  Deals by stage with value metrics
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPipeline}
                disabled={
                  pipelineLoading ||
                  !pipelineMetrics?.leadsByStage ||
                  pipelineMetrics.leadsByStage.length === 0
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {pipelineLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading report...</div>
              </div>
            ) : !pipelineMetrics?.leadsByStage ||
              pipelineMetrics.leadsByStage.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No pipeline data available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create proposals to generate this report
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Deal Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">
                        Avg Deal Size
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipelineMetrics.leadsByStage.map((stage: any) => (
                      <TableRow key={stage.stage}>
                        <TableCell className="font-medium capitalize">
                          {stage.stage}
                        </TableCell>
                        <TableCell className="text-right">
                          {stage.count}
                        </TableCell>
                        <TableCell className="text-right">
                          £{Math.round(stage.totalValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          £
                          {Math.round(
                            stage.totalValue && stage.count
                              ? stage.totalValue / stage.count
                              : 0,
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary Stats */}
            {pipelineMetrics && (
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Pipeline Value
                  </p>
                  <p className="text-xl font-bold">
                    £
                    {Math.round(
                      pipelineMetrics.totalValue || 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Average Deal Size
                  </p>
                  <p className="text-xl font-bold text-primary">
                    £
                    {Math.round(
                      pipelineMetrics.averageDealSize || 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Deals
                  </p>
                  <p className="text-xl font-bold">
                    {pipelineMetrics.leadsByStage.reduce(
                      (sum: number, s: any) => sum + s.count,
                      0,
                    )}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Proposal Success Report */}
        <TabsContent value="proposal-success">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Proposal Success Rate
                </h3>
                <p className="text-sm text-muted-foreground">
                  Performance by pricing model
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProposalSuccess}
                disabled={
                  modelLoading ||
                  !modelData?.byModel ||
                  modelData.byModel.length === 0
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {modelLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading report...</div>
              </div>
            ) : !modelData?.byModel || modelData.byModel.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No proposal data available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create proposals to generate this report
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pricing Model</TableHead>
                      <TableHead className="text-right">
                        Total Proposals
                      </TableHead>
                      <TableHead className="text-right">
                        Avg Monthly Price
                      </TableHead>
                      <TableHead className="text-right">
                        Total Revenue
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelData.byModel.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell className="font-medium">
                          {model.model}
                        </TableCell>
                        <TableCell className="text-right">
                          {model.count}
                        </TableCell>
                        <TableCell className="text-right">
                          £{Math.round(model.avgMonthly).toLocaleString()}/mo
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          £{Math.round(model.totalRevenue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary Stats */}
            {modelData && (
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Proposals
                  </p>
                  <p className="text-xl font-bold">
                    {modelData.totalProposals || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Avg Savings (Model B)
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    £
                    {Math.round(
                      modelData.avgSavingsWhenModelB || 0,
                    ).toLocaleString()}
                    /mo
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Revenue by Service Report */}
        <TabsContent value="revenue">
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Revenue by Service
                </h3>
                <p className="text-sm text-muted-foreground">
                  Top 20 services by revenue contribution
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRevenue}
                disabled={
                  serviceLoading ||
                  !serviceData?.services ||
                  serviceData.services.length === 0
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {serviceLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading report...</div>
              </div>
            ) : !serviceData?.services || serviceData.services.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No service data available
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create proposals with services to generate this report
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">
                        Proposal Count
                      </TableHead>
                      <TableHead className="text-right">
                        Total Revenue
                      </TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceData.services.map((service, index) => (
                      <TableRow key={service.componentCode}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            {service.componentName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {service.count}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          £{Math.round(service.totalRevenue).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          £{Math.round(service.avgPrice).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-primary font-medium">
                            {service.percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
