/**
 * E2E Test Database Seed Script
 * Creates test tenant and test users for E2E testing
 * Run with: DATABASE_URL=$DATABASE_URL_TEST pnpm tsx scripts/seed-test-database.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { tenants, users, accounts } from "../lib/db/schema";
import bcryptjs from "bcryptjs";
import crypto from "node:crypto";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

console.log("🌱 Seeding E2E test database...");
console.log(`📍 Database: ${DATABASE_URL}`);

// Create PostgreSQL connection
const connection = postgres(DATABASE_URL);
const db = drizzle(connection);

async function seedTestDatabase() {
  try {
    // Step 1: Clean existing test data
    console.log("🧹 Cleaning existing test data...");
    await db.delete(users).where(sql`email LIKE 'e2e-%@test.com'`);
    await db.delete(tenants).where(sql`id = 'tenant_e2e_test'`);
    console.log("✅ Existing test data cleaned");

    // Step 2: Create test tenant
    console.log("🏢 Creating test tenant...");
    const [testTenant] = await db
      .insert(tenants)
      .values({
        id: "tenant_e2e_test",
        name: "E2E Test Tenant",
        slug: "e2e-test-tenant",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log(`✅ Test tenant created: ${testTenant.name}`);

    // Step 3: Get test user passwords from environment
    const adminPassword = process.env.E2E_TEST_ADMIN_PASSWORD || "E2ETestAdmin123!";
    const userPassword = process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!";

    // Step 4: Hash passwords
    console.log("🔐 Hashing passwords...");
    const hashedAdminPassword = await bcryptjs.hash(adminPassword, 10);
    const hashedUserPassword = await bcryptjs.hash(userPassword, 10);

    // Step 5: Create test admin user
    console.log("👤 Creating test admin user...");
    const adminUserId = crypto.randomUUID();
    const [adminUser] = await db
      .insert(users)
      .values({
        id: adminUserId,
        tenantId: testTenant.id,
        email: "e2e-admin@test.com",
        emailVerified: true,
        role: "admin",
        firstName: "E2E",
        lastName: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log(`✅ Test admin user created: ${adminUser.email}`);

    // Create account record with password for admin
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: adminUser.email,
      providerId: "credential",
      userId: adminUserId,
      password: hashedAdminPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Admin account credentials created");

    // Step 6: Create test member user
    console.log("👤 Creating test member user...");
    const memberUserId = crypto.randomUUID();
    const [memberUser] = await db
      .insert(users)
      .values({
        id: memberUserId,
        tenantId: testTenant.id,
        email: "e2e-user@test.com",
        emailVerified: true,
        role: "member",
        firstName: "E2E",
        lastName: "User",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log(`✅ Test member user created: ${memberUser.email}`);

    // Create account record with password for member user
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: memberUser.email,
      providerId: "credential",
      userId: memberUserId,
      password: hashedUserPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✅ Member user account credentials created");

    console.log("\n✨ E2E test database seeded successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("   Admin: e2e-admin@test.com / E2ETestAdmin123!");
    console.log("   User:  e2e-user@test.com  / E2ETestUser123!");
    console.log("\n💡 Add these to your .env.test file:");
    console.log('   E2E_TEST_ADMIN_PASSWORD="E2ETestAdmin123!"');
    console.log('   E2E_TEST_USER_PASSWORD="E2ETestUser123!"');

  } catch (error) {
    console.error("❌ Error seeding test database:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run seed function
seedTestDatabase()
  .then(() => {
    console.log("\n🎉 Test database ready for E2E tests!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
