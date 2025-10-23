/**
 * Verify Import Logs Table Structure
 */

import { db } from "../lib/db";
import { importLogs } from "../lib/db/schema";

async function verifyImportLogs() {
  console.log("🔍 Verifying import logs table...\n");

  try {
    // Fetch import logs from database
    const logs = await db.select().from(importLogs).limit(5);

    console.log(`✅ Found ${logs.length} import logs in database`);

    if (logs.length > 0) {
      console.log("\n📋 Sample import log:");
      console.log(JSON.stringify(logs[0], null, 2));

      // Verify structure
      const log = logs[0];
      const requiredFields = [
        "id",
        "tenantId",
        "entityType",
        "fileName",
        "status",
        "totalRows",
        "processedRows",
        "failedRows",
        "skippedRows",
        "dryRun",
        "importedBy",
        "startedAt",
      ];

      console.log("\n🔧 Verifying table structure:");
      for (const field of requiredFields) {
        const exists = field in log;
        console.log(
          `  ${exists ? "✓" : "✗"} ${field}: ${exists ? "present" : "MISSING"}`,
        );
      }
    }

    console.log("\n✅ Import logs table verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying import logs:", error);
    process.exit(1);
  }
}

verifyImportLogs();
