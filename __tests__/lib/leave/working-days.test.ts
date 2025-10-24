import { describe, it, expect } from "vitest";
import {
  calculateWorkingDays,
  hasWorkingDays,
  isUKBankHoliday,
} from "@/lib/leave/working-days";

describe("Working Days Calculation", () => {
  describe("calculateWorkingDays", () => {
    it("should calculate working days for a standard week (Monday-Friday)", () => {
      const startDate = new Date("2025-06-02"); // Monday
      const endDate = new Date("2025-06-06"); // Friday

      const result = calculateWorkingDays(startDate, endDate);

      expect(result).toBe(5); // 5 working days
    });

    it("should exclude weekends from calculation", () => {
      const startDate = new Date("2025-06-02"); // Monday
      const endDate = new Date("2025-06-08"); // Sunday (next week)

      const result = calculateWorkingDays(startDate, endDate);

      expect(result).toBe(5); // Mon-Fri only (excludes Sat-Sun)
    });

    it("should return 0 for weekend-only date range", () => {
      const startDate = new Date("2025-06-07"); // Saturday
      const endDate = new Date("2025-06-08"); // Sunday

      const result = calculateWorkingDays(startDate, endDate);

      expect(result).toBe(0); // No working days
    });

    it("should count single day request as 1 working day (when not weekend)", () => {
      const startDate = new Date("2025-06-04"); // Wednesday
      const endDate = new Date("2025-06-04"); // Same day

      const result = calculateWorkingDays(startDate, endDate);

      expect(result).toBe(1);
    });

    it("should count single Saturday as 0 working days", () => {
      const startDate = new Date("2025-06-07"); // Saturday
      const endDate = new Date("2025-06-07"); // Same day

      const result = calculateWorkingDays(startDate, endDate);

      expect(result).toBe(0);
    });

    it("should exclude UK bank holidays from calculation", () => {
      // May Day bank holiday 2025 (Monday, May 5)
      const startDate = new Date("2025-05-02"); // Friday
      const endDate = new Date("2025-05-09"); // Following Friday

      const result = calculateWorkingDays(startDate, endDate);

      // Fri(2), Mon(5-holiday), Tue(6), Wed(7), Thu(8), Fri(9)
      // = 5 working days (excludes weekend + bank holiday)
      expect(result).toBe(5);
    });

    it("should handle New Year's Day bank holiday", () => {
      const startDate = new Date("2025-01-01"); // New Year (Wednesday, bank holiday)
      const endDate = new Date("2025-01-03"); // Friday

      const result = calculateWorkingDays(startDate, endDate);

      // Wed(1-holiday), Thu(2), Fri(3) = 2 working days
      expect(result).toBe(2);
    });

    it("should handle Easter Monday bank holiday (April 21, 2025)", () => {
      const startDate = new Date("2025-04-18"); // Good Friday (bank holiday)
      const endDate = new Date("2025-04-25"); // Following Friday

      const result = calculateWorkingDays(startDate, endDate);

      // Fri(18-holiday), Mon(21-holiday), Tue(22), Wed(23), Thu(24), Fri(25)
      // Excludes: Sat(19), Sun(20), Good Friday, Easter Monday
      // = 4 working days
      expect(result).toBe(4);
    });

    it("should handle Christmas period with bank holidays", () => {
      const startDate = new Date("2025-12-24"); // Wednesday (not holiday)
      const endDate = new Date("2025-12-29"); // Monday

      const result = calculateWorkingDays(startDate, endDate);

      // Wed(24), Thu(25-holiday), Fri(26-holiday), Mon(29)
      // Excludes: Sat(27), Sun(28), Christmas, Boxing Day
      // = 2 working days (24th and 29th)
      expect(result).toBe(2);
    });

    it("should handle multi-week requests", () => {
      const startDate = new Date("2025-07-07"); // Monday
      const endDate = new Date("2025-07-18"); // Friday (2 weeks)

      const result = calculateWorkingDays(startDate, endDate);

      // 2 full weeks = 10 working days
      expect(result).toBe(10);
    });

    it("should handle requests spanning bank holiday weekend", () => {
      // Spring bank holiday (May 26, 2025 - Monday)
      const startDate = new Date("2025-05-23"); // Friday
      const endDate = new Date("2025-05-27"); // Tuesday

      const result = calculateWorkingDays(startDate, endDate);

      // Fri(23), Mon(26-holiday), Tue(27)
      // Excludes: Sat(24), Sun(25), bank holiday
      // = 2 working days
      expect(result).toBe(2);
    });

    it("should handle bank holiday that falls on weekend (substituted)", () => {
      // Boxing Day 2026 falls on Saturday, substitute Monday 28th
      const startDate = new Date("2026-12-25"); // Friday (Christmas)
      const endDate = new Date("2026-12-29"); // Tuesday

      const result = calculateWorkingDays(startDate, endDate);

      // Fri(25-holiday), Mon(28-substitute holiday), Tue(29)
      // Excludes: Sat(26), Sun(27), both holidays
      // = 1 working day (29th only)
      expect(result).toBe(1);
    });
  });

  describe("hasWorkingDays", () => {
    it("should return true for date range with working days", () => {
      const startDate = new Date("2025-06-02"); // Monday
      const endDate = new Date("2025-06-06"); // Friday

      const result = hasWorkingDays(startDate, endDate);

      expect(result).toBe(true);
    });

    it("should return false for weekend-only date range", () => {
      const startDate = new Date("2025-06-07"); // Saturday
      const endDate = new Date("2025-06-08"); // Sunday

      const result = hasWorkingDays(startDate, endDate);

      expect(result).toBe(false);
    });

    it("should return false for bank holiday only", () => {
      const startDate = new Date("2025-05-05"); // May Day bank holiday (Monday)
      const endDate = new Date("2025-05-05"); // Same day

      const result = hasWorkingDays(startDate, endDate);

      expect(result).toBe(false);
    });

    it("should return true for single working day", () => {
      const startDate = new Date("2025-06-04"); // Wednesday
      const endDate = new Date("2025-06-04"); // Same day

      const result = hasWorkingDays(startDate, endDate);

      expect(result).toBe(true);
    });
  });

  describe("isUKBankHoliday", () => {
    it("should identify New Year's Day 2025 as a bank holiday", () => {
      const date = new Date("2025-01-01");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Good Friday 2025 as a bank holiday", () => {
      const date = new Date("2025-04-18");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Easter Monday 2025 as a bank holiday", () => {
      const date = new Date("2025-04-21");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify May Day 2025 as a bank holiday", () => {
      const date = new Date("2025-05-05");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Spring bank holiday 2025 as a bank holiday", () => {
      const date = new Date("2025-05-26");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Summer bank holiday 2025 as a bank holiday", () => {
      const date = new Date("2025-08-25");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Christmas Day 2025 as a bank holiday", () => {
      const date = new Date("2025-12-25");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should identify Boxing Day 2025 as a bank holiday", () => {
      const date = new Date("2025-12-26");
      expect(isUKBankHoliday(date)).toBe(true);
    });

    it("should return false for non-bank holiday weekday", () => {
      const date = new Date("2025-06-04"); // Random Wednesday
      expect(isUKBankHoliday(date)).toBe(false);
    });

    it("should return false for weekend (not a bank holiday)", () => {
      const date = new Date("2025-06-07"); // Saturday
      expect(isUKBankHoliday(date)).toBe(false);
    });

    it("should handle 2026 bank holidays correctly", () => {
      const newYear2026 = new Date("2026-01-01");
      const christmas2026 = new Date("2026-12-25");

      expect(isUKBankHoliday(newYear2026)).toBe(true);
      expect(isUKBankHoliday(christmas2026)).toBe(true);
    });
  });
});
