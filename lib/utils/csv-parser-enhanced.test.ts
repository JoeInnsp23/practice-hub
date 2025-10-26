/**
 * Tests for Enhanced CSV Parser Utilities
 *
 * Comprehensive test coverage for:
 * - BOM handling
 * - Delimiter detection
 * - Date parsing
 * - Value transformations
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_DATE_FORMATS,
  detectDelimiter,
  detectDelimiterRobust,
  hasBOM,
  parseBoolean,
  parseDate,
  parseDateAuto,
  parseNumber,
  stripBOM,
  toISODateString,
  transformRow,
  transformValue,
  UTF8_BOM,
} from "./csv-parser-enhanced";

describe("Enhanced CSV Parser Utilities", () => {
  // ============================================
  // BOM Handling Tests (AC5)
  // ============================================

  describe("stripBOM", () => {
    it("should remove UTF-8 BOM from start of string", () => {
      const withBOM = `${UTF8_BOM}name,email\nJohn,john@test.com`;
      const result = stripBOM(withBOM);

      expect(result).toBe("name,email\nJohn,john@test.com");
      expect(result.charCodeAt(0)).not.toBe(0xfeff);
    });

    it("should handle content without BOM", () => {
      const withoutBOM = "name,email\nJohn,john@test.com";
      const result = stripBOM(withoutBOM);

      expect(result).toBe(withoutBOM);
    });

    it("should handle empty string", () => {
      expect(stripBOM("")).toBe("");
    });

    it("should only remove BOM from start, not middle", () => {
      const content = `name,email\nJohn${UTF8_BOM},john@test.com`;
      const result = stripBOM(content);

      expect(result).toBe(content);
    });

    it("should handle UTF-16 BOMs", () => {
      const utf16BE = "\uFEFEname,email";
      const utf16LE = "\uFFFEname,email";

      expect(stripBOM(utf16BE)).toBe("name,email");
      expect(stripBOM(utf16LE)).toBe("name,email");
    });
  });

  describe("hasBOM", () => {
    it("should detect UTF-8 BOM", () => {
      expect(hasBOM(`${UTF8_BOM}content`)).toBe(true);
    });

    it("should detect UTF-16 BOMs", () => {
      expect(hasBOM("\uFEFEcontent")).toBe(true);
      expect(hasBOM("\uFFFEcontent")).toBe(true);
    });

    it("should return false for content without BOM", () => {
      expect(hasBOM("content")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(hasBOM("")).toBe(false);
    });
  });

  // ============================================
  // Delimiter Detection Tests (AC1, AC2)
  // ============================================

  describe("detectDelimiter", () => {
    it("should detect comma delimiter", () => {
      const csv = "name,email,phone\nJohn,john@test.com,123456";
      expect(detectDelimiter(csv)).toBe(",");
    });

    it("should detect semicolon delimiter", () => {
      const csv = "name;email;phone\nJohn;john@test.com;123456";
      expect(detectDelimiter(csv)).toBe(";");
    });

    it("should detect tab delimiter", () => {
      const csv = "name\temail\tphone\nJohn\tjohn@test.com\t123456";
      expect(detectDelimiter(csv)).toBe("\t");
    });

    it("should default to comma if no delimiters found", () => {
      const csv = "nameemailphone\nJohnJohntest123456";
      expect(detectDelimiter(csv)).toBe(",");
    });

    it("should handle empty string", () => {
      expect(detectDelimiter("")).toBe(",");
    });

    it("should choose delimiter with highest count", () => {
      const csv = "name,email;extra\nJohn,john@test.com;data";
      expect(detectDelimiter(csv)).toBe(","); // 2 commas vs 1 semicolon
    });

    it("should ignore empty lines", () => {
      const csv = "\n\nname,email,phone\nJohn,john@test.com,123";
      expect(detectDelimiter(csv)).toBe(",");
    });

    it("should handle CSV with BOM", () => {
      const csv = `${UTF8_BOM}name;email;phone\nJohn;john@test.com;123`;
      expect(detectDelimiter(csv)).toBe(";");
    });
  });

  describe("detectDelimiterRobust", () => {
    it("should detect delimiter with consistent usage", () => {
      const csv = `name,email,phone
John,john@test.com,123
Jane,jane@test.com,456
Bob,bob@test.com,789`;

      expect(detectDelimiterRobust(csv)).toBe(",");
    });

    it("should handle mixed delimiters by choosing most consistent", () => {
      const csv = `name,email,phone
John,john@test.com,123
Jane;jane@test.com;456
Bob,bob@test.com,789`;

      expect(detectDelimiterRobust(csv)).toBe(","); // More consistent
    });

    it("should analyze multiple lines for better accuracy", () => {
      const csv = `name;email;phone
John;john@test.com;123
Jane;jane@test.com;456
Bob;bob@test.com;789
Alice;alice@test.com;111`;

      expect(detectDelimiterRobust(csv, 4)).toBe(";");
    });

    it("should default to comma if no clear winner", () => {
      const csv = "nameemailphone";
      expect(detectDelimiterRobust(csv)).toBe(",");
    });
  });

  // ============================================
  // Date Parsing Tests (AC3, AC4)
  // ============================================

  describe("parseDate", () => {
    it("should parse UK format (DD/MM/YYYY)", () => {
      const date = parseDate("31/12/2025");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11); // December (0-indexed)
      expect(date?.getDate()).toBe(31);
    });

    it("should parse ISO format (YYYY-MM-DD)", () => {
      const date = parseDate("2025-12-31");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
    });

    it("should parse US format (MM/DD/YYYY)", () => {
      const date = parseDate("12/31/2025");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
    });

    it("should parse hyphenated UK format (DD-MM-YYYY)", () => {
      const date = parseDate("31-12-2025");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
    });

    it("should parse dotted format (DD.MM.YYYY)", () => {
      const date = parseDate("31.12.2025");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
    });

    it("should auto-detect format from multiple options", () => {
      // Try UK format
      const ukDate = parseDate("15/03/2025");
      expect(ukDate?.getDate()).toBe(15);
      expect(ukDate?.getMonth()).toBe(2); // March

      // Try ISO format
      const isoDate = parseDate("2025-03-15");
      expect(isoDate?.getDate()).toBe(15);
      expect(isoDate?.getMonth()).toBe(2);
    });

    it("should return null for invalid date", () => {
      expect(parseDate("invalid-date")).toBeNull();
      expect(parseDate("32/13/2025")).toBeNull();
      expect(parseDate("abc")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseDate("")).toBeNull();
      expect(parseDate("   ")).toBeNull();
    });

    it("should handle dates with leading/trailing whitespace", () => {
      const date = parseDate("  31/12/2025  ");

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
    });

    it("should use custom formats if provided", () => {
      const date = parseDate("2025.12.31", ["yyyy.MM.dd"]);

      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
    });
  });

  describe("parseDateAuto", () => {
    it("should parse date with auto-detection", () => {
      expect(parseDateAuto("31/12/2025")).not.toBeNull();
      expect(parseDateAuto("2025-12-31")).not.toBeNull();
      expect(parseDateAuto("12/31/2025")).not.toBeNull();
    });

    it("should return null for invalid dates", () => {
      expect(parseDateAuto("invalid")).toBeNull();
    });
  });

  describe("toISODateString", () => {
    it("should convert Date to ISO string (YYYY-MM-DD)", () => {
      const date = new Date("2025-12-31");
      const iso = toISODateString(date);

      expect(iso).toBe("2025-12-31");
    });

    it("should return null for null input", () => {
      expect(toISODateString(null)).toBeNull();
    });

    it("should return null for invalid date", () => {
      const invalidDate = new Date("invalid");
      expect(toISODateString(invalidDate)).toBeNull();
    });
  });

  // ============================================
  // Value Transformation Tests (AC8)
  // ============================================

  describe("parseNumber", () => {
    it("should parse simple numbers", () => {
      expect(parseNumber("123")).toBe(123);
      expect(parseNumber("123.45")).toBe(123.45);
      expect(parseNumber("-456.78")).toBe(-456.78);
    });

    it("should parse numbers with thousand separators", () => {
      expect(parseNumber("1,234.56")).toBe(1234.56);
      expect(parseNumber("1,000,000")).toBe(1000000);
    });

    it("should parse numbers with currency symbols", () => {
      expect(parseNumber("£123.45")).toBe(123.45);
      expect(parseNumber("$1,234.56")).toBe(1234.56);
      expect(parseNumber("€500.00")).toBe(500);
      expect(parseNumber("¥1000")).toBe(1000);
    });

    it("should parse negative numbers in parentheses", () => {
      expect(parseNumber("(123.45)")).toBe(-123.45);
      expect(parseNumber("($1,234)")).toBe(-1234);
    });

    it("should handle numbers with spaces", () => {
      expect(parseNumber("1 234.56")).toBe(1234.56);
      expect(parseNumber("  123  ")).toBe(123);
    });

    it("should return null for invalid numbers", () => {
      expect(parseNumber("invalid")).toBeNull();
      expect(parseNumber("abc123")).toBeNull();
      expect(parseNumber("")).toBeNull();
      expect(parseNumber("   ")).toBeNull();
    });

    it("should handle decimal numbers", () => {
      expect(parseNumber("0.5")).toBe(0.5);
      expect(parseNumber(".75")).toBe(0.75);
    });
  });

  describe("parseBoolean", () => {
    it("should parse truthy values (case-insensitive)", () => {
      expect(parseBoolean("true")).toBe(true);
      expect(parseBoolean("TRUE")).toBe(true);
      expect(parseBoolean("True")).toBe(true);
      expect(parseBoolean("yes")).toBe(true);
      expect(parseBoolean("YES")).toBe(true);
      expect(parseBoolean("1")).toBe(true);
      expect(parseBoolean("on")).toBe(true);
      expect(parseBoolean("t")).toBe(true);
      expect(parseBoolean("y")).toBe(true);
    });

    it("should parse falsy values (case-insensitive)", () => {
      expect(parseBoolean("false")).toBe(false);
      expect(parseBoolean("FALSE")).toBe(false);
      expect(parseBoolean("False")).toBe(false);
      expect(parseBoolean("no")).toBe(false);
      expect(parseBoolean("NO")).toBe(false);
      expect(parseBoolean("0")).toBe(false);
      expect(parseBoolean("off")).toBe(false);
      expect(parseBoolean("f")).toBe(false);
      expect(parseBoolean("n")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(parseBoolean("  true  ")).toBe(true);
      expect(parseBoolean("  false  ")).toBe(false);
    });

    it("should use default value for invalid input", () => {
      expect(parseBoolean("invalid")).toBe(false);
      expect(parseBoolean("invalid", true)).toBe(true);
      expect(parseBoolean("")).toBe(false);
    });
  });

  describe("transformValue", () => {
    it("should transform to date", () => {
      const result = transformValue("2025-12-31", "date");
      expect(result).toBeInstanceOf(Date);
      expect((result as Date).getFullYear()).toBe(2025);
    });

    it("should transform to number", () => {
      expect(transformValue("123.45", "number")).toBe(123.45);
      expect(transformValue("£1,234", "number")).toBe(1234);
    });

    it("should transform to boolean", () => {
      expect(transformValue("yes", "boolean")).toBe(true);
      expect(transformValue("no", "boolean")).toBe(false);
    });

    it("should transform to string (trim)", () => {
      expect(transformValue("  test  ", "string")).toBe("test");
    });

    it("should return null for empty string", () => {
      expect(transformValue("", "string")).toBeNull();
    });
  });

  describe("transformRow", () => {
    it("should transform entire row based on field types", () => {
      const row = {
        name: "John Doe",
        age: "30",
        active: "yes",
        joined: "2025-01-15",
        salary: "£50,000",
      };

      const fieldTypes = {
        name: "string" as const,
        age: "number" as const,
        active: "boolean" as const,
        joined: "date" as const,
        salary: "number" as const,
      };

      const result = transformRow(row, fieldTypes);

      expect(result.name).toBe("John Doe");
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.joined).toBeInstanceOf(Date);
      expect(result.salary).toBe(50000);
    });

    it("should handle missing field types (default to string)", () => {
      const row = { name: "John", unknown: "value" };
      const fieldTypes = { name: "string" as const };

      const result = transformRow(row, fieldTypes);

      expect(result.name).toBe("John");
      expect(result.unknown).toBe("value");
    });

    it("should handle empty values", () => {
      const row = { name: "", age: "", active: "" };
      const fieldTypes = {
        name: "string" as const,
        age: "number" as const,
        active: "boolean" as const,
      };

      const result = transformRow(row, fieldTypes);

      expect(result.name).toBeNull();
      expect(result.age).toBeNull();
      expect(result.active).toBe(false); // Default for parseBoolean
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe("Integration: CSV with BOM + delimiter detection", () => {
    it("should handle BOM-prefixed CSV with auto-detection", () => {
      const csv = `${UTF8_BOM}name;email;phone\nJohn;john@test.com;123`;
      const cleaned = stripBOM(csv);
      const delimiter = detectDelimiter(cleaned);

      expect(delimiter).toBe(";");
      expect(cleaned.startsWith("name")).toBe(true);
    });
  });

  describe("Integration: Date parsing edge cases", () => {
    it("should distinguish between DD/MM/YYYY and MM/DD/YYYY when ambiguous", () => {
      // 01/02/2025 could be Jan 2 or Feb 1
      // With default formats (UK first), should parse as 1st February
      const date = parseDateAuto("01/02/2025");

      expect(date?.getDate()).toBe(1);
      expect(date?.getMonth()).toBe(1); // February (0-indexed)
    });

    it("should handle unambiguous dates correctly", () => {
      // 31/01/2025 can only be DD/MM/YYYY (no month 31)
      const date = parseDateAuto("31/01/2025");

      expect(date?.getDate()).toBe(31);
      expect(date?.getMonth()).toBe(0); // January
    });
  });

  describe("Constants", () => {
    it("should have correct DEFAULT_DATE_FORMATS", () => {
      expect(DEFAULT_DATE_FORMATS).toContain("dd/MM/yyyy");
      expect(DEFAULT_DATE_FORMATS).toContain("yyyy-MM-dd");
      expect(DEFAULT_DATE_FORMATS).toContain("MM/dd/yyyy");
      expect(DEFAULT_DATE_FORMATS).toContain("dd-MM-yyyy");
    });

    it("should have correct UTF8_BOM character", () => {
      expect(UTF8_BOM.charCodeAt(0)).toBe(0xfeff);
    });
  });
});
