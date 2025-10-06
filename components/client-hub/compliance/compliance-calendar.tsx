"use client";

import { format } from "date-fns";
import { AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComplianceItem } from "./compliance-list";

interface ComplianceCalendarProps {
  items: ComplianceItem[];
  onItemClick: (item: ComplianceItem) => void;
}

export function ComplianceCalendar({
  items,
  onItemClick,
}: ComplianceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust start date to beginning of week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Adjust end date to end of week
    const lastDayOfWeek = endDate.getDay();
    if (lastDayOfWeek !== 6) {
      endDate.setDate(endDate.getDate() + (6 - lastDayOfWeek));
    }

    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, ComplianceItem[]> = {};

    items.forEach((item) => {
      const date = new Date(item.dueDate);
      const dateKey = date.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });

    return grouped;
  }, [items]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/10 text-destructive";
      case "high":
        return "bg-orange-600/10 dark:bg-orange-400/10 text-orange-600 dark:text-orange-400";
      case "medium":
        return "bg-yellow-600/10 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Compliance Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[150px] text-center font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, _index) => {
            const dateKey = day.toISOString().split("T")[0];
            const dayItems = itemsByDate[dateKey] || [];
            const hasOverdue = dayItems.some(
              (item) => item.status === "overdue",
            );

            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={cn(
                  "bg-white dark:bg-gray-900 p-2 min-h-[100px] border-t",
                  !isCurrentMonth(day) &&
                    "bg-gray-50 dark:bg-gray-800 opacity-50",
                  isToday(day) && "bg-primary/5 dark:bg-primary/10",
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-primary",
                      !isCurrentMonth(day) && "text-muted-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {hasOverdue && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="w-full cursor-pointer hover:opacity-80 text-left"
                      onClick={() => onItemClick(item)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs w-full justify-start",
                          getPriorityColor(item.priority),
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </Badge>
                    </button>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
