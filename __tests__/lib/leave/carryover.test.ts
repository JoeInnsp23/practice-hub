import { describe, it, expect } from "vitest";
import { calculateCarryover } from "@/lib/leave/carryover";

describe("Leave Carryover Logic", () => {
  describe("calculateCarryover", () => {
    it("should return 5 days when user has 10 unused days (max carryover)", () => {
      const annualEntitlement = 25;
      const annualUsed = 15; // 10 days unused
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(5); // Capped at max 5 days
    });

    it("should return 3 days when user has 3 unused days", () => {
      const annualEntitlement = 25;
      const annualUsed = 22; // 3 days unused
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(3);
    });

    it("should return 0 days when user has no unused leave", () => {
      const annualEntitlement = 25;
      const annualUsed = 25; // All used
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(0);
    });

    it("should return 0 days when user has used more than entitlement", () => {
      const annualEntitlement = 25;
      const annualUsed = 30; // Over-used (negative balance)
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(0);
    });

    it("should not count already carried over days in calculation", () => {
      // User had 5 days carried over from previous year (total entitlement = 30)
      // They used 20 days, leaving 10 days unused from CURRENT year entitlement
      // Only current year's unused days should count for new carryover
      const annualEntitlement = 30; // 25 base + 5 carried over
      const annualUsed = 20; // 10 days unused total
      const carriedOver = 5; // Already carried over from previous year

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      // Current year entitlement: 30 - 5 (carried) = 25
      // Used: 20
      // Unused from current year: 5
      // Carryover: 5 (not capped)
      expect(result).toBe(5);
    });

    it("should cap at 5 days even with large unused balance from carried over days", () => {
      // User had 5 days carried over, used only 10 days total
      // Unused: 20 days, but max carryover is 5
      const annualEntitlement = 30; // 25 base + 5 carried over
      const annualUsed = 10; // 20 days unused total
      const carriedOver = 5;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      // Current year entitlement: 30 - 5 (carried) = 25
      // Used: 10
      // Unused from current year: 15
      // Carryover: 5 (capped at max)
      expect(result).toBe(5);
    });

    it("should handle edge case of exactly 5 unused days", () => {
      const annualEntitlement = 25;
      const annualUsed = 20; // Exactly 5 unused
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(5);
    });

    it("should handle full year unused (25 days available for carryover)", () => {
      const annualEntitlement = 25;
      const annualUsed = 0; // Didn't use any leave
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(5); // Still capped at 5
    });

    it("should handle partial year entitlement correctly", () => {
      // New starter with pro-rated entitlement
      const annualEntitlement = 12.5; // Mid-year start
      const annualUsed = 5; // 7.5 days unused
      const carriedOver = 0;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      expect(result).toBe(5); // Capped at max even though only 7.5 unused
    });

    it("should return 0 when user has used exactly their current year entitlement (with carryover)", () => {
      const annualEntitlement = 30; // 25 base + 5 carried over
      const annualUsed = 25; // Used current year's allocation exactly
      const carriedOver = 5;

      const result = calculateCarryover(annualEntitlement, annualUsed, carriedOver);

      // Current year entitlement: 30 - 5 (carried) = 25
      // Used: 25
      // Unused from current year: 0
      expect(result).toBe(0);
    });
  });
});
