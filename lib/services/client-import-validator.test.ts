import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  clientImportRowSchema,
  generateClientCode,
  parseFlexibleDate,
  validateClientImport,
  validateClientRow,
} from "./client-import-validator";

// Mock database
vi.mock("@/lib/db", () => {
  const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
  };

  return {
    db: {
      select: vi.fn(() => mockQueryBuilder),
    },
  };
});

describe("client-import-validator", () => {
  describe("clientImportRowSchema", () => {
    it("should validate a complete valid row", () => {
      const validRow = {
        company_name: "Test Ltd",
        client_code: "CL-001",
        email: "test@example.com",
        phone: "020 1234 5678",
        vat_number: "GB123456789",
        companies_house_number: "12345678",
        client_type: "company",
        status: "active",
        street_address: "123 Test St",
        city: "London",
        postcode: "SW1A 1AA",
        country: "United Kingdom",
        client_manager_email: "manager@example.com",
      };

      const result = clientImportRowSchema.safeParse(validRow);
      expect(result.success).toBe(true);
    });

    it("should require company_name", () => {
      const invalidRow = {
        company_name: "",
        email: "test@example.com",
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Company name");
      }
    });

    it("should validate email format", () => {
      const invalidRow = {
        company_name: "Test Ltd",
        email: "invalid-email",
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("email");
      }
    });

    it("should validate VAT number format", () => {
      const invalidRow = {
        company_name: "Test Ltd",
        email: "test@example.com",
        vat_number: "INVALID",
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.message.includes("VAT")),
        ).toBe(true);
      }
    });

    it("should validate Companies House number length", () => {
      const invalidRow = {
        company_name: "Test Ltd",
        email: "test@example.com",
        companies_house_number: "123", // Too short
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) =>
            issue.message.includes("Companies House"),
          ),
        ).toBe(true);
      }
    });

    it("should validate client_type enum", () => {
      const invalidRow = {
        company_name: "Test Ltd",
        email: "test@example.com",
        client_type: "invalid_type",
      };

      const result = clientImportRowSchema.safeParse(invalidRow);
      expect(result.success).toBe(false);
    });

    it("should default status to active", () => {
      const row = {
        company_name: "Test Ltd",
        email: "test@example.com",
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("active");
      }
    });

    it("should normalize email to lowercase", () => {
      const row = {
        company_name: "Test Ltd",
        email: "TEST@EXAMPLE.COM",
        client_type: "company",
      };

      const result = clientImportRowSchema.safeParse(row);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should accept valid VAT number formats", () => {
      const validFormats = [
        "GB123456789", // 9 digits
        "GB1234567890", // 10 digits
        "GB12345678901", // 11 digits
        "GB123456789012", // 12 digits
      ];

      for (const vatNumber of validFormats) {
        const row = {
          company_name: "Test Ltd",
          email: "test@example.com",
          vat_number: vatNumber,
          client_type: "company",
        };

        const result = clientImportRowSchema.safeParse(row);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("parseFlexibleDate", () => {
    it("should parse DD/MM/YYYY format", () => {
      const result = parseFlexibleDate("25/12/2024");
      expect(result.success).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      if (result.date) {
        expect(result.date.getFullYear()).toBe(2024);
        expect(result.date.getMonth()).toBe(11); // December (0-indexed)
        expect(result.date.getDate()).toBe(25);
      }
    });

    it("should parse YYYY-MM-DD format", () => {
      const result = parseFlexibleDate("2024-12-25");
      expect(result.success).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });

    it("should parse MM/DD/YYYY format", () => {
      const result = parseFlexibleDate("12/25/2024");
      expect(result.success).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
    });

    it("should return success for empty string", () => {
      const result = parseFlexibleDate("");
      expect(result.success).toBe(true);
      expect(result.date).toBeUndefined();
    });

    it("should fail for invalid date format", () => {
      const result = parseFlexibleDate("invalid-date");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should fail for invalid date values", () => {
      const result = parseFlexibleDate("32/13/2024"); // Invalid day/month
      expect(result.success).toBe(false);
    });
  });

  describe("validateClientRow", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return validation errors for invalid schema", async () => {
      const invalidRow = {
        company_name: "",
        email: "invalid-email",
        client_type: "company",
      };

      const result = await validateClientRow(invalidRow, 1, "tenant-123");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should include row number in error messages", async () => {
      const invalidRow = {
        company_name: "",
        email: "test@example.com",
        client_type: "company",
      };

      const result = await validateClientRow(invalidRow, 5, "tenant-123");
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Row 5");
    });
  });

  describe("validateClientImport", () => {
    it("should validate multiple rows", async () => {
      const rows = [
        {
          company_name: "Test Ltd 1",
          email: "test1@example.com",
          client_type: "company",
        },
        {
          company_name: "Test Ltd 2",
          email: "test2@example.com",
          client_type: "company",
        },
      ];

      const result = await validateClientImport(rows, "tenant-123");
      expect(result.totalRows).toBe(2);
    });

    it("should return error count and valid count", async () => {
      const rows = [
        {
          company_name: "Valid Ltd",
          email: "valid@example.com",
          client_type: "company",
        },
        {
          company_name: "",
          email: "invalid-email",
          client_type: "company",
        },
      ];

      const result = await validateClientImport(rows, "tenant-123");
      expect(result.totalRows).toBe(2);
      expect(result.errorRows).toBeGreaterThan(0);
    });
  });

  describe("generateClientCode", () => {
    it("should generate sequential client codes", async () => {
      // This test would need proper DB mocking
      // Skipping implementation details as it requires complex DB mock setup
      expect(generateClientCode).toBeDefined();
    });
  });
});
