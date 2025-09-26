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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
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
        <Button
          onClick={() => openModal(new Date())}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Time Entry
        </Button>
      </div>

      {/* View Toggle */}
      {onViewChange && (
        <div className="flex items-center justify-between px-4 py-2 border-b">
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
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="text-primary"
          >
            Today
          </Button>
        </div>
      )}

      {/* Timesheet Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-0 sticky top-0 bg-muted/50 z-10 border-b">
            <div className="p-3 text-center text-sm font-medium text-foreground border-r">
              Time
            </div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isWeekend = index >= 5;
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-3 text-center text-sm font-medium border-r last:border-r-0",
                    isToday && "bg-primary/10",
                    isWeekend && "bg-muted/30"
                  )}
                >
                  <div className={cn(isToday && "text-primary font-semibold")}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn("text-xs", isToday ? "text-primary" : "text-muted-foreground")}>
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
                className="grid grid-cols-8 gap-0 border-b hover:bg-muted/30"
              >
                <div
                  className={cn(
                    "p-3 text-center text-sm font-medium text-foreground border-r",
                    isCurrentHour && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
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
                        "p-2 min-h-[60px] border-r last:border-r-0 cursor-pointer hover:bg-muted/30",
                        isWeekend && "bg-muted/20",
                        isToday && isCurrentHour && "bg-orange-500/10"
                      )}
                      onClick={() => openModal(day, slot.hour)}
                    >
                      {entries.length > 0 && (
                        <div className="space-y-1">
                          {entries.slice(0, 2).map((entry, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow",
                                entry.billable
                                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500"
                                  : "bg-muted text-muted-foreground border-l-2 border-muted-foreground/50"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry);
                                setSelectedDate(new Date(entry.date));
                                setIsModalOpen(true);
                              }}
                            >
                              <div className="font-medium truncate">
                                {entry.client || "No client"}
                              </div>
                              {entry.hours && (
                                <div className="text-[10px]">{entry.hours}h</div>
                              )}
                            </div>
                          ))}
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