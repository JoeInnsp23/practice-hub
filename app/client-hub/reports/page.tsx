"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RevenueChart } from "@/components/client-hub/reports/revenue-chart";
import { ClientBreakdown } from "@/components/client-hub/reports/client-breakdown";
import {
  Download,
  Users,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import { formatCurrency, formatHours } from "@/lib/utils/format";
import toast from "react-hot-toast";




export default function ReportsPage() {
  const [period, setPeriod] = useState("this_year");
  const [reportType, setReportType] = useState("overview");

  // Calculate KPIs
  const kpis = useMemo(() => {
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
  }, []);

  const handleExportReport = () => {
    toast.success("Exporting report as PDF...");
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
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
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
                Top: {kpis.topClient?.name || 'N/A'}
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
          <RevenueChart data={[]} period="Last 9 Months" />
          <ClientBreakdown
            data={[]}
            totalRevenue={kpis.totalRevenue}
          />
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">No service data available</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="space-y-6">
        <RevenueChart data={[]} period="Last 9 Months" />

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
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(kpis.totalInvoiced - kpis.totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">YoY Growth</CardTitle>
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
        <ClientBreakdown
          data={[]}
          totalRevenue={kpis.totalRevenue}
        />

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
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
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
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
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
