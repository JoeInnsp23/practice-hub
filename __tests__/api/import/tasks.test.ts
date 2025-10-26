/**
 * Task Import API Integration Tests
 *
 * Tests the /api/import/tasks endpoint with real database
 * Focus on duplicate detection (AC13), client/user lookup (AC11, AC12), and dry-run mode (AC14)
 *
 * Story: STORY-5.2
 */

import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/import/tasks/route";
import { db } from "@/lib/db";
import { clients, importLogs, tasks, tenants, users } from "@/lib/db/schema";

// Mock getAuthContext to return test auth context
vi.mock("@/lib/auth", () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    userId: "550e8400-e29b-41d4-a716-446655440012",
    tenantId: "550e8400-e29b-41d4-a716-446655440011",
    role: "admin",
    email: "test@task-import.test",
    firstName: "Test",
    lastName: "User",
    organizationName: "Test Tenant for Task Import",
  }),
}));

// Mock CSV parsing to avoid FileReaderSync browser API issues in Node
vi.mock("@/lib/services/csv-import", () => ({
  parseCsvFile: vi.fn(),
}));

// Import mocked function to customize per test
import { parseCsvFile } from "@/lib/services/csv-import";

const mockParseCsvFile = vi.mocked(parseCsvFile);

// Test IDs
const TEST_TENANT_ID = "550e8400-e29b-41d4-a716-446655440011";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440012";
const TEST_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440013";
const TEST_ASSIGNEE_ID = "550e8400-e29b-41d4-a716-446655440014";

// Shared setup for all test suites
beforeAll(async () => {
  console.log("🧪 Test setup initialized");

  // Clean up any existing test data
  await db.delete(tasks).where(eq(tasks.tenantId, TEST_TENANT_ID));
  await db.delete(importLogs).where(eq(importLogs.tenantId, TEST_TENANT_ID));
  await db.delete(clients).where(eq(clients.tenantId, TEST_TENANT_ID));
  await db.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
  await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));

  // Create test tenant
  await db.insert(tenants).values({
    id: TEST_TENANT_ID,
    name: "Test Tenant for Task Import",
    slug: "test-tenant-task-import",
  });

  // Create test users
  await db.insert(users).values([
    {
      id: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      email: "test@task-import.test",
      firstName: "Test",
      lastName: "User",
      role: "admin",
    },
    {
      id: TEST_ASSIGNEE_ID,
      tenantId: TEST_TENANT_ID,
      email: "assignee@task-import.test",
      firstName: "Assignee",
      lastName: "User",
      role: "accountant",
    },
  ]);

  // Create test client
  await db.insert(clients).values({
    id: TEST_CLIENT_ID,
    tenantId: TEST_TENANT_ID,
    name: "Test Client Ltd",
    type: "company",
    clientCode: "TEST001",
    status: "active",
  });
});

afterAll(async () => {
  console.log("✅ Test teardown complete");

  // Clean up test data
  await db.delete(tasks).where(eq(tasks.tenantId, TEST_TENANT_ID));
  await db.delete(importLogs).where(eq(importLogs.tenantId, TEST_TENANT_ID));
  await db.delete(clients).where(eq(clients.tenantId, TEST_TENANT_ID));
  await db.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
  await db.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));
});

describe("Task Import API - Duplicate Detection (AC13)", () => {
  it("should detect duplicate task against existing database records (AC13)", async () => {
    // Insert existing task in database
    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      tenantId: TEST_TENANT_ID,
      clientId: TEST_CLIENT_ID,
      title: "Prepare Annual Accounts",
      status: "pending",
      priority: "high",
      createdById: TEST_USER_ID,
      assignedToId: TEST_USER_ID,
    });

    // Attempt to import same task
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Prepare Annual Accounts", // Duplicate title
          client_code: "TEST001",
          status: "pending",
          priority: "medium",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(0); // Not imported due to duplicate
    expect(result.summary.failedRows).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("title");
    expect(result.errors[0].message).toContain("Duplicate task");
  });

  it("should detect duplicate task within same import batch (AC13)", async () => {
    // Clear any existing tasks
    await db.delete(tasks).where(eq(tasks.clientId, TEST_CLIENT_ID));

    // Attempt to import two tasks with same title
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "VAT Return Q1",
          client_code: "TEST001",
          status: "pending",
          priority: "high",
        },
        {
          title: "VAT Return Q1", // Duplicate within batch
          client_code: "TEST001",
          status: "in_progress",
          priority: "urgent",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(1); // Only first task imported
    expect(result.summary.failedRows).toBe(1); // Second is duplicate
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Duplicate task");

    // Verify only one task exists in database
    const tasksInDb = await db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, TEST_CLIENT_ID));
    expect(tasksInDb).toHaveLength(1);
    expect(tasksInDb[0].title).toBe("VAT Return Q1");
  });

  it("should detect duplicates with case-insensitive title matching (AC13)", async () => {
    // Clear existing tasks
    await db.delete(tasks).where(eq(tasks.clientId, TEST_CLIENT_ID));

    // Insert task with lowercase title
    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      tenantId: TEST_TENANT_ID,
      clientId: TEST_CLIENT_ID,
      title: "file tax return",
      status: "pending",
      priority: "medium",
      createdById: TEST_USER_ID,
      assignedToId: TEST_USER_ID,
    });

    // Attempt to import same task with different case
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "FILE TAX RETURN", // Different case, same title
          client_code: "TEST001",
          status: "pending",
          priority: "high",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.failedRows).toBe(1);
    expect(result.errors[0].message).toContain("Duplicate task");
  });

  it("should allow same task title for different clients (not a duplicate)", async () => {
    // Create second client
    const secondClientId = "550e8400-e29b-41d4-a716-446655440015";
    await db.insert(clients).values({
      id: secondClientId,
      tenantId: TEST_TENANT_ID,
      name: "Second Client Ltd",
      type: "company",
      clientCode: "TEST002",
      status: "active",
    });

    // Clear existing tasks
    await db.delete(tasks).where(eq(tasks.tenantId, TEST_TENANT_ID));

    // Insert task for first client
    await db.insert(tasks).values({
      id: crypto.randomUUID(),
      tenantId: TEST_TENANT_ID,
      clientId: TEST_CLIENT_ID,
      title: "Annual Review",
      status: "pending",
      priority: "medium",
      createdById: TEST_USER_ID,
      assignedToId: TEST_USER_ID,
    });

    // Import same title for second client (should succeed - different client)
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Annual Review", // Same title, different client
          client_code: "TEST002",
          status: "pending",
          priority: "high",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(1); // Should succeed
    expect(result.summary.failedRows).toBe(0);

    // Clean up second client
    await db.delete(clients).where(eq(clients.id, secondClientId));
  });
});

describe("Task Import API - Client/User Lookup (AC11, AC12)", () => {
  it("should fail when client_code not found (AC11)", async () => {
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Task for Non-Existent Client",
          client_code: "INVALID999", // Client doesn't exist
          status: "pending",
          priority: "medium",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true); // API succeeds, but import fails
    expect(result.summary.processedRows).toBe(0);
    expect(result.summary.failedRows).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("client_code");
    expect(result.errors[0].message).toContain("Client not found");
  });

  it("should fail when assigned_to_email not found (AC12)", async () => {
    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Task with Invalid Assignee",
          client_code: "TEST001",
          assigned_to_email: "nonexistent@invalid.com", // User doesn't exist
          status: "pending",
          priority: "medium",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(0); // Task still fails lookup
    expect(result.summary.failedRows).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("assigned_to_email");
    expect(result.errors[0].message).toContain("User not found");
  });

  it("should successfully import task with valid client and user (AC11, AC12)", async () => {
    // Clear existing tasks
    await db.delete(tasks).where(eq(tasks.clientId, TEST_CLIENT_ID));

    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Valid Task Import",
          client_code: "TEST001", // Valid client
          assigned_to_email: "assignee@task-import.test", // Valid user
          status: "pending",
          priority: "high",
          due_date: "2025-12-31",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(1);
    expect(result.summary.failedRows).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify task created in database
    const tasksInDb = await db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, TEST_CLIENT_ID));
    expect(tasksInDb).toHaveLength(1);
    expect(tasksInDb[0].title).toBe("Valid Task Import");
    expect(tasksInDb[0].assignedToId).toBe(TEST_ASSIGNEE_ID);
  });
});

describe("Task Import API - Dry-Run Mode (AC14)", () => {
  it("should validate without importing when dry-run enabled (AC14)", async () => {
    // Clear existing tasks
    await db.delete(tasks).where(eq(tasks.clientId, TEST_CLIENT_ID));

    const taskCountBefore = await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, TEST_TENANT_ID));

    mockParseCsvFile.mockResolvedValueOnce({
      data: [
        {
          title: "Dry Run Task",
          client_code: "TEST001",
          status: "pending",
          priority: "medium",
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

    const formData = new FormData();
    formData.append("file", new File(["mock"], "tasks.csv"));
    formData.append("dryRun", "true"); // DRY RUN MODE

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.summary.validRows).toBe(1);

    // Verify NO tasks were imported
    const taskCountAfter = await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, TEST_TENANT_ID));
    expect(taskCountAfter.length).toBe(taskCountBefore.length);
  });

  it("should show validation errors in dry-run mode (AC14)", async () => {
    mockParseCsvFile.mockResolvedValueOnce({
      data: [],
      errors: [
        {
          row: 2,
          field: "title",
          message: "Task title is required",
        },
        {
          row: 3,
          field: "client_code",
          message: "Client code is required",
        },
      ],
      meta: {
        totalRows: 2,
        validRows: 0,
        invalidRows: 2,
        skippedRows: 0,
      },
    });

    const formData = new FormData();
    formData.append("file", new File(["mock"], "invalid-tasks.csv"));
    formData.append("dryRun", "true");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.summary.invalidRows).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].field).toBe("title");
    expect(result.errors[1].field).toBe("client_code");
  });
});

describe("Task Import API - Batch Processing", () => {
  it("should process large imports in batches", async () => {
    // Clear existing tasks
    await db.delete(tasks).where(eq(tasks.clientId, TEST_CLIENT_ID));

    // Generate 100 tasks for batch testing
    const largeBatch = Array.from({ length: 100 }, (_, i) => ({
      title: `Batch Task ${i + 1}`,
      client_code: "TEST001",
      status: "pending" as const,
      priority: "medium" as const,
    }));

    mockParseCsvFile.mockResolvedValueOnce({
      data: largeBatch,
      errors: [],
      meta: {
        totalRows: 100,
        validRows: 100,
        invalidRows: 0,
        skippedRows: 0,
      },
    });

    const formData = new FormData();
    formData.append("file", new File(["mock"], "large-import.csv"));
    formData.append("dryRun", "false");

    const request = {
      formData: async () => formData,
    } as unknown as NextRequest;

    const response = await POST(request);
    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.summary.processedRows).toBe(100);
    expect(result.summary.failedRows).toBe(0);

    // Verify all tasks were imported
    const tasksInDb = await db
      .select()
      .from(tasks)
      .where(eq(tasks.clientId, TEST_CLIENT_ID));
    expect(tasksInDb).toHaveLength(100);
  });
});
