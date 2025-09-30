import { execSync } from "node:child_process";
import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Load environment variables
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

async function runMigrations() {
  const dropSchema = process.argv.includes("--reset");

  if (dropSchema) {
    console.log("🗑️  Dropping and recreating schema...");
    try {
      execSync(
        `PGPASSWORD='PgHub2024$Secure#DB!9kL' docker exec -i practice-hub-db psql -U postgres -d practice_hub -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
        { stdio: "inherit" },
      );
      console.log("✅ Schema dropped and recreated");
    } catch (error) {
      console.error("❌ Failed to drop schema:", error);
      throw error;
    }

    console.log("\n📋 Pushing schema (creating tables)...");
    try {
      execSync("pnpm db:push:dev", { stdio: "inherit" });
      console.log("✅ Schema pushed");
    } catch (error) {
      console.error("❌ Failed to push schema:", error);
      throw error;
    }
  }

  console.log("\n🔄 Running migrations (creating views)...");

  const databaseUrl = process.env.DATABASE_URL!;
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }

  console.log("\n✅ Database migration complete!");
  if (dropSchema) {
    console.log("\n💡 Next step: Run 'pnpm db:seed' to populate the database");
  }
}

runMigrations();