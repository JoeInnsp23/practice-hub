"use client";

import * as Sentry from "@sentry/nextjs";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/app/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { MUTED_FOREGROUND_HEX_LIGHT } from "@/lib/constants/colors";
import {
  type TimeEntry,
  type TimeEntryInput,
  useCreateTimeEntry,
  useTimeEntries,
} from "@/lib/hooks/use-time-entries";
import { useWorkTypes } from "@/lib/hooks/use-work-types";
import { cn } from "@/lib/utils";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import { TimeEntryModal } from "./time-entry-modal";

interface HourlyTimesheetProps {
  initialWeekStart?: Date;
  selectedUserId?: string; // Optional: for admin to view specific user's timesheets
}

const EMPLOYEE_HUB_COLOR = HUB_COLORS["employee-hub"];

const withOpacity = (color: string, alpha: number) => {
  if (!color.startsWith("#")) {
    return color;
  }
  const hex = color.replace("#", "");
  if (hex.length !== 6) {
    return color;
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const EMPLOYEE_HUB_HIGHLIGHT_BG = withOpacity(EMPLOYEE_HUB_COLOR, 0.15);
const EMPLOYEE_HUB_HIGHLIGHT_BORDER = withOpacity(EMPLOYEE_HUB_COLOR, 0.35);

export function HourlyTimesheet({
  initialWeekStart = new Date(),
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

  // Calculate absolute position for continuous time entry blocks
  const calculateEntryPosition = (entry: TimeEntry) => {
    if (!entry.startTime || !entry.endTime) return null;

    const [startHour, startMin] = entry.startTime.split(":").map(Number);
    const [endHour, endMin] = entry.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;

    // Each hour slot is 60px high, so calculate pixel positions
    const top = (startMinutes / 60) * 60; // Start position in pixels
    const height = (duration / 60) * 60; // Total height in pixels

    return { top, height };
  };

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

        // Check if entry SPANS through this hour slot (not just starts in it)
        if (sameDay && entry.startTime && entry.endTime) {
          const [startHour, startMinute] = entry.startTime
            .split(":")
            .map(Number);
          const [endHour, endMinute] = entry.endTime.split(":").map(Number);

          const slotStart = hour * 60; // Hour slot start in minutes (e.g., 9:00 = 540)
          const slotEnd = (hour + 1) * 60; // Hour slot end in minutes (e.g., 10:00 = 600)
          const entryStart = startHour * 60 + startMinute;
          const entryEnd = endHour * 60 + endMinute;

          // Entry spans this hour if: (entryStart < slotEnd) AND (entryEnd > slotStart)
          return entryStart < slotEnd && entryEnd > slotStart;
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
    <div className="rounded-xl border border-border bg-transparent text-muted-foreground h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="glass-subtle flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-3">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
          >
            Today
          </Button>
        </div>

        {/* New Time Entry Button */}
        <Button onClick={() => openModal(new Date())}>
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center px-4 py-2 bg-muted/30 border-b border-border">
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
          <div className="glass-subtle grid grid-cols-8 gap-0 sticky top-0 z-10 border-b border-border">
            <div className="p-3 text-center text-sm font-medium text-foreground border-r border-border">
              Time
            </div>
            {weekDays.map((day) => {
              const isToday = currentTime && isSameDay(day, currentTime);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center text-sm font-medium border-r border-border last:border-r-0",
                  )}
                  style={
                    isToday
                      ? {
                          backgroundColor: EMPLOYEE_HUB_HIGHLIGHT_BG,
                          borderColor: EMPLOYEE_HUB_HIGHLIGHT_BORDER,
                        }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "text-foreground",
                      isToday && "font-semibold",
                    )}
                    style={isToday ? { color: EMPLOYEE_HUB_COLOR } : undefined}
                  >
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      isToday ? "font-medium" : "text-muted-foreground",
                    )}
                    style={isToday ? { color: EMPLOYEE_HUB_COLOR } : undefined}
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
                className="grid grid-cols-8 gap-0 border-b border-border hover:bg-foreground/5"
              >
                <div
                  className={cn(
                    "p-3 text-center text-sm font-medium text-foreground border-r border-border bg-muted/30",
                    isCurrentHour && "font-semibold",
                  )}
                  style={
                    isCurrentHour
                      ? {
                          backgroundColor: EMPLOYEE_HUB_HIGHLIGHT_BG,
                          color: EMPLOYEE_HUB_COLOR,
                          borderColor: EMPLOYEE_HUB_HIGHLIGHT_BORDER,
                        }
                      : undefined
                  }
                >
                  {slot.display}
                </div>
                {weekDays.map((day) => {
                  const unscheduledEntries =
                    slot.hour === 0
                      ? getEntriesForSlot(day).filter(
                          (entry) =>
                            !entry.startTime || entry.startTime.trim() === "",
                        )
                      : [];
                  const isToday = currentTime && isSameDay(day, currentTime);

                  return (
                    // biome-ignore lint/a11y/useSemanticElements: Div container avoids nested button semantics
                    <div
                      key={day.toISOString()}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        "relative p-2 min-h-[60px] border-r border-border last:border-r-0 cursor-pointer w-full text-left bg-muted/30",
                        "hover:bg-muted/40",
                        isToday && isCurrentHour && "font-medium",
                      )}
                      onClick={() => openModal(day, slot.hour)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal(day, slot.hour);
                        }
                      }}
                      style={
                        isToday && isCurrentHour
                          ? {
                              backgroundColor: EMPLOYEE_HUB_HIGHLIGHT_BG,
                              borderColor: EMPLOYEE_HUB_HIGHLIGHT_BORDER,
                            }
                          : undefined
                      }
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
                              workType?.colorCode || MUTED_FOREGROUND_HEX_LIGHT;
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
                      {/* Render continuous time entry blocks only at first hour */}
                      {slot.hour === 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {getEntriesForSlot(day)
                            .filter((entry) => entry.startTime && entry.endTime)
                            .map((entry) => {
                              const position = calculateEntryPosition(entry);
                              if (!position) return null;

                              const workType = workTypes.find(
                                (wt) =>
                                  wt.code ===
                                  (entry.workType || "WORK").toUpperCase(),
                              );
                              const workTypeColor =
                                workType?.colorCode ||
                                MUTED_FOREGROUND_HEX_LIGHT;
                              const workTypeLabel =
                                workType?.label || "Unknown";

                              return (
                                // biome-ignore lint/a11y/useSemanticElements: Div avoids nested interactive button structure
                                <div
                                  key={
                                    entry.id || `${entry.date}-${entry.hours}`
                                  }
                                  className="absolute left-1 right-1 text-xs p-2 rounded pointer-events-auto cursor-pointer hover:shadow-md transition-shadow border-l-4"
                                  style={{
                                    backgroundColor: `${workTypeColor}20`,
                                    borderLeftColor: workTypeColor,
                                    top: `${position.top}px`,
                                    height: `${position.height}px`,
                                    zIndex: 10,
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
                                  {entry.description && (
                                    <div className="text-muted-foreground text-[10px] truncate mt-1">
                                      {entry.description}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
      <div className="border-t border-border bg-muted/30 px-4 py-3">
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
