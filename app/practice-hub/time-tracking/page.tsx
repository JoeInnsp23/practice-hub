"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimesheetGrid } from "@/components/practice-hub/time/timesheet-grid";
import { QuickTimeEntry } from "@/components/practice-hub/time/quick-time-entry";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import toast from "react-hot-toast";

// Mock time entries
const mockEntries = [
  {
    id: "1",
    date: new Date("2024-09-25"),
    client: "ABC Company Ltd",
    task: "VAT Return Q4",
    description: "Prepared and submitted VAT return for Q4",
    hours: 3.5,
    billable: true,
    billed: false,
    status: "approved" as const,
    user: "John Smith",
  },
  {
    id: "2",
    date: new Date("2024-09-25"),
    client: "XYZ Ltd",
    task: "Annual Accounts",
    description: "Reviewed year-end accounts",
    hours: 2,
    billable: true,
    billed: false,
    status: "approved" as const,
    user: "John Smith",
  },
  {
    id: "3",
    date: new Date("2024-09-24"),
    client: "John Doe",
    description: "Tax planning consultation",
    hours: 1.5,
    billable: true,
    billed: true,
    status: "approved" as const,
    user: "Jane Wilson",
  },
  {
    id: "4",
    date: new Date("2024-09-24"),
    client: "Internal",
    description: "Team meeting",
    hours: 1,
    billable: false,
    billed: false,
    status: "submitted" as const,
    user: "John Smith",
  },
  {
    id: "5",
    date: new Date("2024-09-23"),
    client: "Tech Innovations Ltd",
    task: "CT600 Preparation",
    description: "Prepared corporation tax return",
    hours: 4,
    billable: true,
    billed: false,
    status: "draft" as const,
    user: "Alice Brown",
  },
];

export default function TimeTrackingPage() {
  const [entries, setEntries] = useState(mockEntries);
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);

  // Filter entries based on selected date and view
  const filteredEntries = useMemo(() => {
    const startDate = new Date(selectedDate);
    let endDate = new Date(selectedDate);

    if (view === "daily") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "weekly") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (view === "monthly") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries, selectedDate, view]);

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (view === "daily") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === "weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === "monthly") {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (view === "daily") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === "monthly") {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleEditEntry = (entry: any) => {
    toast.success(`Editing ${entry.description}`);
  };

  const handleDeleteEntry = (entry: any) => {
    if (window.confirm(`Delete time entry for "${entry.description}"?`)) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      toast.success("Entry deleted");
    }
  };

  const handleDuplicateEntry = (entry: any) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date(),
      status: "draft" as const,
      billed: false,
    };
    setEntries((prev) => [...prev, newEntry]);
    toast.success("Entry duplicated");
  };

  const handleSaveEntry = (entry: any) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      status: "draft" as const,
      billed: false,
      user: "Current User",
    };
    setEntries((prev) => [...prev, newEntry]);
    setIsQuickEntryOpen(false);
  };

  const getPeriodLabel = () => {
    if (view === "daily") {
      return formatDate(selectedDate);
    } else if (view === "weekly") {
      const startDate = new Date(selectedDate);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else {
      return selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Time Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage your time entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Submit Timesheet
          </Button>
        </div>
      </div>

      {/* View Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center px-4 py-2 border rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{getPeriodLabel()}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Entry Toggle */}
      {isQuickEntryOpen && (
        <QuickTimeEntry onSave={handleSaveEntry} />
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setIsQuickEntryOpen(!isQuickEntryOpen)}
        >
          {isQuickEntryOpen ? "Hide" : "Show"} Quick Entry
        </Button>
      </div>

      {/* Timesheet Grid */}
      <TimesheetGrid
        entries={filteredEntries}
        view={view}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        onDuplicate={handleDuplicateEntry}
      />
    </div>
  );
}