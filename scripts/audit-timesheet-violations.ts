#!/usr/bin/env tsx

/**
 * Timesheet Data Audit Script
 *
 * Identifies existing violations in production data:
 * 1. Overlapping time entries for same user/date
 * 2. Daily totals exceeding 24 hours
 *
 * Run: pnpm tsx scripts/audit-timesheet-violations.ts
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

interface OverlapViolation {
  tenantId: string;
  userId: string;
  date: string;
  entry1Id: string;
  entry1Time: string;
  entry2Id: string;
  entry2Time: string;
  [key: string]: unknown;
}

interface DailyLimitViolation {
  tenantId: string;
  userId: string;
  date: string;
  totalHours: number;
  entryCount: number;
  [key: string]: unknown;
}

async function auditOverlaps(): Promise<OverlapViolation[]> {
  console.log("\n🔍 Auditing for overlapping time entries...");

  const result = await db.execute<OverlapViolation>(sql`
    SELECT
      t1.tenant_id AS "tenantId",
      t1.user_id AS "userId",
      t1.date,
      t1.id AS "entry1Id",
      t1.start_time || '-' || t1.end_time AS "entry1Time",
      t2.id AS "entry2Id",
      t2.start_time || '-' || t2.end_time AS "entry2Time"
    FROM time_entries t1
    JOIN time_entries t2
      ON t1.user_id = t2.user_id
      AND t1.tenant_id = t2.tenant_id
      AND t1.date = t2.date
      AND t1.id < t2.id
    WHERE t1.start_time IS NOT NULL
      AND t1.end_time IS NOT NULL
      AND t2.start_time IS NOT NULL
      AND t2.end_time IS NOT NULL
      AND t1.start_time < t2.end_time
      AND t1.end_time > t2.start_time
    ORDER BY t1.tenant_id, t1.user_id, t1.date
  `);

  return result.rows;
}

async function auditDailyLimits(): Promise<DailyLimitViolation[]> {
  console.log("\n🔍 Auditing for daily limit violations (>24 hours)...");

  const result = await db.execute<DailyLimitViolation>(sql`
    SELECT
      tenant_id AS "tenantId",
      user_id AS "userId",
      date,
      SUM(CAST(hours AS DECIMAL)) AS "totalHours",
      COUNT(*) AS "entryCount"
    FROM time_entries
    GROUP BY tenant_id, user_id, date
    HAVING SUM(CAST(hours AS DECIMAL)) > 24
    ORDER BY "totalHours" DESC
  `);

  return result.rows;
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 TIMESHEET DATA AUDIT");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // Audit overlaps
    const overlaps = await auditOverlaps();

    if (overlaps.length === 0) {
      console.log("✅ No overlapping time entries found");
    } else {
      console.log(
        `❌ Found ${overlaps.length} overlapping time entry pairs:\n`,
      );
      overlaps.forEach((violation, index) => {
        console.log(`  ${index + 1}. Tenant: ${violation.tenantId}`);
        console.log(`     User: ${violation.userId}`);
        console.log(`     Date: ${violation.date}`);
        console.log(
          `     Entry 1: ${violation.entry1Id} (${violation.entry1Time})`,
        );
        console.log(
          `     Entry 2: ${violation.entry2Id} (${violation.entry2Time})`,
        );
        console.log("");
      });
    }

    // Audit daily limits
    const dailyLimitViolations = await auditDailyLimits();

    if (dailyLimitViolations.length === 0) {
      console.log("✅ No daily limit violations found (all days ≤24 hours)");
    } else {
      console.log(
        `❌ Found ${dailyLimitViolations.length} days exceeding 24-hour limit:\n`,
      );
      dailyLimitViolations.forEach((violation, index) => {
        console.log(`  ${index + 1}. Tenant: ${violation.tenantId}`);
        console.log(`     User: ${violation.userId}`);
        console.log(`     Date: ${violation.date}`);
        console.log(
          `     Total Hours: ${violation.totalHours} (${violation.entryCount} entries)`,
        );
        console.log("");
      });
    }

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Overlapping entries: ${overlaps.length}`);
    console.log(`Daily limit violations: ${dailyLimitViolations.length}`);

    if (overlaps.length === 0 && dailyLimitViolations.length === 0) {
      console.log("\n✅ All timesheet data is valid!");
    } else {
      console.log(
        "\n⚠️  Data cleanup required before triggers can be safely enabled",
      );
      console.log("   Contact your administrator to resolve violations");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(
      overlaps.length > 0 || dailyLimitViolations.length > 0 ? 1 : 0,
    );
  } catch (error) {
    console.error("\n❌ Audit failed:", error);
    process.exit(1);
  }
}

main();
