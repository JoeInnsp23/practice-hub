"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface ComplianceItem {
  id: string;
  title: string;
  client: string;
  type: string;
  dueDate: Date;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
}

interface ComplianceCalendarProps {
  items: ComplianceItem[];
  onItemClick: (item: ComplianceItem) => void;
}

export function ComplianceCalendar({ items, onItemClick }: ComplianceCalendarProps) {
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
      const dateKey = item.dueDate.toISOString().split("T")[0];
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
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
              {currentDate.toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
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
          {calendarDays.map((day, index) => {
            const dateKey = day.toISOString().split("T")[0];
            const dayItems = itemsByDate[dateKey] || [];
            const hasOverdue = dayItems.some((item) => item.status === "overdue");

            return (
              <div
                key={index}
                className={cn(
                  "bg-white dark:bg-gray-900 p-2 min-h-[100px] border-t",
                  !isCurrentMonth(day) && "bg-gray-50 dark:bg-gray-800 opacity-50",
                  isToday(day) && "bg-blue-50 dark:bg-blue-950"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isToday(day) && "text-blue-600",
                      !isCurrentMonth(day) && "text-slate-500"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  {hasOverdue && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => onItemClick(item)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn("text-xs w-full justify-start", getPriorityColor(item.priority))}
                      >
                        <span className="truncate">{item.client}</span>
                      </Badge>
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-xs text-slate-600">
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