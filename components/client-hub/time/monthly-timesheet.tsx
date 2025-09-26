"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  getDay,
} from "date-fns";
import { TimeEntryModal } from "./time-entry-modal";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { cn } from "@/lib/utils";

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
    format(monthEnd, "yyyy-MM-dd")
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

  const handleSaveEntry = (entry: any) => {
    // Handle saving the entry
    console.log("Saving entry:", entry);
    setIsModalOpen(false);
  };

  // Week headers
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
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
        <Button
          onClick={() => openModal(new Date())}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center space-x-6 px-4 py-2 bg-muted/50 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded"></div>
          <span className="text-sm">Billable</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-muted-foreground/50 rounded"></div>
          <span className="text-sm">Non-Billable</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {timeEntries?.reduce((sum, e) => sum + e.hours, 0).toFixed(1) || 0} hours
        </div>
      </div>

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-primary"
          >
            Today
          </Button>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="h-full">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 border-b bg-muted/50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-foreground border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-0 h-full">
            {calendarDays.map((day, index) => {
              const dayEntries = getEntriesForDay(day);
              const totalHours = getDayTotal(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-r border-b last:border-r-0 min-h-[120px] p-2 cursor-pointer hover:bg-muted/30",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                    isToday && "bg-primary/10 border-primary/50",
                    isWeekend && isCurrentMonth && "bg-muted/20"
                  )}
                  onClick={() => openModal(day)}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday &&
                          "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs"
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
                    {dayEntries.slice(0, 3).map((entry, entryIndex) => (
                      <div
                        key={entryIndex}
                        className={cn(
                          "text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-4",
                          entry.billable
                            ? "bg-blue-500/20 border-blue-500 dark:border-blue-400"
                            : "bg-muted border-muted-foreground/50"
                        )}
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
                              entry.billable ? "bg-blue-500 dark:bg-blue-400" : "bg-muted-foreground/50"
                            )}
                          />
                          <span className="font-medium text-foreground flex-1 min-w-0 truncate">
                            {entry.client || entry.task || "Time entry"}
                          </span>
                          <span className="text-muted-foreground">{entry.hours}h</span>
                        </div>
                        {entry.description && (
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {entry.description}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <div className="text-[10px] text-muted-foreground text-center">
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
        }}
        onSave={handleSaveEntry}
        selectedDate={selectedDate || undefined}
        selectedEntry={selectedEntry}
      />
    </div>
  );
}