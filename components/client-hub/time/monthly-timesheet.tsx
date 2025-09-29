"use client";

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
import { Button } from "@/components/ui/button";
import { getWorkTypeColor, getWorkTypeLabel } from "@/lib/constants/work-types";
import {
  useCreateTimeEntry,
  useTimeEntries,
} from "@/lib/hooks/use-time-entries";
import { cn } from "@/lib/utils";
import { TimeEntryModal } from "./time-entry-modal";

interface MonthlyTimesheetProps {
  initialDate?: Date;
  onViewChange?: (view: "daily" | "weekly" | "monthly") => void;
}

export function MonthlyTimesheet({
  initialDate = new Date(),
  onViewChange,
}: MonthlyTimesheetProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const createTimeEntry = useCreateTimeEntry();

  // Empty arrays until API is connected
  const clients: Array<{ id: string; name: string }> = [];
  const tasks: Array<{ id: string; name: string; clientId?: string }> = [];

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Fetch time entries for the month
  const { data: timeEntries } = useTimeEntries(
    format(monthStart, "yyyy-MM-dd"),
    format(monthEnd, "yyyy-MM-dd"),
    refreshKey,
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

  const openModal = (date: Date, entry?: any) => {
    setSelectedDate(date);
    setSelectedEntry(entry || null);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (entry: any) => {
    try {
      await createTimeEntry.mutateAsync(entry);
      setRefreshKey((prev) => prev + 1); // Trigger data refresh
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save time entry:", error);
    }
  };

  // Week headers
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
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

            <div className="text-base font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
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
        <Button
          onClick={() => openModal(new Date())}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center space-x-6 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded"></div>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Billable
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-slate-400 dark:bg-slate-500 rounded"></div>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Non-Billable
          </span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Total:{" "}
          {timeEntries?.reduce((sum, e) => sum + e.hours, 0).toFixed(1) || 0}{" "}
          hours
        </div>
      </div>

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-400"
              onClick={() => onViewChange("weekly")}
            >
              Week
            </Button>
            <Button variant="default" size="sm">
              Month
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-blue-600 dark:text-blue-400"
          >
            Today
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
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
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[120px] p-2 cursor-pointer",
                    "hover:bg-slate-50 dark:hover:bg-slate-700/30",
                    !isCurrentMonth &&
                      "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500",
                    isToday &&
                      "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/50",
                    isWeekend &&
                      isCurrentMonth &&
                      !isToday &&
                      "bg-slate-50 dark:bg-slate-800/50",
                  )}
                  onClick={() => openModal(day)}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday &&
                          "bg-blue-600 dark:bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        !isCurrentMonth && "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {totalHours > 0 && (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {totalHours.toFixed(1)}h
                      </span>
                    )}
                  </div>

                  {/* Time Entries */}
                  <div className="space-y-1">
                    {dayEntries.slice(0, 3).map((entry, entryIndex) => {
                      const workTypeColor = getWorkTypeColor(
                        entry.workType || "work",
                      );
                      const workTypeLabel = getWorkTypeLabel(
                        entry.workType || "work",
                      );

                      return (
                        <div
                          key={entryIndex}
                          className="text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-4"
                          style={{
                            backgroundColor: `${workTypeColor}20`,
                            borderLeftColor: workTypeColor,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(day, entry);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {/* Billable/Non-billable dot */}
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                entry.billable ? "bg-red-500" : "bg-blue-500",
                              )}
                            />
                            <span className="font-medium text-slate-800 dark:text-slate-200 flex-1 min-w-0 truncate">
                              {workTypeLabel}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {entry.hours}h
                            </span>
                          </div>
                          {entry.description && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                              {entry.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                        +{dayEntries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
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
        selectedEntry={selectedEntry}
        selectedHour={null}
        clients={clients}
        tasks={tasks}
      />
    </div>
  );
}
