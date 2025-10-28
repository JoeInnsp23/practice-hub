/**
 * CSV Export Utilities
 * Helper functions for converting data to CSV and triggering downloads
 */

/**
 * Convert array of objects to CSV string
 * @param data Array of objects to convert
 * @param headers Optional custom headers (uses object keys if not provided)
 * @returns CSV formatted string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[],
): string {
  if (data.length === 0) {
    return "";
  }

  // Use provided headers or extract from first object
  const cols = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = cols.map((col) => `"${col}"`).join(",");

  // Create data rows
  const dataRows = data
    .map((row) => {
      return cols
        .map((col) => {
          const value = row[col];

          // Handle different types
          if (value === null || value === undefined) {
            return '""';
          }

          if (typeof value === "number") {
            return value.toString();
          }

          if (typeof value === "boolean") {
            return value ? "true" : "false";
          }

          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }

          // Escape quotes in strings
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(",");
    })
    .join("\n");

  return `${headerRow}\n${dataRows}`;
}

/**
 * Trigger browser download of CSV content
 * @param csvContent CSV formatted string
 * @param filename Name of file to download (should end with .csv)
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Ensure filename ends with .csv
  const csvFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  // Create blob with BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Create download link
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", csvFilename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format report data for export
 * @param reportType Type of report (lead-source, pipeline, etc.)
 * @param data Report data to format
 * @returns Formatted data ready for CSV conversion
 */
export function formatReportData(
  reportType: string,
  data: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  switch (reportType) {
    case "lead-source":
      return data.map((row) => ({
        Source: row.source || "Unknown",
        "Total Leads": row.totalLeads || 0,
        "Converted to Proposals": row.converted || 0,
        "Conversion Rate": `${(Number(row.conversionRate) || 0).toFixed(1)}%`,
      }));

    case "pipeline":
      return data.map((row) => ({
        Stage: row.stage,
        "Deal Count": row.count,
        "Total Value": `£${Number(row.totalValue || 0).toLocaleString()}`,
        "Avg Deal Size": `£${Number(row.avgDealSize || 0).toLocaleString()}`,
      }));

    case "proposal-success":
      return data.map((row) => ({
        Category: row.category,
        "Total Proposals": row.total,
        Signed: row.signed,
        Rejected: row.rejected,
        "Success Rate": `${(Number(row.successRate) || 0).toFixed(1)}%`,
        "Avg Time to Sign": `${(Number(row.avgTimeToSign) || 0).toFixed(0)} days`,
      }));

    case "revenue-by-service":
      return data.map((row) => ({
        Service: row.serviceName,
        "Proposal Count": row.count,
        "Total Revenue": `£${Number(row.totalRevenue || 0).toLocaleString()}`,
        "Avg Price": `£${Number(row.avgPrice || 0).toLocaleString()}`,
        "% of Total": `${(Number(row.percentage) || 0).toFixed(1)}%`,
      }));

    default:
      return data;
  }
}

/**
 * Export report to CSV with standardized naming
 * @param reportType Type of report
 * @param data Report data
 * @param customFilename Optional custom filename
 */
export function exportReport(
  reportType: string,
  data: Array<Record<string, unknown>>,
  customFilename?: string,
): void {
  // Format data for report type
  const formattedData = formatReportData(reportType, data);

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filename = customFilename || `${reportType}-report-${timestamp}.csv`;

  // Convert to CSV and download
  const csv = convertToCSV(formattedData);
  downloadCSV(csv, filename);
}

/**
 * Export staff utilization data to CSV
 * @param data Array of staff utilization records
 */
export function exportStaffUtilizationToCSV(
  data: Array<{
    userId: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    departmentName: string | null;
    totalLoggedHours: number;
    capacityHours: number;
    utilization: number;
    billablePercentage: number;
    status: string;
  }>,
): void {
  if (!data || data.length === 0) {
    console.warn("No staff data to export");
    return;
  }

  // Format data for CSV
  const formattedData = data.map((staff) => ({
    Name: `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
    Role: staff.role || "N/A",
    Department: staff.departmentName || "N/A",
    "Logged Hours": staff.totalLoggedHours.toFixed(1),
    "Capacity Hours": staff.capacityHours.toFixed(1),
    "Utilization %": staff.utilization.toString(),
    "Billable %": staff.billablePercentage.toString(),
    Status: staff.status.charAt(0).toUpperCase() + staff.status.slice(1),
  }));

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `staff-utilization-${timestamp}.csv`;

  // Convert to CSV and download
  const csv = convertToCSV(formattedData);
  downloadCSV(csv, filename);
}
