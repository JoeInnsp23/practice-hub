"use client";

import * as Sentry from "@sentry/nextjs";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import {
  type TimeEntry,
  type TimeEntryInput,
  useCreateTimeEntry,
  useTimeEntries,
} from "@/lib/hooks/use-time-entries";
import { useWorkTypes } from "@/lib/hooks/use-work-types";
import { cn } from "@/lib/utils";
import { TimeEntryModal } from "./time-entry-modal";

interface MonthlyTimesheetProps {
  initialDate?: Date;
  onViewChange?: (view: "daily" | "weekly" | "monthly") => void;
  selectedUserId?: string; // Optional: for admin to view specific user's timesheets
}

export function MonthlyTimesheet({
  initialDate = new Date(),
  onViewChange,
  selectedUserId,
}: MonthlyTimesheetProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const createTimeEntry = useCreateTimeEntry();

  // Fetch work types from database
  const { data: workTypesData } = useWorkTypes();
  const workTypes = workTypesData?.workTypes || [];

  // Fetch clients and tasks from database
  const { data: clientsData } = trpc.clients.list.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({});

  const clients: Array<{ id: string; name: string }> =
    clientsData?.clients.map((c) => ({ id: c.id, name: c.name })) || [];
  const tasks: Array<{ id: string; name: string; clientId?: string }> =
    tasksData?.tasks.map((t) => ({
      id: t.id,
      name: t.title,
      clientId: t.clientId || undefined,
    })) || [];

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Fetch time entries for the entire calendar range (including days from prev/next month)
  const { data: timeEntries } = useTimeEntries(
    format(calendarStart, "yyyy-MM-dd"),
    format(calendarEnd, "yyyy-MM-dd"),
    refreshKey,
    selectedUserId,
  );

  // Get entries for a specific day
  const getEntriesForDay = (date: Date) => {
    return (
      timeEntries?.filter((entry) => {
        const entryDate = new Date(entry.date);
        return isSameDay(entryDate, date);
      }) || []
    );
  };

  // Calculate total hours for a day
  const getDayTotal = (date: Date) => {
    const entries = getEntriesForDay(date);
    return entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = addMonths(currentDate, direction === "next" ? 1 : -1);
    setCurrentDate(newDate);
  };

  const openModal = (date: Date, entry?: TimeEntry) => {
    setSelectedDate(date);
    setSelectedEntry(entry || null);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (entry: TimeEntryInput) => {
    try {
      await createTimeEntry.mutateAsync(entry);
      setRefreshKey((prev) => prev + 1); // Trigger data refresh
      setIsModalOpen(false);
      toast.success("Time entry saved successfully");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "save_time_entry", component: "MonthlyTimesheet" },
        extra: { entry },
      });
      toast.error("Failed to save time entry");
    }
  };

  // Week headers
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-4">
          {/* Month Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-base font-semibold text-foreground min-w-[200px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* New Time Entry Button */}
        <Button onClick={() => openModal(new Date())}>
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onViewChange("weekly")}
            >
              Week
            </Button>
            <Button variant="default" size="sm">
              Month
            </Button>
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex items-center px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-foreground">Billable</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-foreground">Non-Billable</span>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium">Total:</span>
            <span className="ml-2 font-bold text-foreground">
              {timeEntries?.reduce((sum, e) => sum + e.hours, 0).toFixed(1) ||
                0}
              h
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-border bg-muted">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-foreground border-r border-border last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0 h-full">
            {calendarDays.map((day, _index) => {
              const dayEntries = getEntriesForDay(day);
              const totalHours = getDayTotal(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  className={cn(
                    "border-r border-b border-border last:border-r-0 min-h-[120px] p-2 cursor-pointer w-full text-left",
                    "hover:bg-muted/50",
                    !isCurrentMonth && "bg-muted/50 text-muted-foreground/50",
                    isToday &&
                      "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50",
                    isWeekend && isCurrentMonth && !isToday && "bg-muted",
                  )}
                  onClick={() => openModal(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openModal(day);
                    }
                  }}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday &&
                          "bg-blue-600 dark:bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        !isCurrentMonth && "text-muted-foreground/70",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {totalHours > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {totalHours.toFixed(1)}h
                      </span>
                    )}
                  </div>

                  {/* Time Entries */}
                  <div className="space-y-1">
                    {dayEntries.slice(0, 3).map((entry) => {
                      // Get work type from database
                      const workType = workTypes.find(
                        (wt) =>
                          wt.code === (entry.workType || "WORK").toUpperCase(),
                      );
                      const workTypeColor = workType?.colorCode || "#94a3b8";
                      const workTypeLabel = workType?.label || "Unknown";

                      return (
                        // biome-ignore lint/a11y/useSemanticElements: Div avoids nested interactive button structure
                        <div
                          key={entry.id || `${entry.date}-${entry.hours}`}
                          className="w-full text-left text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-4"
                          style={{
                            backgroundColor: `${workTypeColor}20`,
                            borderLeftColor: workTypeColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(day, entry);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal(day, entry);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-1">
                            {/* Billable/Non-billable dot */}
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                entry.billable ? "bg-red-500" : "bg-blue-500",
                              )}
                            />
                            <span className="font-medium text-foreground flex-1 min-w-0 truncate">
                              {workTypeLabel}
                            </span>
                            <span className="text-muted-foreground">
                              {entry.hours}h
                            </span>
                          </div>
                          {entry.description && (
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {entry.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">
                        +{dayEntries.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
          setSelectedDate(null);
        }}
        onSave={handleSaveEntry}
        onUpdate={() => setRefreshKey((prev) => prev + 1)}
        onDelete={() => setRefreshKey((prev) => prev + 1)}
        selectedDate={selectedDate || undefined}
        selectedEntry={selectedEntry || undefined}
        selectedHour={null}
        clients={clients}
        tasks={tasks}
      />
    </div>
  );
}
