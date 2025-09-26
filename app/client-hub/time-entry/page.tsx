"use client";

import { useState } from "react";
import { QuickTimeEntry } from "@/components/client-hub/time/quick-time-entry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, TrendingUp, DollarSign } from "lucide-react";
import { formatHours } from "@/lib/utils/format";

export default function TimeEntryPage() {
  const [todayEntries, setTodayEntries] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [billableHours, setBillableHours] = useState(0);

  const handleSaveEntry = (entry: any) => {
    setTodayEntries((prev) => [
      ...prev,
      { ...entry, id: Date.now().toString() },
    ]);
    setTotalHours((prev) => prev + entry.hours);
    if (entry.billable) {
      setBillableHours((prev) => prev + entry.hours);
    }
  };

  const stats = [
    {
      title: "Hours Today",
      value: formatHours(totalHours),
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Billable Hours",
      value: formatHours(billableHours),
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Entries Today",
      value: todayEntries.length.toString(),
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Efficiency",
      value:
        totalHours > 0
          ? `${Math.round((billableHours / totalHours) * 100)}%`
          : "0%",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Entry</h1>
        <p className="text-muted-foreground mt-2">
          Quick and easy time tracking for your daily work
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Entry Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickTimeEntry onSave={handleSaveEntry} />

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {todayEntries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No entries yet today
              </p>
            ) : (
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-start p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{entry.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      {entry.task && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Task: {entry.task}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatHours(entry.hours)}
                      </p>
                      {entry.billable ? (
                        <span className="text-xs text-green-600">Billable</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Non-billable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">
            Time Tracking Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200">
          <ul className="space-y-2">
            <li>• Use the timer for accurate tracking of work sessions</li>
            <li>• Be specific in your descriptions for better reporting</li>
            <li>• Remember to mark entries as billable or non-billable</li>
            <li>• Submit your timesheet weekly for approval</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
