"use client";

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

interface LeaveCalendarProps {
  leaveRequests: Array<{
    id: string;
    userId: string;
    userName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  className?: string;
}

const leaveTypeColors: Record<string, string> = {
  annual_leave: "bg-green-500",
  sick_leave: "bg-red-500",
  toil: "bg-blue-500",
  unpaid: "bg-gray-400",
  other: "bg-purple-500",
};

const leaveTypeLabels: Record<string, string> = {
  annual_leave: "Annual Leave",
  sick_leave: "Sick Leave",
  toil: "TOIL",
  unpaid: "Unpaid",
  other: "Other",
};

export function LeaveCalendar({ leaveRequests, className }: LeaveCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Get leave requests for a specific day
  const getLeaveForDay = (day: Date) => {
    return leaveRequests.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return day >= start && day <= end && leave.status === "approved";
    });
  };

  // Get leave requests for selected date
  const selectedDateLeave = selectedDate ? getLeaveForDay(selectedDate) : [];

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Team Leave Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-muted">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium py-2 border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayLeave = getLeaveForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              const isWeekendDay = isWeekend(day);

              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] p-1 border-r border-b text-left transition-colors hover:bg-muted/50",
                    idx % 7 === 6 && "border-r-0",
                    !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                    isWeekendDay && "bg-slate-50 dark:bg-slate-900/20",
                    isSelected && "ring-2 ring-primary ring-inset",
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium mb-1",
                      isCurrentDay &&
                        "inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {/* Leave indicators */}
                  <div className="space-y-0.5">
                    {dayLeave.slice(0, 3).map((leave) => (
                      <div
                        key={leave.id}
                        className={cn(
                          "h-1.5 rounded-full",
                          leaveTypeColors[leave.leaveType] || "bg-gray-400",
                        )}
                        title={`${leave.userName} - ${leaveTypeLabels[leave.leaveType]}`}
                      />
                    ))}
                    {dayLeave.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayLeave.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <div className="text-xs font-medium text-muted-foreground">Legend:</div>
          {Object.entries(leaveTypeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className={cn("h-3 w-3 rounded-full", leaveTypeColors[type])}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateLeave.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-3">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </div>
            <div className="space-y-2">
              {selectedDateLeave.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full",
                        leaveTypeColors[leave.leaveType],
                      )}
                    />
                    <span className="text-sm font-medium">{leave.userName}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {leaveTypeLabels[leave.leaveType]}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedDateLeave.length === 0 && (
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            No team members on leave on {format(selectedDate, "MMMM d, yyyy")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
