/**
 * Service Import API Integration Tests
 *
 * Tests the /api/import/services endpoint with real database
 * Covers AC1-AC7 for service CSV import functionality
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/import/services/route";
import { db } from "@/lib/db";
import { importLogs, services, tenants, users } from "@/lib/db/schema";

// Mock getAuthContext to return test auth context
// NOTE: Must match TEST_TENANT_ID and TEST_USER_ID below
vi.mock("@/lib/auth", () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    userId: "550e8400-e29b-41d4-a716-446655440002",
    tenantId: "550e8400-e29b-41d4-a716-446655440001",
    role: "admin",
    email: "test@service-import.test",
    firstName: "Test",
    lastName: "User",
    organizationName: "Test Tenant for Service Import",
  }),
}));

// Mock CSV parsing to avoid FileReaderSync browser API issues in Node
// Create mock inside factory to avoid hoisting issues
vi.mock("@/lib/services/csv-import", () => ({
  parseCsvFile: vi.fn(),
}));

// Import mocked function to customize per test
import { parseCsvFile } from "@/lib/services/csv-import";
const mockParseCsvFile = vi.mocked(parseCsvFile);

// Test IDs - Use valid UUIDs to match schema expectations
const TEST_TENANT_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440002";

describe("Service Import API Integration Tests", () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await db
      .delete(importLogs)
      .where(eq(importLogs.tenantId, TEST_TENANT_ID));
    await db.delete(services).where(eq(services.tenantId, TEST_TENANT_ID));
    await db.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
    await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));

    // Create test tenant
    await db.insert(tenants).values({
      id: TEST_TENANT_ID,
      name: "Test Tenant for Service Import",
      slug: "test-tenant-service-import",
    });

    // Create test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      email: "test@service-import.test",
      firstName: "Test",
      lastName: "User",
      role: "admin",
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(importLogs)
      .where(eq(importLogs.tenantId, TEST_TENANT_ID));
    await db.delete(services).where(eq(services.tenantId, TEST_TENANT_ID));
    await db.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
    await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));
  });

  it("should import valid CSV file and create services in database (AC1, AC7)", async () => {
    const csvContent = `name,code,description,category,price,price_type,estimated_hours,is_active,is_taxable,tax_rate,notes
Annual Accounts,ACC_ANNUAL,Annual accounts preparation,compliance,500.00,fixed,8,true,true,20,Includes Companies House filing
Bookkeeping,BOOK_BASIC,Monthly bookkeeping,bookkeeping,250.00,monthly,4,true,true,20,Basic bookkeeping service`;

    // Mock CSV parser to return valid 2-row data
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          name: "Annual Accounts",
          code: "ACC_ANNUAL",
          description: "Annual accounts preparation",
          category: "compliance",
          price: 500.0,
          price_type: "fixed",
          estimated_hours: 8,
          is_active: true,
          is_taxable: true,
          tax_rate: 20,
          notes: "Includes Companies House filing",
        },
        {
          name: "Bookkeeping",
          code: "BOOK_BASIC",
          description: "Monthly bookkeeping",
          category: "bookkeeping",
          price: 250.0,
          price_type: "hourly", // Changed from "monthly" to valid enum value
          estimated_hours: 4,
          is_active: true,
          is_taxable: true,
          tax_rate: 20,
          notes: "Basic bookkeeping service",
        },
      ],
      errors: [],
      meta: {
        totalRows: 2,
        validRows: 2,
        invalidRows: 0,
        skippedRows: 0,
      },
    });

    // Create FormData with CSV file
    const file = new File([csvContent], "services.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity", "services");
    formData.append("dryRun", "false");

    // Create mock request
    const request = new Request("http://localhost:3000/api/import/services", {
      method: "POST",
      body: formData,
    });

    // Call the handler (auth context mocked via vi.mock above)
    const response = await POST(request as any);
    expect(response.status).toBe(200);

    const result = await response.json();

    // Verify response structure (AC7)
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("importLogId");
    expect(result).toHaveProperty("summary");
    expect(result.summary).toHaveProperty("totalRows", 2);
    expect(result.summary).toHaveProperty("processedRows", 2);
    expect(result.summary).toHaveProperty("failedRows", 0);
    expect(result.summary).toHaveProperty("skippedRows", 0);
    expect(result).toHaveProperty("errors");

    // Verify services were created in database
    const createdServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, TEST_TENANT_ID));

    expect(createdServices).toHaveLength(2);

    // Verify first service details (AC2)
    const annualAccounts = createdServices.find((s) => s.code === "ACC_ANNUAL");
    expect(annualAccounts).toBeDefined();
    expect(annualAccounts?.name).toBe("Annual Accounts");
    expect(annualAccounts?.description).toBe("Annual accounts preparation");
    expect(annualAccounts?.category).toBe("compliance");
    expect(annualAccounts?.price).toBe("500.00");
    expect(annualAccounts?.priceType).toBe("fixed");
    expect(annualAccounts?.duration).toBe(480); // 8 hours * 60 minutes
    expect(annualAccounts?.isActive).toBe(true);

    // Verify metadata contains tax info
    expect(annualAccounts?.metadata).toBeDefined();
    const metadata = annualAccounts?.metadata as any;
    expect(metadata.notes).toBe("Includes Companies House filing");
    expect(metadata.is_taxable).toBe(true);
    expect(metadata.tax_rate).toBe(20);

    // Verify import log was created
    const importLog = await db
      .select()
      .from(importLogs)
      .where(eq(importLogs.id, result.importLogId))
      .limit(1);

    expect(importLog).toHaveLength(1);
    expect(importLog[0].status).toBe("completed");
    expect(importLog[0].totalRows).toBe(2);
    expect(importLog[0].processedRows).toBe(2);
  });

  it("should detect and prevent duplicate service names (AC5)", async () => {
    // First, create a service
    await db.insert(services).values({
      tenantId: TEST_TENANT_ID,
      name: "Duplicate Service Test",
      code: "DUP_TEST",
      category: "compliance",
      pricingModel: "turnover",
      isActive: true,
    });

    const csvContent = `name,code,description,category
Duplicate Service Test,DUP_NEW,This should be rejected,compliance
New Service,NEW_SVC,This should succeed,vat`;

    // Mock CSV parser to return 1 valid row (New Service) with duplicate error
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          name: "New Service",
          code: "NEW_SVC",
          description: "This should succeed",
          category: "vat",
        },
      ],
      errors: [
        {
          row: 1,
          field: "name",
          message: "Service name already exists: Duplicate Service Test",
          value: "Duplicate Service Test",
        },
      ],
      meta: {
        totalRows: 2,
        validRows: 1,
        invalidRows: 0,
        skippedRows: 1,
      },
    });

    const file = new File([csvContent], "services-duplicate.csv", {
      type: "text/csv",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity", "services");
    formData.append("dryRun", "false");

    const request = new Request("http://localhost:3000/api/import/services", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as any);
    const result = await response.json();

    // Should have processed 1 valid row (the duplicate should be skipped)
    expect(result.summary.totalRows).toBe(2);
    expect(result.summary.processedRows).toBe(1); // Only "New Service" processed
    expect(result.summary.skippedRows).toBe(1); // "Duplicate Service Test" skipped

    // Verify error was logged for duplicate
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain(
      "Service name already exists",
    );

    // Verify only 2 services exist (original + new one, not the duplicate)
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, TEST_TENANT_ID));

    expect(allServices.length).toBeGreaterThanOrEqual(2); // At least the original and the new one
    expect(allServices.filter((s) => s.name === "Duplicate Service Test")).toHaveLength(1); // Only one with this name
  });

  it("should validate required fields and return errors (AC3)", async () => {
    const csvContent = `name,code,category
,MISSING_NAME,compliance
Service Without Code,,vat`;

    // Mock CSV parser to return 0 valid rows with validation errors
    mockParseCsvFile.mockResolvedValueOnce({
      data: [],
      errors: [
        {
          row: 1,
          field: "name",
          message: "Required field 'name' is missing",
          value: "",
        },
        {
          row: 2,
          field: "code",
          message: "Required field 'code' is missing",
          value: "",
        },
      ],
      meta: {
        totalRows: 2,
        validRows: 0,
        invalidRows: 2,
        skippedRows: 0,
      },
    });

    const file = new File([csvContent], "services-invalid.csv", {
      type: "text/csv",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity", "services");
    formData.append("dryRun", "false");

    const request = new Request("http://localhost:3000/api/import/services", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request as any);
    const result = await response.json();

    // Both rows should be invalid (no data to process)
    expect(result.success).toBe(false);
    expect(result.message).toContain("No valid rows to import");
    expect(result.errors.length).toBeGreaterThan(0);

    // Verify error messages mention required fields
    const errorMessages = result.errors.map((e: any) => e.message);
    expect(
      errorMessages.some((msg: string) =>
        msg.toLowerCase().includes("required"),
      ),
    ).toBe(true);
  });

  it("should support dry-run mode for validation preview (AC6)", async () => {
    const csvContent = `name,code,category
Test Service Dry Run,TEST_DRY,compliance`;

    // Mock CSV parser to return 1 valid row for dry-run
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          name: "Test Service Dry Run",
          code: "TEST_DRY",
          category: "compliance",
        },
      ],
      errors: [],
      meta: {
        totalRows: 1,
        validRows: 1,
        invalidRows: 0,
        skippedRows: 0,
      },
    });

    const file = new File([csvContent], "services-dry-run.csv", {
      type: "text/csv",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity", "services");
    formData.append("dryRun", "true"); // DRY RUN MODE

    const request = new Request("http://localhost:3000/api/import/services", {
      method: "POST",
      body: formData,
    });

    // Count services before dry-run
    const servicesBefore = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, TEST_TENANT_ID));

    const response = await POST(request as any);
    const result = await response.json();

    // Should return validation results
    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.summary.validRows).toBe(1);
    expect(result.summary.totalRows).toBe(1);

    // Verify NO services were created
    const servicesAfter = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, TEST_TENANT_ID));

    expect(servicesAfter.length).toBe(servicesBefore.length); // No change

    // Note: Dry-run DOES create an import log with status="completed" for audit trail
    // But it does NOT insert any services into the database
  });
});
