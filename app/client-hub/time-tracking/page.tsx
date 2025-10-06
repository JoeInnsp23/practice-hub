"use client";

import { Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { HourlyTimesheet } from "@/components/client-hub/time/hourly-timesheet";
import { MonthlyTimesheet } from "@/components/client-hub/time/monthly-timesheet";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TimeTrackingPage() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("weekly");

  const handleViewChange = (value: string) => {
    if (value === "daily" || value === "weekly" || value === "monthly") {
      setView(value);
    }
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

      {/* Main Content with View Toggle */}
      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weekly">
            <Clock className="h-4 w-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <Calendar className="h-4 w-4 mr-2" />
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {/* Weekly View - Hourly Timesheet */}
          <Card className="glass-card p-0">
            <div className="h-[calc(100vh-250px)]">
              <HourlyTimesheet onViewChange={setView} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {/* Monthly View - Calendar */}
          <Card className="glass-card p-0">
            <div className="h-[calc(100vh-250px)]">
              <MonthlyTimesheet onViewChange={setView} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
