#!/usr/bin/env tsx

/**
 * Annual Leave Carryover Script
 *
 * This script transfers unused annual leave from one year to the next (max 5 days per AC14).
 * Should be run annually on December 31st or January 1st.
 *
 * Usage:
 *   pnpm tsx scripts/annual-carryover.ts [year]
 *
 * Examples:
 *   pnpm tsx scripts/annual-carryover.ts 2025  # Carryover from 2025 to 2026
 *   pnpm tsx scripts/annual-carryover.ts       # Carryover from current year to next year
 *
 * Scheduling (cron):
 *   # Run at midnight on January 1st
 *   0 0 1 1 * cd /path/to/practice-hub && pnpm tsx scripts/annual-carryover.ts
 */

import { runGlobalCarryover } from "@/lib/leave/carryover";

async function main() {
  const args = process.argv.slice(2);
  const fromYear = args[0]
    ? Number.parseInt(args[0], 10)
    : new Date().getFullYear();

  if (Number.isNaN(fromYear)) {
    console.error("Error: Invalid year provided");
    console.error("Usage: pnpm tsx scripts/annual-carryover.ts [year]");
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("📅 Annual Leave Carryover");
  console.log("========================================");
  console.log(`From Year: ${fromYear}`);
  console.log(`To Year:   ${fromYear + 1}`);
  console.log(`Started:   ${new Date().toISOString()}`);
  console.log("========================================\n");

  console.log("Processing carryover for all tenants...\n");

  const result = await runGlobalCarryover(fromYear);

  console.log("\n========================================");
  console.log("✅ Carryover Complete");
  console.log("========================================");
  console.log(`Tenants Processed:    ${result.tenantsProcessed}`);
  console.log(`Users Processed:      ${result.totalUsersProcessed}`);
  console.log(`Users Failed:         ${result.totalUsersFailed}`);
  console.log(`Completed:            ${new Date().toISOString()}`);
  console.log("========================================\n");

  if (result.totalUsersFailed > 0) {
    console.warn(
      `⚠️  ${result.totalUsersFailed} users failed processing. Check logs for details.`,
    );
    process.exit(1);
  }

  console.log("✨ All users processed successfully!");
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Fatal Error:");
  console.error(error);
  process.exit(1);
});
