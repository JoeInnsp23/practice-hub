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

// Mock data for reports
const mockRevenueData = [
  { month: "Jan", revenue: 45000, invoiced: 48000, collected: 45000 },
  { month: "Feb", revenue: 52000, invoiced: 55000, collected: 52000 },
  { month: "Mar", revenue: 48000, invoiced: 52000, collected: 48000 },
  { month: "Apr", revenue: 61000, invoiced: 63000, collected: 61000 },
  { month: "May", revenue: 58000, invoiced: 62000, collected: 58000 },
  { month: "Jun", revenue: 65000, invoiced: 68000, collected: 65000 },
  { month: "Jul", revenue: 72000, invoiced: 75000, collected: 72000 },
  { month: "Aug", revenue: 69000, invoiced: 71000, collected: 69000 },
  { month: "Sep", revenue: 75000, invoiced: 78000, collected: 75000 },
];

const mockClientData = [
  { name: "ABC Company Ltd", revenue: 125000, percentage: 22.5, change: 15, services: 8 },
  { name: "XYZ Ltd", revenue: 98000, percentage: 17.6, change: 8, services: 6 },
  { name: "Tech Innovations Ltd", revenue: 85000, percentage: 15.3, change: -5, services: 5 },
  { name: "John Doe", revenue: 45000, percentage: 8.1, change: 12, services: 3 },
  { name: "Small Business Co", revenue: 38000, percentage: 6.8, change: 0, services: 4 },
  { name: "Construction Corp", revenue: 32000, percentage: 5.8, change: 20, services: 2 },
  { name: "Retail Solutions", revenue: 28000, percentage: 5.0, change: -10, services: 3 },
  { name: "Green Energy Ltd", revenue: 25000, percentage: 4.5, change: 25, services: 2 },
  { name: "Healthcare Plus", revenue: 22000, percentage: 4.0, change: 5, services: 2 },
  { name: "Media Group", revenue: 18000, percentage: 3.2, change: -2, services: 2 },
];

const mockServiceStats = [
  { service: "Tax Returns", count: 145, revenue: 125000, avgPrice: 862 },
  { service: "Bookkeeping", count: 89, revenue: 95000, avgPrice: 1067 },
  { service: "VAT Returns", count: 72, revenue: 45000, avgPrice: 625 },
  { service: "Annual Accounts", count: 45, revenue: 85000, avgPrice: 1889 },
  { service: "Payroll", count: 38, revenue: 38000, avgPrice: 1000 },
  { service: "Advisory", count: 25, revenue: 65000, avgPrice: 2600 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("this_year");
  const [reportType, setReportType] = useState("overview");

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = mockRevenueData.reduce((sum, d) => sum + d.collected, 0);
    const totalInvoiced = mockRevenueData.reduce((sum, d) => sum + d.invoiced, 0);
    const collectionRate = (totalRevenue / totalInvoiced) * 100;
    const avgMonthlyRevenue = totalRevenue / mockRevenueData.length;

    // Calculate YoY growth (mock data)
    const lastYearRevenue = totalRevenue * 0.85; // Assuming 15% growth
    const yoyGrowth = ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100;

    // Service metrics
    const totalServices = mockServiceStats.reduce((sum, s) => sum + s.count, 0);
    const avgServiceValue = totalRevenue / totalServices;

    // Time metrics (mock)
    const totalHours = 2850;
    const billableHours = 2280;
    const utilizationRate = (billableHours / totalHours) * 100;

    return {
      totalRevenue,
      totalInvoiced,
      collectionRate,
      avgMonthlyRevenue,
      yoyGrowth,
      totalServices,
      avgServiceValue,
      totalHours,
      billableHours,
      utilizationRate,
      activeClients: mockClientData.length,
      topClient: mockClientData[0],
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Reports & Analytics
          </h1>
          <p className="text-slate-700 dark:text-slate-300 mt-2">
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

      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
          </TabsList>
        </Tabs>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{kpis.yoyGrowth.toFixed(1)}%</span> from last year
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(kpis.totalRevenue)} of {formatCurrency(kpis.totalInvoiced)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                Top: {kpis.topClient.name}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.utilizationRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatHours(kpis.billableHours)} billable hours
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={mockRevenueData} period="Last 9 Months" />
          <ClientBreakdown data={mockClientData} totalRevenue={kpis.totalRevenue} />
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
            <div className="space-y-4">
              {mockServiceStats.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{service.service}</span>
                      <span className="text-sm text-slate-600">{service.count} completed</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(service.revenue / mockServiceStats[0].revenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold">{formatCurrency(service.revenue)}</p>
                    <p className="text-xs text-slate-600">Avg: {formatCurrency(service.avgPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="revenue" className="space-y-6">
        <RevenueChart data={mockRevenueData} period="Last 9 Months" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(kpis.avgMonthlyRevenue)}</p>
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
        <ClientBreakdown data={mockClientData} totalRevenue={kpis.totalRevenue} />

        <Card>
          <CardHeader>
            <CardTitle>Client Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-slate-600">Average Client Value</p>
                <p className="text-xl font-bold">{formatCurrency(kpis.totalRevenue / kpis.activeClients)}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-slate-600">Client Retention</p>
                <p className="text-xl font-bold">92%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-slate-600">New Clients</p>
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
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.totalServices}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Service Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(kpis.avgServiceValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">Tax Returns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest Value</CardTitle>
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
              <p className="text-2xl font-bold">{formatHours(kpis.totalHours)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatHours(kpis.billableHours)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpis.utilizationRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
  );
}