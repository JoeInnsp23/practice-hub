/**
 * Template Placeholders Unit Tests
 *
 * Tests for placeholder replacement, validation, and due date calculation
 */

import { describe, expect, it } from "vitest";
import {
  calculateDueDate,
  type PlaceholderData,
  replacePlaceholders,
  SUPPORTED_PLACEHOLDERS,
  validatePlaceholders,
} from "@/lib/services/template-placeholders";

describe("lib/services/template-placeholders.ts", () => {
  describe("replacePlaceholders", () => {
    const sampleData: PlaceholderData = {
      clientName: "Acme Ltd",
      serviceName: "Corporation Tax Return",
      period: "Q1 2025",
      taxYear: "2024/25",
      companyNumber: "12345678",
      activationDate: new Date("2025-01-15"),
    };

    it("should replace {client_name} placeholder", () => {
      const result = replacePlaceholders(
        "Prepare accounts for {client_name}",
        sampleData,
      );
      expect(result).toBe("Prepare accounts for Acme Ltd");
    });

    it("should replace {service_name} placeholder", () => {
      const result = replacePlaceholders(
        "Complete {service_name} task",
        sampleData,
      );
      expect(result).toBe("Complete Corporation Tax Return task");
    });

    it("should replace {period} placeholder", () => {
      const result = replacePlaceholders("Review {period} data", sampleData);
      expect(result).toBe("Review Q1 2025 data");
    });

    it("should replace {tax_year} placeholder", () => {
      const result = replacePlaceholders(
        "Tax year {tax_year} filing",
        sampleData,
      );
      expect(result).toBe("Tax year 2024/25 filing");
    });

    it("should replace {company_number} placeholder", () => {
      const result = replacePlaceholders(
        "Company {company_number} filing",
        sampleData,
      );
      expect(result).toBe("Company 12345678 filing");
    });

    it("should replace {quarter} placeholder from activation date", () => {
      const result = replacePlaceholders("Q{quarter} VAT Return", sampleData);
      expect(result).toBe("Q1 VAT Return"); // January is Q1
    });

    it("should replace {month} placeholder from activation date", () => {
      const result = replacePlaceholders("{month} Report", sampleData);
      expect(result).toBe("January Report");
    });

    it("should replace {year} placeholder from activation date", () => {
      const result = replacePlaceholders("{year} Summary", sampleData);
      expect(result).toBe("2025 Summary");
    });

    it("should replace multiple placeholders in one string", () => {
      const result = replacePlaceholders(
        "{service_name} for {client_name} - {tax_year}",
        sampleData,
      );
      expect(result).toBe("Corporation Tax Return for Acme Ltd - 2024/25");
    });

    it("should replace the same placeholder multiple times", () => {
      const result = replacePlaceholders(
        "{client_name} and {client_name} again",
        sampleData,
      );
      expect(result).toBe("Acme Ltd and Acme Ltd again");
    });

    it("should handle missing placeholder data gracefully", () => {
      const incompleteData: PlaceholderData = {
        clientName: "Test Client",
      };
      const result = replacePlaceholders(
        "{client_name} - {service_name}",
        incompleteData,
      );
      expect(result).toBe("Test Client - {service_name}");
    });

    it("should handle empty string", () => {
      const result = replacePlaceholders("", sampleData);
      expect(result).toBe("");
    });

    it("should handle text with no placeholders", () => {
      const result = replacePlaceholders("No placeholders here", sampleData);
      expect(result).toBe("No placeholders here");
    });

    it("should calculate correct quarter from different months", () => {
      const testCases = [
        { month: 1, quarter: "Q1" }, // January
        { month: 3, quarter: "Q1" }, // March
        { month: 4, quarter: "Q2" }, // April
        { month: 6, quarter: "Q2" }, // June
        { month: 7, quarter: "Q3" }, // July
        { month: 9, quarter: "Q3" }, // September
        { month: 10, quarter: "Q4" }, // October
        { month: 12, quarter: "Q4" }, // December
      ];

      for (const { month, quarter } of testCases) {
        const date = new Date(2025, month - 1, 15); // Month is 0-indexed
        const result = replacePlaceholders("Q{quarter} Report", {
          activationDate: date,
        });
        expect(result).toBe(`${quarter} Report`);
      }
    });
  });

  describe("validatePlaceholders", () => {
    it("should validate valid placeholders", () => {
      const text = "{client_name} and {service_name}";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept all supported placeholders", () => {
      const placeholderKeys = Object.keys(SUPPORTED_PLACEHOLDERS);
      const text = placeholderKeys.map((key) => `{${key}}`).join(" ");
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid placeholder", () => {
      const text = "{invalid_placeholder}";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("invalid_placeholder");
    });

    it("should detect multiple invalid placeholders", () => {
      const text = "{invalid1} and {invalid2} and {client_name}";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it("should validate text with no placeholders as valid", () => {
      const text = "No placeholders in this text";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate empty string as valid", () => {
      const text = "";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect malformed placeholder (no closing brace)", () => {
      const text = "{client_name without closing";
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(true); // No match, so no error
    });

    it("should handle nested braces correctly", () => {
      const text = "{{client_name}}";
      const result = validatePlaceholders(text);
      // This matches both {} (invalid) and {client_name} (valid)
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate case-sensitive placeholders", () => {
      const text = "{CLIENT_NAME}"; // Wrong case
      const result = validatePlaceholders(text);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("CLIENT_NAME");
    });
  });

  describe("calculateDueDate", () => {
    const baseDate = new Date("2025-01-15T00:00:00.000Z");

    it("should add days to activation date", () => {
      const result = calculateDueDate(baseDate, 30, 0);
      expect(result.getDate()).toBe(14); // Feb 14
      expect(result.getMonth()).toBe(1); // February (0-indexed)
    });

    it("should add months to activation date", () => {
      const result = calculateDueDate(baseDate, 0, 3);
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(3); // April (0-indexed, January=0 + 3 = 3)
    });

    it("should add both days and months", () => {
      const result = calculateDueDate(baseDate, 15, 2);
      expect(result.getDate()).toBe(30); // March 15 + 15 days = March 30
      expect(result.getMonth()).toBe(2); // March (0-indexed)
    });

    it("should handle zero offsets", () => {
      const result = calculateDueDate(baseDate, 0, 0);
      expect(result.getTime()).toBe(baseDate.getTime());
    });

    it("should handle month overflow correctly", () => {
      const result = calculateDueDate(baseDate, 0, 12);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it("should handle day overflow across months", () => {
      const janEnd = new Date("2025-01-31T00:00:00.000Z");
      const result = calculateDueDate(janEnd, 5, 0);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(5);
    });

    it("should handle February edge cases", () => {
      const jan31 = new Date("2025-01-31T00:00:00.000Z");
      const result = calculateDueDate(jan31, 0, 1);
      // Jan 31 + 1 month = Feb 28/29 (JavaScript auto-adjusts)
      expect(result.getMonth()).toBe(2); // March (JavaScript overflow)
      expect(result.getDate()).toBe(3); // March 3 (31 days from Jan 31)
    });

    it("should handle large day offsets", () => {
      const result = calculateDueDate(baseDate, 365, 0);
      expect(result.getFullYear()).toBe(2026);
    });

    it("should handle large month offsets", () => {
      const result = calculateDueDate(baseDate, 0, 24);
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(0); // January
    });

    it("should preserve time components", () => {
      const dateWithTime = new Date("2025-01-15T14:30:00.000Z");
      const result = calculateDueDate(dateWithTime, 10, 0);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("should handle leap year correctly", () => {
      const feb28_2024 = new Date("2024-02-28T00:00:00.000Z"); // 2024 is leap year
      const result = calculateDueDate(feb28_2024, 1, 0);
      expect(result.getDate()).toBe(29); // Feb 29 exists in 2024
      expect(result.getMonth()).toBe(1); // February
    });
  });

  describe("SUPPORTED_PLACEHOLDERS constant", () => {
    it("should contain all expected placeholders", () => {
      const expectedKeys = [
        "client_name",
        "service_name",
        "period",
        "tax_year",
        "company_number",
        "quarter",
        "month",
        "year",
      ];

      for (const key of expectedKeys) {
        expect(SUPPORTED_PLACEHOLDERS).toHaveProperty(key);
      }
    });

    it("should have descriptions for all placeholders", () => {
      const placeholders = Object.values(SUPPORTED_PLACEHOLDERS);
      for (const description of placeholders) {
        expect(typeof description).toBe("string");
        expect(description.length).toBeGreaterThan(0);
      }
    });

    it("should have exactly 8 supported placeholders", () => {
      expect(Object.keys(SUPPORTED_PLACEHOLDERS)).toHaveLength(8);
    });
  });
});
