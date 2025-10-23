import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Cleanup helper for E2E tests
 * Deletes all test data with E2E-Test- prefix from the test database
 */

const DATABASE_URL = process.env.DATABASE_URL_TEST;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL_TEST environment variable is not set");
}

/**
 * Clean up all E2E test data from the test database
 * Deletes records with "E2E-Test-" prefix in their names
 */
export async function cleanupTestData(): Promise<void> {
  const connection = postgres(DATABASE_URL);
  const db = drizzle(connection);

  try {
    // Delete test clients (cascades to related records due to foreign keys)
    await db.execute(sql`DELETE FROM clients WHERE name LIKE 'E2E-Test-%'`);

    // Delete test tasks
    await db.execute(sql`DELETE FROM tasks WHERE title LIKE 'E2E-Test-%'`);

    // Delete test invoices
    await db.execute(
      sql`DELETE FROM invoices WHERE invoice_number LIKE 'E2E-TEST-%'`,
    );

    // Delete test documents
    await db.execute(sql`DELETE FROM documents WHERE name LIKE 'E2E-Test-%'`);

    console.log("✅ E2E test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Verify that all E2E test data has been cleaned up
 * Returns count of remaining E2E test records
 */
export async function verifyCleanup(): Promise<number> {
  const connection = postgres(DATABASE_URL);
  const db = drizzle(connection);

  try {
    const result = await db.execute(
      sql`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM clients WHERE name LIKE 'E2E-Test-%'
          UNION ALL
          SELECT id FROM tasks WHERE title LIKE 'E2E-Test-%'
          UNION ALL
          SELECT id FROM invoices WHERE invoice_number LIKE 'E2E-TEST-%'
          UNION ALL
          SELECT id FROM documents WHERE name LIKE 'E2E-Test-%'
        ) as test_records
      `,
    );

    const count = Number(result[0]?.count || 0);

    if (count > 0) {
      console.warn(`⚠️  Found ${count} orphaned E2E test records`);
    } else {
      console.log("✅ No orphaned E2E test records found");
    }

    return count;
  } finally {
    await connection.end();
  }
}
