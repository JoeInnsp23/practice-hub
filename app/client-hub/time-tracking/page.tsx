"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { HourlyTimesheet } from "@/components/client-hub/time/hourly-timesheet";
import { MonthlyTimesheet } from "@/components/client-hub/time/monthly-timesheet";
import { QuickTimeEntry } from "@/components/client-hub/time/quick-time-entry";
import { Clock, Calendar, List, Play, Edit, Trash2 } from "lucide-react";
import { useTimeEntries, useDeleteTimeEntry } from "@/lib/hooks/use-time-entries";
import { formatHours } from "@/lib/utils/format";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function TimeTrackingPage() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  // Get today's date for daily view
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: timeEntries, isLoading } = useTimeEntries(today, today);
  const deleteTimeEntry = useDeleteTimeEntry();

  // Calculate stats
  const todayEntries = timeEntries || [];
  const totalHours = todayEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const billableHours = todayEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + (entry.hours || 0), 0);

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
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Entries Today",
      value: todayEntries.length.toString(),
      icon: Play,
      color: "text-purple-600",
    },
    {
      title: "Avg per Entry",
      value: todayEntries.length > 0 ? formatHours(totalHours / todayEntries.length) : "0h",
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  const confirmDelete = async () => {
    if (deleteEntryId) {
      await deleteTimeEntry.mutateAsync(deleteEntryId);
      setDeleteEntryId(null);
    }
  };

  const handleSaveEntry = (entry: any) => {
    toast.success("Time entry saved");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Track your time and monitor productivity across projects
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
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

      {/* Main Content with View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="daily">
            <List className="h-4 w-4 mr-2" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly">
            <Calendar className="h-4 w-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          {/* Daily View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time Entries List */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Today's Time Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Loading time entries...</div>
                    </div>
                  ) : todayEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 text-muted mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No time entries today</h3>
                      <p className="text-muted-foreground">
                        Start logging your time to track productivity
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex justify-between items-start p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{entry.client || "No client"}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.description || "No description"}
                            </p>
                            {entry.task && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Task: {entry.task}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-semibold">{formatHours(entry.hours)}</p>
                              <Badge
                                variant={entry.billable ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {entry.billable ? "Billable" : "Non-billable"}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteEntryId(entry.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Time Entry */}
            <div>
              <QuickTimeEntry onSave={handleSaveEntry} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {/* Weekly View - Hourly Timesheet */}
          <Card className="glass-card p-0">
            <div className="h-[calc(100vh-300px)]">
              <HourlyTimesheet onViewChange={setView} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {/* Monthly View - Calendar */}
          <Card className="glass-card p-0">
            <div className="h-[calc(100vh-300px)]">
              <MonthlyTimesheet onViewChange={setView} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteEntryId} onOpenChange={() => setDeleteEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}