import { format } from "date-fns";

export const SUPPORTED_PLACEHOLDERS = {
  client_name: "Client company name",
  service_name: "Service name",
  period: "Current period (e.g., Q1 2025)",
  period_end_date: "Period end date (e.g., 31/03/2025)",
  tax_year: "Tax year (e.g., 2024/25)",
  company_number: "Companies House number",
  quarter: "Current quarter (1-4)",
  month: "Current month name",
  year: "Current year",
};

export interface PlaceholderData {
  clientName?: string;
  serviceName?: string;
  period?: string;
  periodEndDate?: Date;
  taxYear?: string;
  companyNumber?: string;
  activationDate?: Date;
}

export function replacePlaceholders(
  text: string,
  data: PlaceholderData,
): string {
  let result = text;

  // Replace client name
  if (data.clientName) {
    result = result.replace(/{client_name}/g, data.clientName);
  }

  // Replace service name
  if (data.serviceName) {
    result = result.replace(/{service_name}/g, data.serviceName);
  }

  // Replace period
  if (data.period) {
    result = result.replace(/{period}/g, data.period);
  }

  // Replace tax year
  if (data.taxYear) {
    result = result.replace(/{tax_year}/g, data.taxYear);
  }

  // Replace company number
  if (data.companyNumber) {
    result = result.replace(/{company_number}/g, data.companyNumber);
  }

  // Replace period end date
  if (data.periodEndDate) {
    const formattedDate = format(data.periodEndDate, "dd/MM/yyyy");
    result = result.replace(/{period_end_date}/g, formattedDate);
  }

  // Replace quarter (derived from activation date)
  if (data.activationDate) {
    const quarter = Math.ceil((data.activationDate.getMonth() + 1) / 3);
    result = result.replace(/{quarter}/g, quarter.toString());

    const month = format(data.activationDate, "MMMM");
    result = result.replace(/{month}/g, month);

    const year = format(data.activationDate, "yyyy");
    result = result.replace(/{year}/g, year);
  }

  return result;
}

export function validatePlaceholders(text: string): {
  valid: boolean;
  errors: string[];
} {
  const placeholderRegex = /{([^}]+)}/g;
  const errors: string[] = [];
  const matches = text.matchAll(placeholderRegex);

  for (const match of matches) {
    const placeholderName = match[1];
    if (!Object.hasOwn(SUPPORTED_PLACEHOLDERS, placeholderName)) {
      errors.push(`Invalid placeholder: {${placeholderName}}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function calculateDueDate(
  activationDate: Date,
  offsetDays: number,
  offsetMonths: number,
): Date {
  const dueDate = new Date(activationDate);

  if (offsetMonths > 0) {
    dueDate.setMonth(dueDate.getMonth() + offsetMonths);
  }

  if (offsetDays > 0) {
    dueDate.setDate(dueDate.getDate() + offsetDays);
  }

  return dueDate;
}

/**
 * Calculate the period end date based on activation date and recurring frequency
 * For quarterly: End of the quarter (Mar 31, Jun 30, Sep 30, Dec 31)
 * For monthly: Last day of the month
 * For annually: End of the tax year (April 5th in UK)
 */
export function calculatePeriodEndDate(
  activationDate: Date,
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually",
  dayOfMonth?: number,
): Date {
  const date = new Date(activationDate);

  switch (frequency) {
    case "daily":
      // Period ends same day
      return new Date(date);

    case "weekly": {
      // Period ends at end of week (Sunday)
      const dayOfWeek = date.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      date.setDate(date.getDate() + daysUntilSunday);
      return date;
    }

    case "monthly":
      // Period ends on last day of month (or specific day if provided)
      if (dayOfMonth) {
        date.setDate(dayOfMonth);
      } else {
        // Last day of month
        date.setMonth(date.getMonth() + 1);
        date.setDate(0); // Sets to last day of previous month
      }
      return date;

    case "quarterly": {
      // Period ends on last day of quarter (Mar 31, Jun 30, Sep 30, Dec 31)
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      const quarterEndMonth = quarter * 3 - 1; // 0-indexed: Q1=2(Mar), Q2=5(Jun), Q3=8(Sep), Q4=11(Dec)
      date.setMonth(quarterEndMonth + 1);
      date.setDate(0); // Last day of quarter month
      return date;
    }

    case "annually": {
      // Period ends on tax year end (April 5th in UK)
      const taxYearEnd = new Date(date.getFullYear(), 3, 5); // April 5th
      if (date > taxYearEnd) {
        // If activation is after April 5, period ends next year
        taxYearEnd.setFullYear(taxYearEnd.getFullYear() + 1);
      }
      return taxYearEnd;
    }

    default:
      return date;
  }
}

/**
 * Calculate the next period's activation date after task completion
 * This is used to auto-generate the next recurring task
 */
export function calculateNextPeriod(
  currentPeriodEndDate: Date,
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually",
): Date {
  const nextDate = new Date(currentPeriodEndDate);
  nextDate.setDate(nextDate.getDate() + 1); // Start day after current period ends

  switch (frequency) {
    case "daily":
      return nextDate;

    case "weekly":
      return nextDate;

    case "monthly":
      // Next period starts on 1st of next month
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + 1);
      return nextDate;

    case "quarterly":
      // Next period starts on 1st of next quarter
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + 3);
      return nextDate;

    case "annually":
      // Next period starts day after current tax year ends
      return nextDate;

    default:
      return nextDate;
  }
}
