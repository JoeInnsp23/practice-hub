/**
 * Task CSV Import API Route
 *
 * POST /api/import/tasks
 * - Handles CSV file upload for bulk task import
 * - Validates data and creates import log
 * - Supports dry-run mode for validation-only
 * - Looks up clients by client_code and users by email
 */

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, importLogs, tasks, users } from "@/lib/db/schema";
import { parseCsvFile } from "@/lib/services/csv-import";
import { taskImportSchema } from "@/lib/validators/csv-import";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a CSV file." },
        { status: 400 },
      );
    }

    // Parse and validate CSV
    const parseResult = await parseCsvFile(file, taskImportSchema);

    // Create import log
    const importLogId = nanoid();
    await db.insert(importLogs).values({
      id: importLogId,
      tenantId: authContext.tenantId,
      entityType: "tasks",
      fileName: file.name,
      status: dryRun ? "completed" : "pending",
      totalRows: parseResult.meta.totalRows,
      processedRows: 0,
      failedRows: parseResult.errors.length,
      skippedRows: parseResult.meta.skippedRows,
      errors: parseResult.errors,
      dryRun,
      importedBy: authContext.userId,
      startedAt: new Date(),
      completedAt: dryRun ? new Date() : null,
    });

    // If dry run, return validation results without importing
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        importLogId,
        summary: {
          totalRows: parseResult.meta.totalRows,
          validRows: parseResult.meta.validRows,
          invalidRows: parseResult.meta.invalidRows,
          skippedRows: parseResult.meta.skippedRows,
        },
        errors: parseResult.errors,
      });
    }

    // If no valid data, return error
    if (parseResult.data.length === 0) {
      await db
        .update(importLogs)
        .set({
          status: "failed",
          completedAt: new Date(),
        })
        .where(eq(importLogs.id, importLogId));

      return NextResponse.json({
        success: false,
        importLogId,
        message: "No valid rows to import",
        errors: parseResult.errors,
      });
    }

    // Pre-fetch clients and users for lookup
    const tenantClients = await db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, authContext.tenantId));

    const tenantUsers = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, authContext.tenantId));

    const clientLookup = new Map(
      tenantClients.map((c) => [c.clientCode, c.id]),
    );
    const userLookup = new Map(
      tenantUsers.map((u) => [u.email.toLowerCase(), u.id]),
    );

    // Import tasks in batches
    let processedCount = 0;
    let failedCount = 0;
    const importErrors = [...parseResult.errors];
    const batchSize = 50;

    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      const batch = parseResult.data.slice(i, i + batchSize);

      // Prepare task data for insertion
      const tasksData = batch
        .map((row, batchIndex) => {
          const rowNumber = i + batchIndex + 2;

          // Look up client ID
          const clientId = clientLookup.get(row.client_code);
          if (!clientId) {
            importErrors.push({
              row: rowNumber,
              field: "client_code",
              message: `Client not found: ${row.client_code}`,
              value: row.client_code,
            });
            failedCount++;
            return null;
          }

          // Look up assigned user
          let assignedToId: string | null = null;
          if (row.assigned_to_email) {
            assignedToId =
              userLookup.get(row.assigned_to_email.toLowerCase()) || null;
            if (!assignedToId) {
              importErrors.push({
                row: rowNumber,
                field: "assigned_to_email",
                message: `User not found: ${row.assigned_to_email}`,
                value: row.assigned_to_email,
              });
            }
          }

          // Look up reviewer
          let reviewerId: string | null = null;
          if (row.reviewer_email) {
            reviewerId =
              userLookup.get(row.reviewer_email.toLowerCase()) || null;
            if (!reviewerId) {
              importErrors.push({
                row: rowNumber,
                field: "reviewer_email",
                message: `Reviewer not found: ${row.reviewer_email}`,
                value: row.reviewer_email,
              });
            }
          }

          return {
            id: nanoid(),
            tenantId: authContext.tenantId,
            clientId,
            title: row.title,
            description: row.description || null,
            status: row.status || "pending",
            priority: row.priority || "medium",
            dueDate: row.due_date || null,
            startDate: row.start_date || null,
            assignedToId: assignedToId || authContext.userId,
            reviewerId,
            estimatedHours: row.estimated_hours?.toString() || null,
            actualHours: row.actual_hours?.toString() || null,
            taskType: row.task_type || null,
            notes: row.notes || null,
            createdById: authContext.userId,
          };
        })
        .filter((task) => task !== null);

      // Insert batch
      if (tasksData.length > 0) {
        await db.insert(tasks).values(tasksData);
        processedCount += tasksData.length;
      }

      // Update progress
      await db
        .update(importLogs)
        .set({
          processedRows: processedCount,
          failedRows: failedCount,
          errors: importErrors,
        })
        .where(eq(importLogs.id, importLogId));
    }

    // Mark import as completed
    await db
      .update(importLogs)
      .set({
        status: processedCount > 0 ? "completed" : "failed",
        completedAt: new Date(),
      })
      .where(eq(importLogs.id, importLogId));

    return NextResponse.json({
      success: true,
      importLogId,
      summary: {
        totalRows: parseResult.meta.totalRows,
        processedRows: processedCount,
        failedRows: failedCount,
        skippedRows: parseResult.meta.skippedRows,
      },
      errors: importErrors,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "importTasks" },
    });

    console.error("[Task Import] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
}
