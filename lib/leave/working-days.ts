import { differenceInBusinessDays, isWeekend, parse } from "date-fns";

/**
 * UK Bank Holidays 2025 (https://www.gov.uk/bank-holidays)
 * These need to be updated annually
 */
const UK_BANK_HOLIDAYS_2025 = [
  "2025-01-01", // New Year's Day
  "2025-04-18", // Good Friday
  "2025-04-21", // Easter Monday
  "2025-05-05", // Early May Bank Holiday
  "2025-05-26", // Spring Bank Holiday
  "2025-08-25", // Summer Bank Holiday
  "2025-12-25", // Christmas Day
  "2025-12-26", // Boxing Day
];

/**
 * UK Bank Holidays 2026 (for forward planning)
 */
const UK_BANK_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-04", // Early May Bank Holiday
  "2026-05-25", // Spring Bank Holiday
  "2026-08-31", // Summer Bank Holiday
  "2026-12-25", // Christmas Day
  "2026-12-28", // Boxing Day (substitute as 26th is Saturday)
];

/**
 * Combined UK Bank Holidays cache
 */
const UK_BANK_HOLIDAYS = new Set([
  ...UK_BANK_HOLIDAYS_2025,
  ...UK_BANK_HOLIDAYS_2026,
]);

/**
 * Check if a date is a UK bank holiday
 */
export function isUKBankHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return UK_BANK_HOLIDAYS.has(dateStr);
}

/**
 * Check if a date is a working day (not weekend or bank holiday)
 */
export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isUKBankHoliday(date);
}

/**
 * Calculate working days between two dates (excluding weekends and UK bank holidays)
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of working days
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  // Get business days (excludes weekends)
  let workingDays = differenceInBusinessDays(endDate, startDate) + 1;

  // Subtract bank holidays that fall on weekdays
  const current = new Date(startDate);
  while (current <= endDate) {
    if (!isWeekend(current) && isUKBankHoliday(current)) {
      workingDays--;
    }
    current.setDate(current.getDate() + 1);
  }

  return Math.max(0, workingDays);
}

/**
 * Calculate half-day leave (0.5 days)
 * Useful for partial day leave requests
 */
export function calculateHalfDay(): number {
  return 0.5;
}

/**
 * Get all UK bank holidays for a given year
 */
export function getUKBankHolidays(year: number): string[] {
  if (year === 2025) {
    return UK_BANK_HOLIDAYS_2025;
  }
  if (year === 2026) {
    return UK_BANK_HOLIDAYS_2026;
  }
  // For other years, return empty array (would need to be updated annually)
  return [];
}

/**
 * Validate that a leave request doesn't include only weekends/holidays
 * Returns true if the request includes at least one working day
 */
export function hasWorkingDays(startDate: Date, endDate: Date): boolean {
  return calculateWorkingDays(startDate, endDate) > 0;
}
