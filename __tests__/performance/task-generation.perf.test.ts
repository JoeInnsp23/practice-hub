/**
 * Performance Tests for Task Generation
 * Validates AC18: Bulk generation should complete in < 5 seconds for 50 tasks
 */

import type { Context } from "@/app/server/context";
import { taskGenerationRouter } from "@/app/server/routers/task-generation";
import { db } from "@/lib/db";
import {
  clients,
  clientServices,
  services,
  taskTemplates,
  tasks,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
  type TestDataTracker,
} from "../helpers/factories";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("Task Generation Performance Tests", () => {
  let ctx: Context;
  let caller: ReturnType<typeof createCaller<typeof taskGenerationRouter>>;
  const tracker: TestDataTracker = {
    tenants: [],
    users: [],
    clients: [],
    services: [],
    taskTemplates: [],
    tasks: [],
  };

  let testTenantId: string;
  let testUserId: string;
  let testServiceId: string;
  let testTemplateId: string;
  let testClientIds: string[] = [];

  beforeAll(async () => {
    // 1. Create test tenant using factory
    testTenantId = await createTestTenant();
    tracker.tenants?.push(testTenantId);

    // 2. Create test user using factory
    testUserId = await createTestUser(testTenantId, { role: "admin" });
    tracker.users?.push(testUserId);

    // 3. Create mock context
    ctx = createMockContext({
      authContext: {
        userId: testUserId,
        tenantId: testTenantId,
        organizationName: "Performance Test Firm",
        role: "admin",
        email: `perftest-${Date.now()}@example.com`,
        firstName: "Perf",
        lastName: "Test",
      },
    });

    caller = createCaller(taskGenerationRouter, ctx);

    // 4. Create test service
    const [service] = await db
      .insert(services)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        code: `PERFSERV-${Date.now()}`,
        name: "VAT Return",
        description: "Quarterly VAT return filing",
        category: "compliance",
        pricingModel: "fixed",
        isActive: true,
      })
      .returning();
    testServiceId = service.id;
    tracker.services?.push(testServiceId);

    // 5. Create ONE task template (AC18: 50 tasks from templates)
    const [template] = await db
      .insert(taskTemplates)
      .values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        serviceId: testServiceId,
        namePattern: "VAT Return Q{period} - {client_name}",
        descriptionPattern: "Complete VAT return for {client_name}",
        priority: "high",
        taskType: "compliance",
        estimatedHours: 2,
        dueDateOffsetMonths: 1,
        dueDateOffsetDays: 7,
        isRecurring: true,
        recurringFrequency: "quarterly",
        createdBy: testUserId,
      })
      .returning();
    testTemplateId = template.id;
    tracker.taskTemplates?.push(testTemplateId);

    // 6. Create 50 test clients to generate 50 tasks
    for (let i = 0; i < 50; i++) {
      const [client] = await db
        .insert(clients)
        .values({
          tenantId: testTenantId,
          clientCode: `PERF${String(i).padStart(3, "0")}`,
          name: `Performance Test Client ${i + 1}`,
          type: "company",
          status: "active",
          accountManagerId: testUserId,
        })
        .returning();
      testClientIds.push(client.id);
      tracker.clients?.push(client.id);

      // Link client to service
      await db.insert(clientServices).values({
        id: crypto.randomUUID(),
        tenantId: testTenantId,
        clientId: client.id,
        serviceId: testServiceId,
        status: "active",
      });
    }

    console.log(
      `✓ Performance test setup complete: 50 clients, 1 template, tenant ${testTenantId}`,
    );
  });

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it("AC18: should generate 50 tasks in < 5 seconds", async () => {
    // Start performance timer
    const startTime = performance.now();

    // Execute bulk generation for all 50 clients
    const result = await caller.bulkGenerateForService({
      serviceId: testServiceId,
      clientIds: testClientIds,
    });

    // End performance timer
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000; // Convert to seconds

    // Log results
    console.log(`\n📊 Performance Test Results:`);
    console.log(`   Clients processed: ${testClientIds.length}`);
    console.log(`   Tasks generated: ${result.generated}`);
    console.log(`   Tasks skipped: ${result.skipped}`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Avg per task: ${(executionTime / result.generated).toFixed(3)}s`,
    );
    console.log(
      `   Status: ${executionTime < 5 ? "✅ PASS" : "❌ FAIL"} (requirement: <5s)\n`,
    );

    // Assertions
    expect(result.generated).toBe(50);
    expect(result.failed).toBe(0);
    expect(executionTime).toBeLessThan(5.0); // AC18 requirement

    // Verify tasks were actually created in database
    const createdTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, testTenantId));

    expect(createdTasks).toHaveLength(50);
    expect(
      createdTasks.every((task) => task.autoGenerated === true),
    ).toBe(true);
    expect(createdTasks.every((task) => task.templateId === testTemplateId)).toBe(
      true,
    );
  }, 10000); // 10 second timeout for performance test

  it("should handle performance with transaction rollback on error", async () => {
    // Try to generate with an invalid client ID (should trigger rollback)
    const invalidClientIds = [...testClientIds.slice(0, 10), "invalid-id"];

    const startTime = performance.now();

    await expect(
      caller.bulkGenerateForService({
        serviceId: testServiceId,
        clientIds: invalidClientIds,
      }),
    ).rejects.toThrow();

    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;

    console.log(`\n🔄 Transaction Rollback Performance:`);
    console.log(`   Execution time: ${executionTime.toFixed(3)}s`);
    console.log(
      `   Status: ${executionTime < 1 ? "✅ Fast rollback" : "⚠️ Slow rollback"}\n`,
    );

    // Verify no partial tasks were created (transaction rolled back)
    const tasksAfterError = await db
      .select()
      .from(tasks)
      .where(eq(tasks.tenantId, testTenantId));

    // Should still only have the 50 tasks from first test
    expect(tasksAfterError).toHaveLength(50);
  }, 10000);
});
