"use client";

import { format, startOfWeek } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerButtonProps {
  /**
   * The currently selected week start date (Monday)
   */
  selectedWeekStart: Date;
  /**
   * Callback fired when user selects a new date (automatically converts to week start)
   */
  onWeekChange: (weekStart: Date) => void;
  /**
   * Display format for the week range. Options:
   * - "full": "Jan 13-19, 2025" (default)
   * - "short": "Jan 13-19"
   * - "icon-only": Shows only calendar icon
   */
  displayFormat?: "full" | "short" | "icon-only";
  /**
   * Optional className for the button
   */
  className?: string;
}

/**
 * Enhanced date picker button for weekly timesheet navigation.
 * Displays the selected week range and provides a calendar popover for direct week selection.
 *
 * **Features:**
 * - Shows current week range in button label (e.g., "Jan 13-19, 2025")
 * - Calendar popover with week-start-on-Monday configuration
 * - Automatically converts selected date to week start (Monday)
 * - Accessible keyboard navigation
 *
 * **Usage:**
 * ```tsx
 * <DatePickerButton
 *   selectedWeekStart={currentWeekStart}
 *   onWeekChange={(weekStart) => setCurrentWeekStart(weekStart)}
 *   displayFormat="full"
 * />
 * ```
 *
 * @example
 * // Basic usage with full week range display
 * <DatePickerButton
 *   selectedWeekStart={new Date(2025, 0, 13)} // Monday Jan 13
 *   onWeekChange={(date) => console.log(date)}
 * />
 *
 * @example
 * // Compact display without year
 * <DatePickerButton
 *   selectedWeekStart={currentWeekStart}
 *   onWeekChange={setCurrentWeekStart}
 *   displayFormat="short"
 * />
 */
export function DatePickerButton({
  selectedWeekStart,
  onWeekChange,
  displayFormat = "full",
  className,
}: DatePickerButtonProps) {
  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Add 6 days for Sunday

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      onWeekChange(weekStart);
    }
  };

  const getButtonLabel = () => {
    if (displayFormat === "icon-only") {
      return null;
    }

    const startMonth = format(selectedWeekStart, "MMM");
    const endMonth = format(weekEnd, "MMM");
    const startDay = format(selectedWeekStart, "d");
    const endDay = format(weekEnd, "d");
    const year = format(selectedWeekStart, "yyyy");

    // Handle week spanning two months
    if (startMonth !== endMonth) {
      if (displayFormat === "short") {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }

    // Same month
    if (displayFormat === "short") {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  };

  const buttonLabel = getButtonLabel();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal",
            displayFormat === "icon-only" ? "w-auto" : "w-[180px]",
            className,
          )}
          aria-label={`Select week: ${format(selectedWeekStart, "MMM d")} to ${format(weekEnd, "MMM d, yyyy")}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {buttonLabel || null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={selectedWeekStart}
          onSelect={handleDateSelect}
          initialFocus
          weekStartsOn={1}
        />
      </PopoverContent>
    </Popover>
  );
}
