import { addDays, addMonths } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  calculateDueDate,
  calculatePeriodInfo,
  calculateTargetDate,
  calculateTaxYear,
  type PlaceholderData,
  replacePlaceholders,
} from "./task-generation";

describe("replacePlaceholders", () => {
  const mockData: PlaceholderData = {
    clientName: "Acme Corp",
    serviceName: "VAT Return",
    companyNumber: "12345678",
    period: "Q1 2025",
    month: "January",
    year: "2025",
    taxYear: "2024/25",
    activationDate: new Date("2025-01-15"),
  };

  it("should replace client name placeholder", () => {
    const template = "Prepare VAT Return for {client_name}";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe("Prepare VAT Return for Acme Corp");
  });

  it("should replace multiple different placeholders", () => {
    const template =
      "{client_name} - {service_name} for {period} (Company: {company_number})";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe(
      "Acme Corp - VAT Return for Q1 2025 (Company: 12345678)",
    );
  });

  it("should replace same placeholder multiple times", () => {
    const template = "{client_name} and {client_name} again";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe("Acme Corp and Acme Corp again");
  });

  it("should handle missing optional placeholders", () => {
    const dataWithoutOptional: PlaceholderData = {
      clientName: "Test Co",
      serviceName: "Accounts",
      activationDate: new Date("2025-01-15"),
    };

    const template = "{client_name} - {company_number}";
    const result = replacePlaceholders(template, dataWithoutOptional);
    expect(result).toBe("Test Co - ");
  });

  it("should preserve text without placeholders", () => {
    const template = "This has no placeholders";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe("This has no placeholders");
  });

  it("should handle empty template", () => {
    const template = "";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe("");
  });

  it("should replace all placeholder types", () => {
    const template =
      "{client_name} {service_name} {company_number} {period} {month} {year} {tax_year}";
    const result = replacePlaceholders(template, mockData);
    expect(result).toBe(
      "Acme Corp VAT Return 12345678 Q1 2025 January 2025 2024/25",
    );
  });
});

describe("calculateDueDate", () => {
  const baseDate = new Date("2025-01-15T00:00:00.000Z");

  it("should add months correctly", () => {
    const result = calculateDueDate(baseDate, undefined, 3);
    expect(result).toEqual(new Date("2025-04-15T00:00:00.000Z"));
  });

  it("should add days correctly", () => {
    const result = calculateDueDate(baseDate, 30, undefined);
    expect(result).toEqual(new Date("2025-02-14T00:00:00.000Z"));
  });

  it("should add both months and days", () => {
    const result = calculateDueDate(baseDate, 5, 2);
    // 2 months = March 15, then +5 days = March 20
    expect(result).toEqual(new Date("2025-03-20T00:00:00.000Z"));
  });

  it("should handle negative offsets", () => {
    const result = calculateDueDate(baseDate, -5, -1);
    // -1 month = Dec 15, then -5 days = Dec 10
    expect(result).toEqual(new Date("2024-12-10T00:00:00.000Z"));
  });

  it("should handle zero offsets", () => {
    const result = calculateDueDate(baseDate, 0, 0);
    expect(result).toEqual(baseDate);
  });

  it("should handle undefined offsets", () => {
    const result = calculateDueDate(baseDate);
    expect(result).toEqual(baseDate);
  });

  it("should handle end of month correctly", () => {
    const endOfMonth = new Date("2025-01-31T00:00:00.000Z");
    const result = calculateDueDate(endOfMonth, undefined, 1);
    // Jan 31 + 1 month should be Feb 28 (or 29 in leap year)
    // date-fns handles this gracefully
    expect(result.getMonth()).toBe(1); // February
  });

  it("should handle leap year", () => {
    const leapYearDate = new Date("2024-02-29T00:00:00.000Z");
    const result = calculateDueDate(leapYearDate, undefined, 12);
    // Feb 29, 2024 + 12 months = Feb 28, 2025 (not leap year)
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // February
  });
});

describe("calculateTargetDate", () => {
  it("should return 7 days before due date", () => {
    const dueDate = new Date("2025-02-15T00:00:00.000Z");
    const result = calculateTargetDate(dueDate);
    expect(result).toEqual(new Date("2025-02-08T00:00:00.000Z"));
  });

  it("should handle month boundary", () => {
    const dueDate = new Date("2025-03-05T00:00:00.000Z");
    const result = calculateTargetDate(dueDate);
    // March 5 - 7 days = Feb 26
    expect(result).toEqual(new Date("2025-02-26T00:00:00.000Z"));
  });

  it("should handle year boundary", () => {
    const dueDate = new Date("2025-01-05T00:00:00.000Z");
    const result = calculateTargetDate(dueDate);
    // Jan 5 - 7 days = Dec 29, 2024
    expect(result).toEqual(new Date("2024-12-29T00:00:00.000Z"));
  });
});

describe("calculatePeriodInfo", () => {
  const baseDate = new Date("2025-01-15T00:00:00.000Z");

  describe("monthly frequency", () => {
    it("should calculate current month", () => {
      const result = calculatePeriodInfo(baseDate, 0, "monthly");
      expect(result.period).toBe("January 2025");
      expect(result.date).toEqual(baseDate);
    });

    it("should calculate next month", () => {
      const result = calculatePeriodInfo(baseDate, 1, "monthly");
      expect(result.period).toBe("February 2025");
      expect(result.date).toEqual(new Date("2025-02-15T00:00:00.000Z"));
    });

    it("should calculate month in next year", () => {
      const result = calculatePeriodInfo(baseDate, 12, "monthly");
      expect(result.period).toBe("January 2026");
    });
  });

  describe("quarterly frequency", () => {
    it("should calculate Q1", () => {
      const result = calculatePeriodInfo(baseDate, 0, "quarterly");
      expect(result.period).toBe("Q1 2025");
    });

    it("should calculate Q2", () => {
      const result = calculatePeriodInfo(baseDate, 1, "quarterly");
      expect(result.period).toBe("Q2 2025");
    });

    it("should calculate Q4", () => {
      const result = calculatePeriodInfo(baseDate, 3, "quarterly");
      expect(result.period).toBe("Q4 2025");
    });

    it("should calculate Q1 next year", () => {
      const result = calculatePeriodInfo(baseDate, 4, "quarterly");
      expect(result.period).toBe("Q1 2026");
    });
  });

  describe("annually frequency", () => {
    it("should calculate current year", () => {
      const result = calculatePeriodInfo(baseDate, 0, "annually");
      expect(result.period).toBe("2025/26");
      expect(result.date.getFullYear()).toBe(2025);
    });

    it("should calculate next year", () => {
      const result = calculatePeriodInfo(baseDate, 1, "annually");
      expect(result.period).toBe("2026/27");
      expect(result.date.getFullYear()).toBe(2026);
    });

    it("should calculate multiple years ahead", () => {
      const result = calculatePeriodInfo(baseDate, 3, "annually");
      expect(result.period).toBe("2028/29");
    });
  });
});

describe("calculateTaxYear", () => {
  it("should return correct tax year before April 6", () => {
    const date = new Date("2025-04-05T00:00:00.000Z");
    const result = calculateTaxYear(date);
    expect(result).toBe("2024/25");
  });

  it("should return correct tax year on April 6", () => {
    const date = new Date("2025-04-06T00:00:00.000Z");
    const result = calculateTaxYear(date);
    expect(result).toBe("2025/26");
  });

  it("should return correct tax year after April 6", () => {
    const date = new Date("2025-04-07T00:00:00.000Z");
    const result = calculateTaxYear(date);
    expect(result).toBe("2025/26");
  });

  it("should return correct tax year in December", () => {
    const date = new Date("2025-12-31T00:00:00.000Z");
    const result = calculateTaxYear(date);
    expect(result).toBe("2025/26");
  });

  it("should return correct tax year in January", () => {
    const date = new Date("2025-01-01T00:00:00.000Z");
    const result = calculateTaxYear(date);
    expect(result).toBe("2024/25");
  });
});
