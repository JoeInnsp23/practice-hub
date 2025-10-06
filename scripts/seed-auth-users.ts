// Seed Better Auth accounts for users using bcrypt
// This ensures passwords are properly hashed for Better Auth

import crypto from "node:crypto";
import { db } from "../lib/db";
import { accounts, users } from "../lib/db/schema";

// Use bcrypt for proper password hashing (Better Auth compatible)
async function hashPassword(password: string): Promise<string> {
  // Import bcryptjs dynamically
  const bcrypt = await import("bcryptjs");
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function seedAuthUsers() {
  console.log("🔐 Creating Better Auth accounts for seed users...\n");

  // First, clear existing accounts (from Clerk or previous runs)
  console.log("Clearing existing auth accounts...");
  await db.delete(accounts);
  console.log("✓ Cleared old accounts\n");

  const seedUsers = await db.select().from(users);

  // User passwords mapping
  const userPasswords: Record<string, string> = {
    "joe@pageivy.com": "Innspired@321",
    default: "password123",
  };

  for (const user of seedUsers) {
    const password =
      userPasswords[user.email] || userPasswords.default || "password123";

    try {
      // Hash password with bcrypt
      const hashedPassword = await hashPassword(password);

      // Insert account directly into database
      // For Better Auth credential provider, accountId typically stores email
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: user.email, // For credential provider, use email as accountId
        providerId: "credential", // Email/password provider
        userId: user.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✓ Created auth account for ${user.email}`);
    } catch (error: unknown) {
      console.error(`  ✗ Failed to create account for ${user.email}:`, error);
    }
  }

  console.log("\n✅ Auth account creation complete!");
  console.log("\n📧 Users can sign in with:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  joe@pageivy.com     → Innspired@321");
  console.log("  Other users         → password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("👥 Available Users:");
  seedUsers.forEach((user) => {
    console.log(`  • ${user.email.padEnd(30)} (${user.role})`);
  });
  console.log();

  process.exit(0);
}

seedAuthUsers().catch((error) => {
  console.error("❌ Error seeding auth users:", error);
  process.exit(1);
});
