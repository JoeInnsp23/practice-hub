"use client";

import * as Sentry from "@sentry/nextjs";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

interface HourlyTimesheetProps {
  initialWeekStart?: Date;
  onViewChange?: (view: "daily" | "weekly" | "monthly") => void;
  selectedUserId?: string; // Optional: for admin to view specific user's timesheets
}

export function HourlyTimesheet({
  initialWeekStart = new Date(),
  onViewChange,
  selectedUserId,
}: HourlyTimesheetProps) {
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(initialWeekStart, { weekStartsOn: 1 }),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
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

  // Get week dates
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const weekStart = format(currentWeek, "yyyy-MM-dd");
  const weekEnd = format(addDays(currentWeek, 6), "yyyy-MM-dd");

  const { data: timeEntries } = useTimeEntries(
    weekStart,
    weekEnd,
    refreshKey,
    selectedUserId,
  );

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
  const getEntriesForSlot = (date: Date, hour?: number) => {
    return (
      timeEntries?.filter((entry) => {
        const entryDate = new Date(entry.date);
        const sameDay = isSameDay(entryDate, date);

        // If no hour specified, return all entries for the day
        if (hour === undefined) {
          return sameDay;
        }

        // Check if entry falls within the specified hour
        if (sameDay && entry.startTime) {
          const [entryHour] = entry.startTime.split(":").map(Number);
          return entryHour === hour;
        }

        return false;
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

  const handleSaveEntry = async (entry: TimeEntryInput) => {
    try {
      await createTimeEntry.mutateAsync(entry);
      setRefreshKey((prev) => prev + 1); // Trigger data refresh
      setIsModalOpen(false);
      toast.success("Time entry saved successfully");
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: "save_time_entry", component: "HourlyTimesheet" },
        extra: { entry },
      });
      toast.error("Failed to save time entry");
    }
  };

  // Scroll to current hour on mount and set current time
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now);

    if (gridRef.current) {
      const currentHour = now.getHours();
      const hourElement = gridRef.current.querySelector(
        `[data-hour="${currentHour}"]`,
      );
      if (hourElement) {
        hourElement.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
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

            <div className="text-base font-semibold text-foreground min-w-[200px] text-center">
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
        <Button onClick={() => openModal(new Date())}>
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center space-x-2">
            <Button variant="default" size="sm">
              Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onViewChange("monthly")}
            >
              Month
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
            className="text-blue-600 dark:text-blue-400"
          >
            Today
          </Button>
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
            <span className="font-medium">Week Total:</span>
            <span className="ml-2 font-bold text-foreground">
              {timeEntries?.reduce((sum, e) => sum + e.hours, 0).toFixed(1) ||
                0}
              h
            </span>
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">Billable:</span>
            <span className="ml-2 font-bold text-green-600 dark:text-green-400">
              {timeEntries
                ?.filter((e) => e.billable)
                .reduce((sum, e) => sum + e.hours, 0)
                .toFixed(1) || 0}
              h
            </span>
          </div>
        </div>
      </div>

      {/* Timesheet Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-0 sticky top-0 bg-muted z-10 border-b border-border">
            <div className="p-3 text-center text-sm font-medium text-foreground border-r border-border">
              Time
            </div>
            {weekDays.map((day, index) => {
              const isToday = currentTime && isSameDay(day, currentTime);
              const isWeekend = index >= 5;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center text-sm font-medium border-r border-border last:border-r-0",
                    isToday && "bg-blue-50 dark:bg-blue-500/10",
                    isWeekend && !isToday && "bg-muted/80",
                  )}
                >
                  <div
                    className={cn(
                      "text-foreground",
                      isToday &&
                        "text-blue-600 dark:text-blue-400 font-semibold",
                    )}
                  >
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {format(day, "MMM d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hour Rows */}
          {timeSlots.map((slot) => {
            const isCurrentHour =
              currentTime && slot.hour === currentTime.getHours();
            return (
              <div
                key={slot.hour}
                data-hour={slot.hour}
                className="grid grid-cols-8 gap-0 border-b border-border hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "p-3 text-center text-sm font-medium text-foreground border-r border-border",
                    isCurrentHour &&
                      "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
                  )}
                >
                  {slot.display}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const entries = getEntriesForSlot(day, slot.hour);
                  const unscheduledEntries =
                    slot.hour === 0
                      ? getEntriesForSlot(day).filter(
                          (entry) =>
                            !entry.startTime || entry.startTime.trim() === "",
                        )
                      : [];
                  const isWeekend = dayIndex >= 5;
                  const isToday = currentTime && isSameDay(day, currentTime);

                  return (
                    // biome-ignore lint/a11y/useSemanticElements: Div container avoids nested button semantics
                    <div
                      key={day.toISOString()}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "p-2 min-h-[60px] border-r border-border last:border-r-0 cursor-pointer w-full text-left",
                        "hover:bg-muted/50",
                        isWeekend && "bg-muted",
                        isToday &&
                          isCurrentHour &&
                          "bg-orange-50 dark:bg-orange-500/10",
                      )}
                      onClick={() => openModal(day, slot.hour)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal(day, slot.hour);
                        }
                      }}
                    >
                      {unscheduledEntries.length > 0 && (
                        <div className="space-y-1 mb-1">
                          {unscheduledEntries.map((entry) => {
                            const workType = workTypes.find(
                              (wt) =>
                                wt.code ===
                                (entry.workType || "WORK").toUpperCase(),
                            );
                            const workTypeColor =
                              workType?.colorCode || "#94a3b8";
                            const workTypeLabel = workType?.label || "Unknown";

                            return (
                              // biome-ignore lint/a11y/useSemanticElements: Div avoids nested interactive button structure
                              <div
                                key={`unscheduled-${entry.id || `${entry.date}-${entry.hours}`}`}
                                className="w-full text-left text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-2"
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                    setSelectedDate(new Date(entry.date));
                                    setIsModalOpen(true);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="flex items-center gap-1">
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                      entry.billable
                                        ? "bg-red-500"
                                        : "bg-blue-500",
                                    )}
                                  />
                                  <span className="font-medium truncate flex-1">
                                    {workTypeLabel}
                                  </span>
                                  {entry.hours && (
                                    <span className="text-[10px]">
                                      {entry.hours}h
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">
                                    No start time
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {entries.length > 0 && (
                        <div className="space-y-1">
                          {entries.slice(0, 2).map((entry) => {
                            // Get work type from database
                            const workType = workTypes.find(
                              (wt) =>
                                wt.code ===
                                (entry.workType || "WORK").toUpperCase(),
                            );
                            const workTypeColor =
                              workType?.colorCode || "#94a3b8";
                            const workTypeLabel = workType?.label || "Unknown";

                            return (
                              // biome-ignore lint/a11y/useSemanticElements: Div avoids nested interactive button structure
                              <div
                                key={entry.id || `${entry.date}-${entry.hours}`}
                                className="w-full text-left text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow border-l-2"
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
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedEntry(entry);
                                    setSelectedDate(new Date(entry.date));
                                    setIsModalOpen(true);
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                              >
                                <div className="flex items-center gap-1">
                                  <div
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                      entry.billable
                                        ? "bg-red-500"
                                        : "bg-blue-500",
                                    )}
                                  />
                                  <span className="font-medium truncate flex-1">
                                    {workTypeLabel}
                                  </span>
                                  {entry.hours && (
                                    <span className="text-[10px]">
                                      {entry.hours}h
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {entries.length > 2 && (
                            <div className="text-[10px] text-muted-foreground text-center">
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
      <div className="border-t border-border bg-muted px-4 py-3">
        <div className="grid grid-cols-8 gap-0 min-w-[800px]">
          <div className="text-center text-xs font-semibold text-foreground">
            Daily Totals
          </div>
          {weekDays.map((day) => {
            const dayEntries = getEntriesForSlot(day); // Get all entries for the day
            const dayTotal = dayEntries.reduce(
              (sum, entry) => sum + entry.hours,
              0,
            );
            const billableTotal = dayEntries
              .filter((e) => e.billable)
              .reduce((sum, e) => sum + e.hours, 0);

            return (
              <div key={day.toISOString()} className="text-center text-xs">
                <div className="font-semibold text-foreground">
                  {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : "-"}
                </div>
                {dayTotal > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {billableTotal > 0
                      ? `${billableTotal.toFixed(1)}h billable`
                      : "Non-billable"}
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
          setSelectedDate(null);
        }}
        onSave={handleSaveEntry}
        onUpdate={() => setRefreshKey((prev) => prev + 1)}
        onDelete={() => setRefreshKey((prev) => prev + 1)}
        selectedDate={selectedDate || undefined}
        selectedEntry={selectedEntry || undefined}
        selectedHour={selectedHour}
        clients={clients}
        tasks={tasks}
      />
    </div>
  );
}
