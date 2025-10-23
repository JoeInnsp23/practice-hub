"use client";

import {
  Activity,
  BarChart3,
  Clock,
  DollarSign,
  Download,
  Target,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClientBreakdown } from "@/components/client-hub/reports/client-breakdown";
import { RevenueChart } from "@/components/client-hub/reports/revenue-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { formatCurrency, formatHours } from "@/lib/utils/format";

type PeriodType =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodType>("this_year");
  const [reportType, setReportType] = useState("overview");

  // Fetch dashboard KPIs
  const { data: kpisData, error: kpisError } =
    trpc.reports.getDashboardKpis.useQuery();

  // Fetch monthly revenue data
  const {
    data: monthlyRevenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = trpc.reports.getMonthlyRevenue.useQuery({
    months: 12,
    period,
  });

  // Fetch client revenue breakdown
  const {
    data: clientRevenueData,
    isLoading: clientsLoading,
    error: clientsError,
  } = trpc.reports.getClientRevenue.useQuery({
    limit: 10,
    period,
  });

  // Fetch service performance
  const {
    data: serviceData,
    isLoading: servicesLoading,
    error: servicesError,
  } = trpc.reports.getServicePerformance.useQuery({
    period,
  });

  // Transform KPI data with defaults
  const kpis = useMemo(() => {
    if (!kpisData) {
      return {
        totalRevenue: 0,
        totalInvoiced: 0,
        collectionRate: 0,
        avgMonthlyRevenue: 0,
        yoyGrowth: 0,
        totalServices: 0,
        avgServiceValue: 0,
        totalHours: 0,
        billableHours: 0,
        utilizationRate: 0,
        activeClients: 0,
        topClient: null as { name: string } | null,
      };
    }

    return {
      totalRevenue: kpisData.totalRevenue,
      totalInvoiced: kpisData.totalRevenue + kpisData.outstandingRevenue,
      collectionRate: kpisData.collectionRate,
      avgMonthlyRevenue: kpisData.totalRevenue / 12,
      yoyGrowth: 0, // TODO: Calculate YoY growth
      totalServices: serviceData?.length || 0,
      avgServiceValue:
        serviceData && serviceData.length > 0
          ? serviceData.reduce((sum, s) => sum + s.totalRevenue, 0) /
            serviceData.length
          : 0,
      totalHours: kpisData.totalHours30d,
      billableHours: kpisData.billableHours30d,
      utilizationRate: kpisData.utilizationRate,
      activeClients: kpisData.activeClients,
      topClient:
        clientRevenueData && clientRevenueData.length > 0
          ? { name: clientRevenueData[0].clientName }
          : null,
    };
  }, [kpisData, serviceData, clientRevenueData]);

  const handleExportReport = () => {
    try {
      // Prepare CSV data based on current report type
      let csvData: string[][] = [];
      let filename = "";

      switch (reportType) {
        case "overview":
          // Export KPIs
          filename = `reports-overview-${new Date().toISOString().split("T")[0]}.csv`;
          csvData = [
            ["Metric", "Value"],
            ["Total Revenue", formatCurrency(kpis.totalRevenue)],
            ["Collection Rate", `${kpis.collectionRate.toFixed(1)}%`],
            ["Active Clients", kpis.activeClients.toString()],
            ["Utilization Rate", `${kpis.utilizationRate.toFixed(1)}%`],
          ];
          break;

        case "revenue":
          // Export monthly revenue
          filename = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;
          csvData = [
            ["Month", "Invoiced", "Collected", "Invoice Count"],
            ...(monthlyRevenueData?.map((item) => [
              new Date(item.month).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              item.invoiced.toString(),
              item.collected.toString(),
              item.invoiceCount.toString(),
            ]) || []),
          ];
          break;

        case "clients":
          // Export client revenue
          filename = `client-revenue-${new Date().toISOString().split("T")[0]}.csv`;
          csvData = [
            ["Client", "Total Paid", "Outstanding", "Invoice Count"],
            ...(clientRevenueData?.map((client) => [
              client.clientName,
              client.totalPaid.toString(),
              client.outstanding.toString(),
              client.invoiceCount.toString(),
            ]) || []),
          ];
          break;

        case "services":
          // Export service performance
          filename = `service-performance-${new Date().toISOString().split("T")[0]}.csv`;
          csvData = [
            ["Service", "Category", "Total Revenue", "Active Clients"],
            ...(serviceData?.map((service) => [
              service.serviceName,
              service.serviceCategory || "",
              service.totalRevenue.toString(),
              service.activeClients.toString(),
            ]) || []),
          ];
          break;

        default:
          toast.error("No data to export");
          return;
      }

      // Convert to CSV string
      const csvContent = csvData.map((row) => row.join(",")).join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filename}`);
    } catch (_error) {
      toast.error("Failed to export report");
    }
  };

  const handleScheduleReport = () => {
    toast.success("Schedule automated reports");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScheduleReport}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs wrapper for all content */}
      <Tabs
        value={reportType}
        onValueChange={setReportType}
        className="space-y-4"
      >
        {/* Header with tabs and period selector */}
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Error State */}
          {(kpisError || revenueError || clientsError || servicesError) && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive text-center">
                  Failed to load reports data. Please try again.
                </p>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpis.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">
                    +{kpis.yoyGrowth.toFixed(1)}%
                  </span>{" "}
                  from last year
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Collection Rate
                </CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.collectionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(kpis.totalRevenue)} of{" "}
                  {formatCurrency(kpis.totalInvoiced)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Clients
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeClients}</div>
                <p className="text-xs text-muted-foreground">
                  Top: {kpis.topClient?.name || "N/A"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Utilization Rate
                </CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.utilizationRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatHours(kpis.billableHours)} billable hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {revenueLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : (
              <RevenueChart
                data={
                  monthlyRevenueData?.map((item) => ({
                    month: new Date(item.month).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    }),
                    revenue: item.collected,
                    invoiced: item.invoiced,
                    collected: item.collected,
                  })) || []
                }
                period="Last 12 Months"
              />
            )}

            {clientsLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : (
              <ClientBreakdown
                data={
                  clientRevenueData?.map((client, _index, arr) => {
                    const totalRevenue = arr.reduce(
                      (sum, c) => sum + c.totalPaid,
                      0,
                    );
                    return {
                      clientId: client.clientId,
                      name: client.clientName,
                      revenue: client.totalPaid,
                      percentage:
                        totalRevenue > 0
                          ? (client.totalPaid / totalRevenue) * 100
                          : 0,
                      change: 0, // TODO: Calculate month-over-month change
                      services: 0, // TODO: Get service count from client_services
                    };
                  }) || []
                }
                totalRevenue={kpis.totalRevenue}
              />
            )}
          </div>

          {/* Service Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Service Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
                  ))}
                </div>
              ) : !serviceData || serviceData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No service data available
                  </p>
                </div>
              ) : (
                <div className="glass-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">
                          Active Clients
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceData.map((service) => (
                        <TableRow key={service.serviceId}>
                          <TableCell className="font-medium">
                            {service.serviceName}
                            {service.serviceCode && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({service.serviceCode})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {service.serviceCategory || "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(service.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {service.activeClients}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {revenueLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <RevenueChart
              data={
                monthlyRevenueData?.map((item) => ({
                  month: new Date(item.month).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  }),
                  revenue: item.collected,
                  invoiced: item.invoiced,
                  collected: item.collected,
                })) || []
              }
              period="Last 12 Months"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpis.avgMonthlyRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpis.totalInvoiced - kpis.totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  YoY Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  +{kpis.yoyGrowth.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {clientsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <ClientBreakdown
              data={
                clientRevenueData?.map((client, _index, arr) => {
                  const totalRevenue = arr.reduce(
                    (sum, c) => sum + c.totalPaid,
                    0,
                  );
                  return {
                    clientId: client.clientId,
                    name: client.clientName,
                    revenue: client.totalPaid,
                    percentage:
                      totalRevenue > 0
                        ? (client.totalPaid / totalRevenue) * 100
                        : 0,
                    change: 0,
                    services: 0,
                  };
                }) || []
              }
              totalRevenue={kpis.totalRevenue}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Client Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Average Client Value
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(kpis.totalRevenue / kpis.activeClients)}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Client Retention
                  </p>
                  <p className="text-xl font-bold">92%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">New Clients</p>
                  <p className="text-xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{kpis.totalServices}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Service Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpis.avgServiceValue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Most Popular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Tax Returns</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Highest Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">Advisory</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatHours(kpis.totalHours)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Billable Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatHours(kpis.billableHours)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {kpis.utilizationRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
