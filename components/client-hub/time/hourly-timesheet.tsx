"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { TimeEntryModal } from "./time-entry-modal";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { cn } from "@/lib/utils";
import { getWorkTypeColor, getWorkTypeLabel } from "@/lib/constants/work-types";

interface HourlyTimesheetProps {
  initialWeekStart?: Date;
  onViewChange?: (view: "daily" | "weekly" | "monthly") => void;
}

export function HourlyTimesheet({
  initialWeekStart = new Date(),
  onViewChange,
}: HourlyTimesheetProps) {
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(initialWeekStart, { weekStartsOn: 1 })
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get week dates
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const weekStart = format(currentWeek, "yyyy-MM-dd");
  const weekEnd = format(addDays(currentWeek, 6), "yyyy-MM-dd");

  const { data: timeEntries } = useTimeEntries(weekStart, weekEnd);

  // Generate 24 hours (12am to 11pm)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const display =
      hour === 0
        ? "12am"
        : hour < 12
        ? `${hour}am`
        : hour === 12
        ? "12pm"
        : `${hour - 12}pm`;
    return { hour, display };
  });

  // Get entries for a specific day and hour
  const getEntriesForSlot = (date: Date, hour: number) => {
    return (
      timeEntries?.filter((entry) => {
        const entryDate = new Date(entry.date);
        // For now, just check if it's the same day
        // In a real app, you'd check the actual hour
        return isSameDay(entryDate, date);
      }) || []
    );
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = addDays(currentWeek, direction === "next" ? 7 : -7);
    setCurrentWeek(newWeek);
  };

  const openModal = (date: Date, hour?: number) => {
    setSelectedDate(date);
    setSelectedHour(hour || null);
    setIsModalOpen(true);
  };

  const handleSaveEntry = (entry: any) => {
    // Handle saving the entry
    console.log("Saving entry:", entry);
    setIsModalOpen(false);
  };

  // Scroll to current hour on mount
  useEffect(() => {
    if (gridRef.current) {
      const currentHour = new Date().getHours();
      const hourElement = gridRef.current.querySelector(
        `[data-hour="${currentHour}"]`
      );
      if (hourElement) {
        hourElement.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
          {/* Week Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek("prev")}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-base font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
              Week of {format(currentWeek, "MMM d, yyyy")}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateWeek("next")}
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

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Button variant="default" size="sm">
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-400"
              onClick={() => onViewChange("monthly")}
            >
              Month
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="text-blue-600 dark:text-blue-400"
          >
            Today
          </Button>
        </div>
      )}

      {/* Summary Bar */}
      <div className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300">Billable</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-slate-700 dark:text-slate-300">Non-Billable</span>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto text-sm">
          <div className="text-slate-600 dark:text-slate-400">
            <span className="font-medium">Week Total:</span>
            <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">
              {timeEntries?.reduce((sum, e) => sum + e.hours, 0).toFixed(1) || 0}h
            </span>
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            <span className="font-medium">Billable:</span>
            <span className="ml-2 font-bold text-green-600 dark:text-green-400">
              {timeEntries?.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0).toFixed(1) || 0}h
            </span>
          </div>
        </div>
      </div>

      {/* Timesheet Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-0 sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10 border-b border-slate-200 dark:border-slate-700">
            <div className="p-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
              Time
            </div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isWeekend = index >= 5;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center text-sm font-medium border-r border-slate-200 dark:border-slate-700 last:border-r-0",
                    isToday && "bg-blue-50 dark:bg-blue-500/10",
                    isWeekend && !isToday && "bg-slate-100 dark:bg-slate-800/70"
                  )}
                >
                  <div className={cn(
                    "text-slate-700 dark:text-slate-300",
                    isToday && "text-blue-600 dark:text-blue-400 font-semibold"
                  )}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "text-xs",
                    isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour Rows */}
          {timeSlots.map((slot) => {
            const isCurrentHour = slot.hour === new Date().getHours();
            return (
              <div
                key={slot.hour}
                data-hour={slot.hour}
                className="grid grid-cols-8 gap-0 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
              >
                <div
                  className={cn(
                    "p-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700",
                    isCurrentHour && "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  )}
                >
                  {slot.display}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const entries = getEntriesForSlot(day, slot.hour);
                  const isWeekend = dayIndex >= 5;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-2 min-h-[60px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 cursor-pointer",
                        "hover:bg-slate-100 dark:hover:bg-slate-700/50",
                        isWeekend && "bg-slate-50 dark:bg-slate-800/50",
                        isToday && isCurrentHour && "bg-orange-50 dark:bg-orange-500/10"
                      )}
                      onClick={() => openModal(day, slot.hour)}
                    >
                      {entries.length > 0 && (
                        <div className="space-y-1">
                          {entries.slice(0, 2).map((entry, idx) => {
                            const workTypeColor = getWorkTypeColor(entry.workType || "work");
                            const workTypeLabel = getWorkTypeLabel(entry.workType || "work");

                            return (
                              <div
                                key={idx}
                                className="text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-2"
                                style={{
                                  backgroundColor: `${workTypeColor}20`,
                                  borderLeftColor: workTypeColor,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEntry(entry);
                                  setSelectedDate(new Date(entry.date));
                                  setIsModalOpen(true);
                                }}
                              >
                                <div className="flex items-center gap-1">
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                      entry.billable ? "bg-red-500" : "bg-blue-500"
                                    )}
                                  />
                                  <span className="font-medium truncate flex-1">
                                    {workTypeLabel}
                                  </span>
                                  {entry.hours && (
                                    <span className="text-[10px]">{entry.hours}h</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {entries.length > 2 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                              +{entries.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Totals Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
        <div className="grid grid-cols-8 gap-0 min-w-[800px]">
          <div className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
            Daily Totals
          </div>
          {weekDays.map((day) => {
            const dayEntries = getEntriesForSlot(day.date, 0); // Get all entries for the day
            const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.hours, 0);
            const billableTotal = dayEntries.filter(e => e.billable).reduce((sum, e) => sum + e.hours, 0);

            return (
              <div key={day.date} className="text-center text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}
                </div>
                {dayTotal > 0 && (
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                    {billableTotal > 0 ? `${billableTotal.toFixed(1)}h billable` : 'Non-billable'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Entry Modal */}
      <TimeEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEntry(null);
          setSelectedHour(null);
        }}
        onSave={handleSaveEntry}
        selectedDate={selectedDate || undefined}
        selectedEntry={selectedEntry}
        selectedHour={selectedHour}
      />
    </div>
  );
}