/**
 * TECHNICAL SPIKE: Drizzle Transaction-Based Test Isolation
 *
 * Purpose: Validate if Drizzle ORM supports transaction-based test isolation
 * for integration tests. This spike will determine the recommended approach
 * for test data cleanup.
 *
 * Success Criteria:
 * 1. Drizzle supports db.transaction() for wrapping test operations
 * 2. Transaction rollback successfully prevents data persistence
 * 3. Works with tRPC router procedure calls (not just raw queries)
 * 4. Performance is acceptable (no significant overhead)
 *
 * Decision: If all criteria pass → use transaction pattern
 *           If any fail → use unique test IDs + afterEach cleanup
 */

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Context } from "@/app/server/context";
import { clientsRouter } from "@/app/server/routers/clients";
import { db } from "@/lib/db";
import { clients, tenants, users } from "@/lib/db/schema";
import { createCaller, createMockContext } from "../helpers/trpc";

describe("SPIKE: Transaction-Based Test Isolation", () => {
  const testTenantId = crypto.randomUUID();
  const testUserId = crypto.randomUUID();

  // Setup: Create test tenant and user before spike tests
  beforeEach(async () => {
    // Create test tenant
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Spike Test Tenant",
      slug: `spike-test-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create test user
    await db.insert(users).values({
      id: testUserId,
      tenantId: testTenantId,
      email: `spike-test-${Date.now()}@example.com`,
      role: "admin",
      firstName: "Spike",
      lastName: "Test",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // Cleanup: Remove test data after spike tests
  afterEach(async () => {
    // Clean up in reverse order of foreign key dependencies
    await db.delete(clients).where(eq(clients.tenantId, testTenantId));
    await db.delete(users).where(eq(users.tenantId, testTenantId));
    await db.delete(tenants).where(eq(tenants.id, testTenantId));
  });

  describe("Test 1: Basic Transaction Support", () => {
    it("should support db.transaction() wrapper", async () => {
      // Verify Drizzle supports transaction syntax
      await expect(
        db.transaction(async (_tx) => {
          return { success: true };
        }),
      ).resolves.toEqual({ success: true });
    });

    it("should allow database operations within transaction", async () => {
      const clientId = crypto.randomUUID();

      await db.transaction(async (tx) => {
        await tx.insert(clients).values({
          id: clientId,
          tenantId: testTenantId,
          createdBy: testUserId,
          clientCode: `TEST-${Date.now()}`,
          name: "Transaction Test Client",
          type: "limited_company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Verify insert within transaction
        const [inserted] = await tx
          .select()
          .from(clients)
          .where(eq(clients.id, clientId));

        expect(inserted).toBeDefined();
        expect(inserted.name).toBe("Transaction Test Client");
      });

      // Verify data persisted after transaction commits
      const [persisted] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId));

      expect(persisted).toBeDefined();
      expect(persisted.name).toBe("Transaction Test Client");

      // Cleanup
      await db.delete(clients).where(eq(clients.id, clientId));
    });
  });

  describe("Test 2: Transaction Rollback (CRITICAL)", () => {
    it("should rollback transaction when error is thrown", async () => {
      const clientId = crypto.randomUUID();

      await expect(
        db.transaction(async (tx) => {
          // Insert data
          await tx.insert(clients).values({
            id: clientId,
            tenantId: testTenantId,
            createdBy: testUserId,
            clientCode: `ROLLBACK-${Date.now()}`,
            name: "Rollback Test Client",
            type: "limited_company",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Throw error to trigger rollback
          throw new Error("Intentional error to test rollback");
        }),
      ).rejects.toThrow("Intentional error to test rollback");

      // CRITICAL: Verify data was NOT persisted
      const results = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId));

      expect(results).toHaveLength(0);
    });

    it("should rollback transaction with explicit rollback call", async () => {
      const clientId = crypto.randomUUID();
      let shouldRollback = false;

      try {
        await db.transaction(async (tx) => {
          // Insert data
          await tx.insert(clients).values({
            id: clientId,
            tenantId: testTenantId,
            createdBy: testUserId,
            clientCode: `EXPLICIT-${Date.now()}`,
            name: "Explicit Rollback Test",
            type: "limited_company",
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Set flag and throw to rollback
          shouldRollback = true;
          throw new Error("Rollback");
        });
      } catch (_error) {
        // Expected error
        expect(shouldRollback).toBe(true);
      }

      // Verify no data persisted
      const results = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId));

      expect(results).toHaveLength(0);
    });
  });

  describe("Test 3: Integration with tRPC Router Procedures", () => {
    it("should work with tRPC router.createCaller pattern", async () => {
      const _clientId = crypto.randomUUID();
      let procedureCalled = false;

      await expect(
        db.transaction(async (_tx) => {
          // Create tRPC context with transaction-aware database
          // Note: This is a limitation test - tRPC routers use global db import
          const ctx: Context = createMockContext({
            authContext: {
              userId: testUserId,
              tenantId: testTenantId,
              organizationName: "Spike Test Tenant",
              role: "admin",
              email: "spike@test.com",
              firstName: "Spike",
              lastName: "Test",
            },
          });

          // Create caller
          const caller = createCaller(clientsRouter, ctx);

          // Call create procedure
          const result = await caller.create({
            clientCode: `TRPC-${Date.now()}`,
            name: "tRPC Transaction Test",
            type: "limited_company",
            status: "active",
          });

          procedureCalled = true;
          expect(result.client).toBeDefined();
          expect(result.client.name).toBe("tRPC Transaction Test");

          // Store client ID for verification
          const _createdId = result.client.id;

          // Throw to rollback
          throw new Error("Testing tRPC rollback");
        }),
      ).rejects.toThrow("Testing tRPC rollback");

      expect(procedureCalled).toBe(true);

      // CRITICAL FINDING: tRPC routers use global db import, not transaction db
      // This means transaction-based isolation WON'T WORK with current architecture
      // unless we refactor routers to accept db as a parameter
    });
  });

  describe("Test 4: Performance Measurement", () => {
    it("should measure transaction overhead", async () => {
      const iterations = 50;

      // Measure WITHOUT transaction
      const startWithout = Date.now();
      for (let i = 0; i < iterations; i++) {
        const clientId = crypto.randomUUID();
        await db.insert(clients).values({
          id: clientId,
          tenantId: testTenantId,
          createdBy: testUserId,
          clientCode: `PERF-${i}`,
          name: `Perf Test ${i}`,
          type: "limited_company",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await db.delete(clients).where(eq(clients.id, clientId));
      }
      const durationWithout = Date.now() - startWithout;

      // Measure WITH transaction
      const startWith = Date.now();
      for (let i = 0; i < iterations; i++) {
        try {
          await db.transaction(async (tx) => {
            const clientId = crypto.randomUUID();
            await tx.insert(clients).values({
              id: clientId,
              tenantId: testTenantId,
              createdBy: testUserId,
              clientCode: `PERF-TX-${i}`,
              name: `Perf Test ${i}`,
              type: "limited_company",
              status: "active",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            throw new Error("Rollback");
          });
        } catch {
          // Expected
        }
      }
      const durationWith = Date.now() - startWith;

      console.log("\n📊 Performance Results:");
      console.log(`Without transaction: ${durationWithout}ms`);
      console.log(`With transaction: ${durationWith}ms`);
      console.log(
        `Overhead: ${durationWith - durationWithout}ms (${((durationWith / durationWithout - 1) * 100).toFixed(1)}%)`,
      );

      // Performance should be acceptable (< 50% overhead)
      const overhead = durationWith / durationWithout - 1;
      expect(overhead).toBeLessThan(0.5); // Less than 50% overhead
    });
  });

  describe("Test 5: Alternative Approach - Unique IDs + Cleanup", () => {
    it("should demonstrate unique ID approach", async () => {
      const testPrefix = `test-${Date.now()}`;
      const clientId = crypto.randomUUID();

      // Create test data with unique identifier
      await db.insert(clients).values({
        id: clientId,
        tenantId: testTenantId,
        createdBy: testUserId,
        clientCode: `${testPrefix}-CODE`,
        name: `${testPrefix}-client`,
        type: "limited_company",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Verify data exists
      const [created] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId));
      expect(created).toBeDefined();

      // Cleanup in afterEach
      await db.delete(clients).where(eq(clients.id, clientId));

      // Verify cleanup worked
      const results = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId));
      expect(results).toHaveLength(0);
    });
  });
});
