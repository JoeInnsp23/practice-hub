import { format } from "date-fns";

export const SUPPORTED_PLACEHOLDERS = {
  client_name: "Client company name",
  service_name: "Service name",
  period: "Current period (e.g., Q1 2025)",
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
    if (!SUPPORTED_PLACEHOLDERS.hasOwnProperty(placeholderName)) {
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
  let dueDate = new Date(activationDate);

  if (offsetMonths > 0) {
    dueDate.setMonth(dueDate.getMonth() + offsetMonths);
  }

  if (offsetDays > 0) {
    dueDate.setDate(dueDate.getDate() + offsetDays);
  }

  return dueDate;
}
