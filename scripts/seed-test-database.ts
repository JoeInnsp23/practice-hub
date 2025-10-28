/**
 * E2E Test Database Seed Script
 * Creates test tenant and test users for E2E testing
 * Run with: DATABASE_URL=$DATABASE_URL_TEST pnpm tsx scripts/seed-test-database.ts
 */

import crypto from "node:crypto";
import bcryptjs from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  accounts,
  clients,
  portalCategories,
  portalLinks,
  tasks,
  tenants,
  users,
} from "../lib/db/schema";

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
    // Step 1: Clean existing test data (in correct order - children first)
    console.log("🧹 Cleaning existing test data...");
    await db.delete(tasks).where(sql`tenant_id = 'tenant_e2e_test'`);
    await db.delete(clients).where(sql`tenant_id = 'tenant_e2e_test'`);
    await db.delete(portalLinks).where(sql`tenant_id = 'tenant_e2e_test'`);
    await db.delete(portalCategories).where(sql`tenant_id = 'tenant_e2e_test'`);
    await db.delete(accounts).where(sql`account_id LIKE 'e2e-%@test.com'`);
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
    const adminPassword =
      process.env.E2E_TEST_ADMIN_PASSWORD || "E2ETestAdmin123!";
    const userPassword =
      process.env.E2E_TEST_USER_PASSWORD || "E2ETestUser123!";

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

    // Step 7: Create Portal Categories and Links (same as dev seed)
    console.log("🔗 Creating portal categories and links...");

    const [practiceHubCategory] = await db
      .insert(portalCategories)
      .values({
        tenantId: testTenant.id,
        name: "Practice Hub",
        description: "Internal practice management modules",
        iconName: "LayoutGrid",
        colorHex: "#ff8609",
        sortOrder: 1,
        isActive: true,
        createdById: adminUser.id,
      })
      .returning();

    const [_externalToolsCategory] = await db
      .insert(portalCategories)
      .values({
        tenantId: testTenant.id,
        name: "External Tools",
        description: "Government and regulatory services",
        iconName: "ExternalLink",
        colorHex: "#3b82f6",
        sortOrder: 2,
        isActive: true,
        createdById: adminUser.id,
      })
      .returning();

    const [_practiceResourcesCategory] = await db
      .insert(portalCategories)
      .values({
        tenantId: testTenant.id,
        name: "Practice Resources",
        description: "Professional bodies and resources",
        iconName: "BookOpen",
        colorHex: "#8b5cf6",
        sortOrder: 3,
        isActive: true,
        createdById: adminUser.id,
      })
      .returning();

    // Create Practice Hub internal module links
    const practiceHubLinks = [
      {
        title: "Client Hub",
        description: "Manage clients, contacts, and relationships",
        url: "/client-hub",
        iconName: "Users",
        sortOrder: 1,
      },
      {
        title: "Proposal Hub",
        description: "Create and manage client proposals",
        url: "/proposal-hub",
        iconName: "FileText",
        sortOrder: 2,
      },
      {
        title: "Social Hub",
        description: "Practice social features (coming soon)",
        url: "/social-hub",
        iconName: "Share2",
        sortOrder: 3,
      },
      {
        title: "Bookkeeping Hub",
        description: "Bookkeeping and reconciliation (coming soon)",
        url: "/bookkeeping",
        iconName: "Calculator",
        sortOrder: 4,
      },
      {
        title: "Accounts Hub",
        description: "Annual accounts preparation (coming soon)",
        url: "/accounts-hub",
        iconName: "Building",
        sortOrder: 5,
      },
      {
        title: "Payroll Hub",
        description: "Payroll processing and RTI (coming soon)",
        url: "/payroll",
        iconName: "DollarSign",
        sortOrder: 6,
      },
      {
        title: "Employee Portal",
        description: "Employee self-service portal (coming soon)",
        url: "/employee-portal",
        iconName: "Briefcase",
        sortOrder: 7,
      },
      {
        title: "Client Admin",
        description: "Manage external client portal users and access",
        url: "/client-admin",
        iconName: "Users",
        sortOrder: 8,
      },
      {
        title: "Admin Panel",
        description: "System administration and configuration",
        url: "/admin",
        iconName: "Settings",
        sortOrder: 9,
      },
    ];

    await db.insert(portalLinks).values(
      practiceHubLinks.map((link) => ({
        tenantId: testTenant.id,
        categoryId: practiceHubCategory.id,
        title: link.title,
        description: link.description,
        url: link.url,
        isInternal: true,
        iconName: link.iconName,
        sortOrder: link.sortOrder,
        isActive: true,
        createdById: adminUser.id,
      })),
    );
    console.log(`✅ Created ${practiceHubLinks.length} Practice Hub links`);

    // Step 8: Create test client for tasks
    console.log("🏢 Creating test client...");
    const [testClient] = await db
      .insert(clients)
      .values({
        tenantId: testTenant.id,
        clientCode: "TEST001",
        name: "Test Client Ltd",
        email: "test@client.com",
        status: "active",
        clientType: "limited_company",
        accountManagerId: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log(`✅ Test client created: ${testClient.name}`);

    // Step 9: Create test tasks with different assignment types
    console.log("📋 Creating test tasks for My Tasks filter validation...");

    const tasksData = [
      {
        title: "Task assigned to member (assignedTo)",
        description:
          "This task should appear in member's My Tasks (assignedTo field)",
        assignedToId: memberUser.id,
        preparerId: null,
        reviewerId: null,
      },
      {
        title: "Task with member as preparer",
        description:
          "This task should appear in member's My Tasks (preparer field)",
        assignedToId: adminUser.id,
        preparerId: memberUser.id,
        reviewerId: null,
      },
      {
        title: "Task with member as reviewer",
        description:
          "This task should appear in member's My Tasks (reviewer field)",
        assignedToId: adminUser.id,
        preparerId: null,
        reviewerId: memberUser.id,
      },
      {
        title: "Task NOT assigned to member",
        description: "This task should NOT appear in member's My Tasks",
        assignedToId: adminUser.id,
        preparerId: null,
        reviewerId: null,
      },
    ];

    for (const taskData of tasksData) {
      await db.insert(tasks).values({
        tenantId: testTenant.id,
        clientId: testClient.id,
        title: taskData.title,
        description: taskData.description,
        status: "pending",
        priority: "medium",
        assignedToId: taskData.assignedToId,
        preparerId: taskData.preparerId,
        reviewerId: taskData.reviewerId,
        createdById: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(
      `✅ Created ${tasksData.length} test tasks for filter validation`,
    );

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
