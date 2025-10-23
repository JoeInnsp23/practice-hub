/**
 * CSV Import Service
 *
 * Handles CSV file parsing, validation, and bulk import operations
 * - Parses CSV files using Papa Parse
 * - Validates data using Zod schemas
 * - Provides row-level error reporting
 * - Supports dry-run mode for validation-only
 */

import Papa from "papaparse";
import type { ZodSchema } from "zod";

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface ParseResult<T> {
  data: T[];
  errors: ImportError[];
  meta: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    skippedRows: number;
  };
}

export interface CsvParseOptions {
  skipEmptyLines?: boolean;
  trimHeaders?: boolean;
  trimValues?: boolean;
  dynamicTyping?: boolean;
}

/**
 * Parse and validate CSV file
 *
 * @param file - File or string content to parse
 * @param schema - Zod schema for validation
 * @param options - Papa Parse configuration options
 * @returns Parsed and validated data with errors
 */
export async function parseCsvFile<T>(
  file: File | string,
  schema: ZodSchema<T>,
  options: CsvParseOptions = {},
): Promise<ParseResult<T>> {
  const {
    skipEmptyLines = true,
    trimHeaders = true,
    trimValues = true,
    dynamicTyping = false, // Disabled: schemas expect strings and handle their own transformations
  } = options;

  return new Promise((resolve) => {
    const validData: T[] = [];
    const errors: ImportError[] = [];
    let totalRows = 0;
    let skippedRows = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: false, // Get all rows so we can count skipped ones
      dynamicTyping,
      transformHeader: (header: string) => {
        return trimHeaders ? header.trim() : header;
      },
      transform: (value: string) => {
        return trimValues ? value.trim() : value;
      },
      complete: (results) => {
        // Process all rows and manually handle empty row skipping
        const rowsToProcess: Array<{ row: any; rowNumber: number }> = [];
        let currentRowNumber = 1; // Start after header
        const headers = results.meta.fields || [];

        results.data.forEach((row: any) => {
          currentRowNumber++;

          // Check if this is a blank line vs a row with empty values
          // Blank lines have MISSING fields (undefined), rows with commas have empty string values
          const isTrulyBlankLine = headers.some((field) => !(field in row));

          if (isTrulyBlankLine && skipEmptyLines) {
            // Skip truly blank lines (missing fields) if option is enabled
            skippedRows++;
          } else {
            // Keep all other rows (including rows with empty values to be validated)
            rowsToProcess.push({ row, rowNumber: currentRowNumber });
          }
        });

        totalRows = rowsToProcess.length + skippedRows;

        // Validate each row (including rows with empty field values)
        rowsToProcess.forEach(({ row, rowNumber }) => {
          // Validate row against schema
          const validation = schema.safeParse(row);

          if (validation.success) {
            validData.push(validation.data);
          } else {
            // Collect validation errors
            validation.error.issues.forEach((issue) => {
              errors.push({
                row: rowNumber,
                field: issue.path.join("."),
                message: issue.message,
                value: row[issue.path[0] as string],
              });
            });
          }
        });

        resolve({
          data: validData,
          errors,
          meta: {
            totalRows,
            validRows: validData.length,
            invalidRows: totalRows - validData.length - skippedRows,
            skippedRows,
          },
        });
      },
      error: (error) => {
        // Papa Parse parsing error
        errors.push({
          row: 0,
          field: "file",
          message: `CSV parsing error: ${error.message}`,
        });

        resolve({
          data: [],
          errors,
          meta: {
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            skippedRows: 0,
          },
        });
      },
    });
  });
}

/**
 * Generate CSV template with headers
 *
 * @param fields - Field names for CSV columns
 * @param includeExampleRow - Include an example data row
 * @returns CSV string
 */
export function generateCsvTemplate(
  fields: string[],
  includeExampleRow = false,
  exampleData?: Record<string, string>,
): string {
  const headers = fields.join(",");

  if (!includeExampleRow) {
    return headers;
  }

  const exampleRow = fields
    .map((field) => exampleData?.[field] || "")
    .join(",");

  return `${headers}\n${exampleRow}`;
}

/**
 * Convert data to CSV string
 *
 * @param data - Array of objects to convert
 * @param fields - Optional specific fields to include
 * @returns CSV string
 */
export function dataToCSV<T extends Record<string, unknown>>(
  data: T[],
  fields?: string[],
): string {
  if (data.length === 0) {
    return "";
  }

  const columns = fields || Object.keys(data[0]);

  return Papa.unparse(data, {
    columns,
    header: true,
  });
}

/**
 * Validate CSV headers against expected fields
 *
 * @param file - CSV file to check
 * @param expectedFields - Required field names
 * @returns Validation result
 */
export async function validateCsvHeaders(
  file: File | string,
  expectedFields: string[],
): Promise<{
  valid: boolean;
  missingFields: string[];
  extraFields: string[];
  headers: string[];
}> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      preview: 1,
      header: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
        const normalizedExpected = expectedFields.map((f) =>
          f.trim().toLowerCase(),
        );

        const missingFields = normalizedExpected.filter(
          (field) => !normalizedHeaders.includes(field),
        );
        const extraFields = normalizedHeaders.filter(
          (field) => !normalizedExpected.includes(field),
        );

        resolve({
          valid: missingFields.length === 0,
          missingFields,
          extraFields,
          headers,
        });
      },
    });
  });
}

/**
 * Batch data into chunks for processing
 *
 * @param data - Array to chunk
 * @param size - Chunk size
 * @returns Array of chunks
 */
export function chunkData<T>(data: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }

  return chunks;
}
