import { addDays, addMonths } from "date-fns";

/**
 * Data required for placeholder replacement in task templates
 */
export interface PlaceholderData {
	clientName: string;
	serviceName: string;
	companyNumber?: string;
	period?: string;
	month?: string;
	year?: string;
	taxYear?: string;
	activationDate: Date;
}

/**
 * Replace placeholders in template strings with actual values
 *
 * Supported placeholders:
 * - {client_name}
 * - {service_name}
 * - {company_number}
 * - {period}
 * - {month}
 * - {year}
 * - {tax_year}
 *
 * @param template - Template string with placeholders
 * @param data - Data to replace placeholders with
 * @returns String with placeholders replaced
 */
export function replacePlaceholders(
	template: string,
	data: PlaceholderData,
): string {
	let result = template;

	// Replace all placeholders (using global flag to replace all occurrences)
	result = result.replace(/{client_name}/g, data.clientName);
	result = result.replace(/{service_name}/g, data.serviceName);
	result = result.replace(/{company_number}/g, data.companyNumber || "");
	result = result.replace(/{period}/g, data.period || "");
	result = result.replace(/{month}/g, data.month || "");
	result = result.replace(/{year}/g, data.year || "");
	result = result.replace(/{tax_year}/g, data.taxYear || "");

	return result;
}

/**
 * Calculate due date by adding offset months and days to activation date
 *
 * @param activationDate - Base date to calculate from (service activation or task generation date)
 * @param offsetDays - Number of days to add (can be negative)
 * @param offsetMonths - Number of months to add (can be negative)
 * @returns Calculated due date
 */
export function calculateDueDate(
	activationDate: Date,
	offsetDays?: number,
	offsetMonths?: number,
): Date {
	let dueDate = new Date(activationDate);

	// Apply month offset first (if specified)
	if (offsetMonths) {
		dueDate = addMonths(dueDate, offsetMonths);
	}

	// Apply day offset (if specified)
	if (offsetDays) {
		dueDate = addDays(dueDate, offsetDays);
	}

	return dueDate;
}

/**
 * Calculate target date (7 days before due date for internal completion goal)
 *
 * @param dueDate - Task due date
 * @returns Target date (7 days before due date)
 */
export function calculateTargetDate(dueDate: Date): Date {
	return addDays(dueDate, -7);
}

/**
 * Calculate period information for recurring tasks
 *
 * @param activationDate - Base activation date
 * @param periodOffset - Period offset (0 = current, 1 = next, etc.)
 * @param frequency - Recurring frequency ('monthly' | 'quarterly' | 'annually')
 * @returns Period information (name, date)
 */
export function calculatePeriodInfo(
	activationDate: Date,
	periodOffset: number,
	frequency: "monthly" | "quarterly" | "annually",
): { period: string; date: Date } {
	const date = new Date(activationDate);

	switch (frequency) {
		case "monthly": {
			const offsetDate = addMonths(date, periodOffset);
			const monthName = offsetDate.toLocaleDateString("en-GB", {
				month: "long",
			});
			const year = offsetDate.getFullYear();
			return { period: `${monthName} ${year}`, date: offsetDate };
		}

		case "quarterly": {
			const offsetDate = addMonths(date, periodOffset * 3);
			const quarter = Math.floor(offsetDate.getMonth() / 3) + 1;
			const year = offsetDate.getFullYear();
			return { period: `Q${quarter} ${year}`, date: offsetDate };
		}

		case "annually": {
			const offsetDate = new Date(date);
			offsetDate.setFullYear(date.getFullYear() + periodOffset);
			const year = offsetDate.getFullYear();
			const fiscalYear = `${year}/${(year + 1).toString().slice(2)}`;
			return { period: fiscalYear, date: offsetDate };
		}

		default:
			return { period: "", date };
	}
}

/**
 * Calculate tax year from a given date (UK tax year: 6 April to 5 April)
 *
 * @param date - Date to calculate tax year for
 * @returns Tax year string (e.g., "2024/25")
 */
export function calculateTaxYear(date: Date): string {
	const year = date.getFullYear();
	const taxYearStart = new Date(year, 3, 6); // April 6th

	// If date is before April 6th, it's in the previous tax year
	if (date < taxYearStart) {
		return `${year - 1}/${year.toString().slice(2)}`;
	}

	return `${year}/${(year + 1).toString().slice(2)}`;
}
