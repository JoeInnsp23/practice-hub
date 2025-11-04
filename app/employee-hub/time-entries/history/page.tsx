"use client";

import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/app/providers/trpc-provider";
import { KPIWidget } from "@/components/client-hub/dashboard/kpi-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TimeEntryHistoryPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  // Fetch time entries for the month
  const { data: entries, isLoading } = trpc.timesheets.list.useQuery({
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const { data: summary } = trpc.timesheets.summary.useQuery({
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const timeEntries = entries?.timeEntries || [];
  const totalHours = summary?.totalHours || 0;
  const billableHours = summary?.billableHours || 0;
  const billablePercentage =
    totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const handleThisMonth = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Time Entry History
          </h1>
          <p className="text-muted-foreground mt-2">
            View your historical time entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisMonth}>
            This Month
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Month Display */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPIWidget
          title="Total Hours"
          value={`${totalHours.toFixed(1)} hrs`}
          icon={Clock}
          loading={isLoading}
          iconColor="text-emerald-600"
        />
        <KPIWidget
          title="Billable Hours"
          value={`${billableHours.toFixed(1)} hrs`}
          icon={Clock}
          loading={isLoading}
          iconColor="text-blue-600"
        />
        <KPIWidget
          title="Billable %"
          value={`${billablePercentage.toFixed(0)}%`}
          icon={Calendar}
          loading={isLoading}
          iconColor="text-purple-600"
        />
      </div>

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Entry History ({timeEntries.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse h-8 bg-muted rounded w-full"></div>
              <div className="animate-pulse h-8 bg-muted rounded w-full"></div>
              <div className="animate-pulse h-8 bg-muted rounded w-full"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No time entries for this month
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start logging your time in the Time Entries page
              </p>
            </div>
          ) : (
            <div className="glass-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">
                      Date
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Work Type
                    </th>
                    <th className="text-left p-3 text-sm font-semibold">
                      Description
                    </th>
                    <th className="text-right p-3 text-sm font-semibold">
                      Hours
                    </th>
                    <th className="text-center p-3 text-sm font-semibold">
                      Billable
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry) => (
                    <tr key={entry.id} className="table-row border-b">
                      <td className="p-3 text-sm">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">{entry.workType}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {entry.description || "-"}
                      </td>
                      <td className="p-3 text-sm text-right font-medium">
                        {entry.hours}
                      </td>
                      <td className="p-3 text-sm text-center">
                        {entry.billable ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
