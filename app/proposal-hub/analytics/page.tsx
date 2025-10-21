"use client";

import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { AnalyticsFiltersComponent } from "@/components/proposal-hub/analytics/analytics-filters";
import type { AnalyticsFilters } from "@/components/proposal-hub/analytics/analytics-filters";
import { AnalyticsKpiCards } from "@/components/proposal-hub/analytics/analytics-kpi-cards";
import { WinLossPieChart } from "@/components/proposal-hub/analytics/win-loss-pie-chart";
import { PipelineValueBarChart } from "@/components/proposal-hub/analytics/pipeline-value-bar-chart";
import { MonthlyTrendChart } from "@/components/proposal-hub/analytics/monthly-trend-chart";
import { SalesCycleChart } from "@/components/proposal-hub/analytics/sales-cycle-chart";
import { LossReasonsTable } from "@/components/proposal-hub/analytics/loss-reasons-table";
import { SalesFunnelChart } from "@/components/proposal-hub/charts/sales-funnel-chart";

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // Build query parameters from filters
  const queryParams = {
    from: filters.dateFrom?.toISOString(),
    to: filters.dateTo?.toISOString(),
    assignedToId: filters.assignedToId,
    clientId: filters.clientId,
  };

  const dateRangeParams = {
    startDate: filters.dateFrom?.toISOString(),
    endDate: filters.dateTo?.toISOString(),
  };

  // Fetch all analytics data
  const { data: winLossData, isLoading: winLossLoading } =
    trpc.analytics.getWinLossStats.useQuery(queryParams);

  const { data: pipelineData, isLoading: pipelineLoading } =
    trpc.analytics.getPipelineValueByStage.useQuery({
      asOf: filters.dateTo?.toISOString(),
    });

  const { data: avgDealData, isLoading: avgDealLoading } =
    trpc.analytics.getAverageDealSize.useQuery(dateRangeParams);

  const { data: salesCycleData, isLoading: salesCycleLoading } =
    trpc.analytics.getSalesCycleDuration.useQuery(dateRangeParams);

  const { data: monthlyTrendData, isLoading: monthlyTrendLoading } =
    trpc.analytics.getMonthlyTrend.useQuery({ months: 12 });

  const { data: lossReasonsData, isLoading: lossReasonsLoading } =
    trpc.analytics.getLossReasons.useQuery(dateRangeParams);

  const { data: funnelData, isLoading: funnelLoading } =
    trpc.analytics.getSalesFunnelMetrics.useQuery(dateRangeParams);

  // Fetch users and clients for filters
  const { data: usersData } = trpc.users.list.useQuery();
  const { data: clientsData } = trpc.clients.list.useQuery();

  const users = usersData?.users.map((u) => ({
    id: u.id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
  })) || [];

  const clients = clientsData?.clients.map((c) => ({
    id: c.id,
    name: c.name,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Sales Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analysis of proposal performance and sales metrics
          </p>
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        users={users}
        clients={clients}
      />

      {/* KPI Cards */}
      <AnalyticsKpiCards
        winRate={winLossData?.winRate || 0}
        avgDealSize={avgDealData?.avgMonthly || 0}
        avgSalesCycle={salesCycleData?.avgDaysToWon || 0}
        pipelineValue={pipelineData?.totalValue || 0}
        isLoading={
          winLossLoading || avgDealLoading || salesCycleLoading || pipelineLoading
        }
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Pie Chart */}
        <WinLossPieChart data={winLossData} isLoading={winLossLoading} />

        {/* Pipeline Value Bar Chart */}
        <PipelineValueBarChart data={pipelineData} isLoading={pipelineLoading} />
      </div>

      {/* Monthly Trend - Full Width */}
      <MonthlyTrendChart data={monthlyTrendData} isLoading={monthlyTrendLoading} />

      {/* Sales Cycle and Loss Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesCycleChart data={salesCycleData} isLoading={salesCycleLoading} />
        <LossReasonsTable data={lossReasonsData} isLoading={lossReasonsLoading} />
      </div>

      {/* Sales Funnel - Full Width */}
      <SalesFunnelChart data={funnelData} isLoading={funnelLoading} />
    </div>
  );
}
