/**
 * Enhanced CSV Parser Utilities
 *
 * Provides advanced CSV parsing features:
 * - Multi-delimiter support (comma, semicolon, tab)
 * - Delimiter auto-detection
 * - Advanced date parsing with multiple format support
 * - Date format auto-detection
 * - BOM (Byte Order Mark) handling
 * - Value transformation utilities
 *
 * Story: STORY-5.2 (Epic 5 - Bulk Operations)
 */

import { isValid, parse } from "date-fns";

// ============================================
// Type Definitions
// ============================================

export type Delimiter = "," | ";" | "\t";

export type DateFormat =
  | "DD/MM/YYYY"
  | "YYYY-MM-DD"
  | "MM/DD/YYYY"
  | "DD-MM-YYYY";

export interface CSVParserConfig {
  delimiter?: Delimiter;
  dateFormats?: string[];
  encoding?: string;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
  stripBOM?: boolean;
}

// ============================================
// Constants
// ============================================

/**
 * Supported CSV delimiters in priority order
 */
export const SUPPORTED_DELIMITERS: Delimiter[] = [",", ";", "\t"];

/**
 * Default date formats to try (in priority order)
 * Covers UK (DD/MM/YYYY), ISO (YYYY-MM-DD), US (MM/DD/YYYY), and hyphenated UK (DD-MM-YYYY)
 */
export const DEFAULT_DATE_FORMATS: string[] = [
  "dd/MM/yyyy", // UK format: 31/12/2025
  "yyyy-MM-dd", // ISO format: 2025-12-31
  "MM/dd/yyyy", // US format: 12/31/2025
  "dd-MM-yyyy", // Hyphenated UK: 31-12-2025
  "dd.MM.yyyy", // Dotted format: 31.12.2025
  "yyyy/MM/dd", // Alternative ISO: 2025/12/31
];

/**
 * UTF-8 Byte Order Mark character
 */
export const UTF8_BOM = "\uFEFF";

/**
 * UTF-16 Big Endian BOM
 */
export const UTF16BE_BOM = "\uFEFE";

/**
 * UTF-16 Little Endian BOM
 */
export const UTF16LE_BOM = "\uFFFE";

// ============================================
// BOM Handling (AC5)
// ============================================

/**
 * Strip Byte Order Mark (BOM) from CSV content
 *
 * Handles UTF-8, UTF-16BE, and UTF-16LE BOMs
 *
 * @param content - CSV content string
 * @returns Content with BOM removed
 *
 * @example
 * const cleaned = stripBOM("\uFEFFname,email\nJohn,john@example.com");
 * // Returns: "name,email\nJohn,john@example.com"
 */
export function stripBOM(content: string): string {
  if (!content) return content;

  // Remove UTF-8 BOM
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }

  // Remove UTF-16 BOMs
  if (content.startsWith(UTF16BE_BOM) || content.startsWith(UTF16LE_BOM)) {
    return content.slice(1);
  }

  return content;
}

/**
 * Check if content starts with a BOM
 *
 * @param content - Content to check
 * @returns True if BOM is present
 */
export function hasBOM(content: string): boolean {
  if (!content) return false;
  return (
    content.charCodeAt(0) === 0xfeff ||
    content.startsWith(UTF16BE_BOM) ||
    content.startsWith(UTF16LE_BOM)
  );
}

// ============================================
// Delimiter Detection (AC1, AC2)
// ============================================

/**
 * Detect the most likely delimiter from CSV content
 *
 * Analyzes the first row to determine which delimiter appears most frequently.
 * Returns comma as default if no clear winner.
 *
 * @param content - CSV content (first few lines recommended)
 * @returns Detected delimiter (comma, semicolon, or tab)
 *
 * @example
 * const delimiter = detectDelimiter("name;email;phone\nJohn;john@test.com;123");
 * // Returns: ";"
 */
export function detectDelimiter(content: string): Delimiter {
  if (!content) return ",";

  // Get first non-empty line
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return ",";

  const firstLine = lines[0];

  // Count occurrences of each delimiter in the first line
  const counts: Record<Delimiter, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };

  // Find delimiter with highest count
  let maxCount = 0;
  let detectedDelimiter: Delimiter = ",";

  for (const delimiter of SUPPORTED_DELIMITERS) {
    if (counts[delimiter] > maxCount) {
      maxCount = counts[delimiter];
      detectedDelimiter = delimiter;
    }
  }

  // If no delimiters found, default to comma
  return maxCount > 0 ? detectedDelimiter : ",";
}

/**
 * Analyze delimiter usage across multiple lines for better detection
 *
 * More robust than single-line detection - checks consistency across rows
 *
 * @param content - CSV content
 * @param linesToCheck - Number of lines to analyze (default: 5)
 * @returns Detected delimiter
 */
export function detectDelimiterRobust(
  content: string,
  linesToCheck = 5,
): Delimiter {
  if (!content) return ",";

  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .slice(0, linesToCheck);

  if (lines.length === 0) return ",";

  // Count delimiter occurrences per line
  const delimiterConsistency: Record<Delimiter, number[]> = {
    ",": [],
    ";": [],
    "\t": [],
  };

  for (const line of lines) {
    delimiterConsistency[","].push((line.match(/,/g) || []).length);
    delimiterConsistency[";"].push((line.match(/;/g) || []).length);
    delimiterConsistency["\t"].push((line.match(/\t/g) || []).length);
  }

  // Calculate average count and consistency for each delimiter
  let bestDelimiter: Delimiter = ",";
  let bestScore = 0;

  for (const delimiter of SUPPORTED_DELIMITERS) {
    const counts = delimiterConsistency[delimiter];
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

    // Check consistency (all lines should have similar count)
    const isConsistent = counts.every((c) => Math.abs(c - avg) <= 2);

    // Score = average count * consistency bonus
    const score = avg * (isConsistent ? 2 : 1);

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestScore > 0 ? bestDelimiter : ",";
}

// ============================================
// Date Parsing (AC3, AC4)
// ============================================

/**
 * Parse date string with multiple format support
 *
 * Tries each format in order until a valid date is found.
 * Returns null if no format matches.
 *
 * @param value - Date string to parse
 * @param formats - Array of date-fns format strings (optional, uses defaults)
 * @returns Parsed Date object or null
 *
 * @example
 * parseDate("31/12/2025"); // UK format
 * parseDate("2025-12-31"); // ISO format
 * parseDate("12/31/2025", ["MM/dd/yyyy"]); // US format explicitly
 */
export function parseDate(
  value: string,
  formats: string[] = DEFAULT_DATE_FORMATS,
): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmedValue = value.trim();
  const referenceDate = new Date();

  // Try each format in order
  for (const format of formats) {
    try {
      const parsed = parse(trimmedValue, format, referenceDate);

      // Verify the parsed date is valid
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to next format
    }
  }

  return null;
}

/**
 * Parse date with auto-format detection
 *
 * Convenience wrapper for parseDate with default formats
 *
 * @param value - Date string
 * @returns Parsed Date or null
 */
export function parseDateAuto(value: string): Date | null {
  return parseDate(value, DEFAULT_DATE_FORMATS);
}

/**
 * Convert date to ISO string (YYYY-MM-DD format)
 *
 * @param date - Date to convert
 * @returns ISO date string or null
 */
export function toISODateString(date: Date | null): string | null {
  if (!date || !isValid(date)) {
    return null;
  }

  return date.toISOString().split("T")[0];
}

// ============================================
// Value Transformation Utilities (AC8)
// ============================================

/**
 * Parse numeric string to number
 *
 * Handles various formats: "1,234.56", "1 234.56", etc.
 *
 * @param value - String to parse
 * @returns Parsed number or null
 *
 * @example
 * parseNumber("1,234.56"); // 1234.56
 * parseNumber("€ 500.00"); // 500
 * parseNumber("invalid"); // null
 */
export function parseNumber(value: string): number | null {
  if (!value || value.trim() === "") {
    return null;
  }

  // Remove common currency symbols, spaces, and thousand separators
  const cleaned = value
    .replace(/[£$€¥,\s]/g, "")
    .replace(/\(/g, "-") // Handle negative numbers in parentheses
    .replace(/\)/g, "")
    .trim();

  const parsed = Number.parseFloat(cleaned);

  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Parse boolean string to boolean
 *
 * Recognizes: true/false, yes/no, 1/0, on/off (case-insensitive)
 *
 * @param value - String to parse
 * @param defaultValue - Default value if parsing fails (default: false)
 * @returns Boolean value
 *
 * @example
 * parseBoolean("yes"); // true
 * parseBoolean("1"); // true
 * parseBoolean("false"); // false
 * parseBoolean("invalid"); // false
 */
export function parseBoolean(value: string, defaultValue = false): boolean {
  if (!value || value.trim() === "") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  // Truthy values
  if (
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "1" ||
    normalized === "on" ||
    normalized === "t" ||
    normalized === "y"
  ) {
    return true;
  }

  // Falsy values
  if (
    normalized === "false" ||
    normalized === "no" ||
    normalized === "0" ||
    normalized === "off" ||
    normalized === "f" ||
    normalized === "n"
  ) {
    return false;
  }

  return defaultValue;
}

/**
 * Transform value to specified type
 *
 * Utility function that applies the appropriate transformation based on type
 *
 * @param value - Value to transform
 * @param type - Target type (date, number, boolean, or string)
 * @returns Transformed value
 */
export function transformValue(
  value: string,
  type: "date" | "number" | "boolean" | "string",
): unknown {
  if (type === "date") {
    return parseDateAuto(value);
  }

  if (type === "number") {
    return parseNumber(value);
  }

  if (type === "boolean") {
    return parseBoolean(value);
  }

  // Default: return as string (trimmed)
  return value?.trim() || null;
}

/**
 * Transform CSV row values based on field types
 *
 * @param row - CSV row data
 * @param fieldTypes - Map of field names to types
 * @returns Transformed row
 *
 * @example
 * const row = { name: "John", active: "yes", joined: "2025-01-15", age: "30" };
 * const types = { active: "boolean", joined: "date", age: "number" };
 * const transformed = transformRow(row, types);
 * // { name: "John", active: true, joined: Date(...), age: 30 }
 */
export function transformRow<T extends Record<string, unknown>>(
  row: Record<string, string>,
  fieldTypes: Record<string, "date" | "number" | "boolean" | "string">,
): T {
  const transformed: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(row)) {
    const type = fieldTypes[field] || "string";
    transformed[field] = transformValue(value, type);
  }

  return transformed as T;
}
