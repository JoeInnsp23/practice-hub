/**
 * Client CSV Import API Route
 *
 * POST /api/import/clients
 * - Handles CSV file upload for bulk client import
 * - Validates data and creates import log
 * - Supports dry-run mode for validation-only
 */

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, importLogs } from "@/lib/db/schema";
import { parseCsvFile } from "@/lib/services/csv-import";
import { clientImportSchema } from "@/lib/validators/csv-import";

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
    const parseResult = await parseCsvFile(file, clientImportSchema);

    // Create import log
    const importLogId = crypto.randomUUID();
    await db.insert(importLogs).values({
      id: importLogId,
      tenantId: authContext.tenantId,
      entityType: "clients",
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

    // Import clients in batches
    let processedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      const batch = parseResult.data.slice(i, i + batchSize);

      // Prepare client data for insertion
      const clientsData = batch.map((row) => ({
        id: crypto.randomUUID(),
        tenantId: authContext.tenantId,
        name: row.name,
        type: "company" as const,
        email: row.email || null,
        phone: row.phone || null,
        website: row.website || null,
        addressLine1: row.address_line1 || null,
        addressLine2: row.address_line2 || null,
        city: row.city || null,
        county: row.county || null,
        postalCode: row.postal_code || null,
        country: row.country || "United Kingdom",
        clientType: row.client_type || "company",
        companyNumber: row.company_number || null,
        vatNumber: row.vat_number || null,
        utrNumber: row.utr_number || null,
        turnover: row.turnover?.toString() || null,
        employeeCount: row.employee_count || null,
        status: row.status || "active",
        notes: row.notes || null,
        // Auto-generate client code
        clientCode: `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      }));

      // Insert batch
      await db.insert(clients).values(clientsData);
      processedCount += clientsData.length;

      // Update progress
      await db
        .update(importLogs)
        .set({
          processedRows: processedCount,
        })
        .where(eq(importLogs.id, importLogId));
    }

    // Mark import as completed
    await db
      .update(importLogs)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(importLogs.id, importLogId));

    return NextResponse.json({
      success: true,
      importLogId,
      summary: {
        totalRows: parseResult.meta.totalRows,
        processedRows: processedCount,
        failedRows: parseResult.errors.length,
        skippedRows: parseResult.meta.skippedRows,
      },
      errors: parseResult.errors,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "importClients" },
    });

    console.error("[Client Import] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
}
