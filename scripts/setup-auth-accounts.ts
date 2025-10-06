// Setup Better Auth accounts for seed users

import crypto from "node:crypto";
import { db } from "../lib/db";
import { accounts, users } from "../lib/db/schema";

// Simple password hashing (Better Auth will use bcrypt, this is just for seeding)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function setupAuthAccounts() {
  console.log("🔐 Setting up Better Auth accounts for seed users...");

  const seedUsers = await db.select().from(users);

  const defaultPassword = "password123"; // Default password for all seed users
  const joePassword = "Innspired@321"; // Special password for joe@pageivy.com

  for (const user of seedUsers) {
    // Use special password for Joe, default for everyone else
    const password = user.email === "joe@pageivy.com" ? joePassword : defaultPassword;

    // Create account record for email/password auth
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: user.email,
      providerId: "credential", // Better Auth uses "credential" for email/password
      userId: user.id,
      password: hashPassword(password),
    });

    console.log(`✓ Created auth account for ${user.email}`);
  }

  console.log("\n✅ Auth accounts setup complete!");
  console.log("\n📧 Users can sign in with:");
  console.log("- joe@pageivy.com: Innspired@321");
  console.log("- Other users: password123\n");
  console.log("Users:");
  seedUsers.forEach((user) => {
    console.log(`  - ${user.email} (${user.role})`);
  });

  process.exit(0);
}

setupAuthAccounts().catch((error) => {
  console.error("Error setting up auth accounts:", error);
  process.exit(1);
});
