/**
 * CSV Parser Service - Parse and validate CSV files for bulk import
 *
 * Uses Papa Parse for robust CSV parsing with error handling
 * Supports streaming for large files
 */

import Papa from "papaparse";

/**
 * Error information for a single row
 */
export interface CSVRowError {
  row: number; // 1-indexed row number (excluding header)
  field: string;
  error: string;
}

/**
 * Validation result for a single row
 */
export interface RowValidationResult {
  valid: boolean;
  errors: string[]; // Array of error messages
}

/**
 * Result of CSV parsing operation
 */
export interface CSVParseResult<T> {
  data: T[]; // Valid, parsed rows
  errors: CSVRowError[]; // Errors encountered during parsing/validation
  meta: {
    fields: string[]; // CSV header fields
    rowCount: number; // Total rows processed (excluding header)
    validCount: number; // Number of valid rows
    invalidCount: number; // Number of invalid rows
  };
}

/**
 * Options for CSV parsing
 */
export interface CSVParseOptions<T> {
  /** Validator function for each row */
  validator: (row: Record<string, unknown>) => RowValidationResult;
  /** Transform function to convert validated row to typed object (optional) */
  transform?: (row: Record<string, unknown>) => T;
  /** Skip empty lines (default: true) */
  skipEmptyLines?: boolean;
  /** Trim whitespace from values (default: true) */
  trimValues?: boolean;
}

/**
 * Parse a CSV file with validation
 *
 * @param file - File object to parse (browser File API)
 * @param options - Parsing and validation options
 * @returns Promise resolving to parsed result with data and errors
 *
 * @example
 * const result = await parseCSV<ClientImportRow>(file, {
 *   validator: validateClientRow,
 *   transform: (row) => ({
 *     name: row.company_name as string,
 *     email: row.email as string,
 *     type: row.client_type as ClientType,
 *   }),
 * });
 */
export async function parseCSV<T>(
  file: File,
  options: CSVParseOptions<T>,
): Promise<CSVParseResult<T>> {
  const {
    validator,
    transform,
    skipEmptyLines = true,
    trimValues = true,
  } = options;

  return new Promise((resolve, reject) => {
    const errors: CSVRowError[] = [];
    const validData: T[] = [];
    let rowCount = 0;
    let headerFields: string[] = [];

    Papa.parse<Record<string, string>>(file, {
      header: true, // First row is header
      skipEmptyLines: skipEmptyLines ? "greedy" : false, // Skip empty lines
      trimHeaders: true, // Trim whitespace from headers
      dynamicTyping: false, // Keep all values as strings for validation
      transformHeader: (header: string) => {
        // Normalize header names (lowercase, replace spaces with underscores)
        return header.trim().toLowerCase().replace(/\s+/g, "_");
      },
      transform: trimValues
        ? (value: string) => value.trim() // Trim whitespace from values
        : undefined,
      step: (results: Papa.ParseStepResult<Record<string, string>>) => {
        rowCount++;

        // Store header fields on first row
        if (rowCount === 1 && results.meta.fields) {
          headerFields = results.meta.fields;
        }

        const row = results.data;

        // Validate the row
        const validation = validator(row as Record<string, unknown>);

        if (validation.valid) {
          // Transform and add to valid data
          const transformed = transform
            ? transform(row as Record<string, unknown>)
            : (row as unknown as T);
          validData.push(transformed);
        } else {
          // Add errors for this row
          for (const errorMsg of validation.errors) {
            // Try to extract field name from error message if present
            const fieldMatch = errorMsg.match(/^(\w+):/);
            const field = fieldMatch ? fieldMatch[1] : "unknown";
            const error = fieldMatch
              ? errorMsg.replace(/^\w+:\s*/, "")
              : errorMsg;

            errors.push({
              row: rowCount,
              field,
              error,
            });
          }
        }
      },
      complete: () => {
        resolve({
          data: validData,
          errors,
          meta: {
            fields: headerFields,
            rowCount,
            validCount: validData.length,
            invalidCount: errors.length > 0 ? rowCount - validData.length : 0,
          },
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Parse CSV from text string (alternative to file upload)
 *
 * @param csvText - CSV content as string
 * @param options - Parsing and validation options
 * @returns Promise resolving to parsed result
 */
export async function parseCSVFromText<T>(
  csvText: string,
  options: CSVParseOptions<T>,
): Promise<CSVParseResult<T>> {
  const {
    validator,
    transform,
    skipEmptyLines = true,
    trimValues = true,
  } = options;

  return new Promise((resolve, reject) => {
    const errors: CSVRowError[] = [];
    const validData: T[] = [];
    let rowCount = 0;
    let headerFields: string[] = [];

    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: skipEmptyLines ? "greedy" : false,
      trimHeaders: true,
      dynamicTyping: false,
      transformHeader: (header: string) => {
        return header.trim().toLowerCase().replace(/\s+/g, "_");
      },
      transform: trimValues ? (value: string) => value.trim() : undefined,
      step: (results: Papa.ParseStepResult<Record<string, string>>) => {
        rowCount++;

        if (rowCount === 1 && results.meta.fields) {
          headerFields = results.meta.fields;
        }

        const row = results.data;
        const validation = validator(row as Record<string, unknown>);

        if (validation.valid) {
          const transformed = transform
            ? transform(row as Record<string, unknown>)
            : (row as unknown as T);
          validData.push(transformed);
        } else {
          for (const errorMsg of validation.errors) {
            const fieldMatch = errorMsg.match(/^(\w+):/);
            const field = fieldMatch ? fieldMatch[1] : "unknown";
            const error = fieldMatch
              ? errorMsg.replace(/^\w+:\s*/, "")
              : errorMsg;

            errors.push({
              row: rowCount,
              field,
              error,
            });
          }
        }
      },
      complete: () => {
        resolve({
          data: validData,
          errors,
          meta: {
            fields: headerFields,
            rowCount,
            validCount: validData.length,
            invalidCount: errors.length > 0 ? rowCount - validData.length : 0,
          },
        });
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Generate CSV from array of objects
 *
 * @param data - Array of objects to convert to CSV
 * @param fields - Optional array of field names to include (defaults to all fields)
 * @returns CSV string
 *
 * @example
 * const csv = generateCSV(clients, ['name', 'email', 'type']);
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  fields?: string[],
): string {
  if (data.length === 0) {
    return "";
  }

  // Determine fields to include
  const fieldNames = fields || Object.keys(data[0]);

  // Generate CSV using Papa Parse
  return Papa.unparse(data, {
    columns: fieldNames,
    header: true,
  });
}

/**
 * Download CSV file in browser
 *
 * @param csv - CSV content string
 * @param filename - File name for download
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
