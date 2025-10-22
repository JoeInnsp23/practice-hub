/**
 * Service CSV Import API Route
 *
 * POST /api/import/services
 * - Handles CSV file upload for bulk service import
 * - Validates data and creates import log
 * - Supports dry-run mode for validation-only
 * - Checks for duplicate service codes
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, importLogs } from "@/lib/db/schema";
import { parseCsvFile } from "@/lib/services/csv-import";
import { serviceImportSchema } from "@/lib/validators/csv-import";
import { getAuthContext } from "@/lib/auth";
import { nanoid } from "nanoid";
import * as Sentry from "@sentry/nextjs";

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
    const parseResult = await parseCsvFile(file, serviceImportSchema);

    // Create import log
    const importLogId = nanoid();
    await db.insert(importLogs).values({
      id: importLogId,
      tenantId: authContext.tenantId,
      entityType: "services",
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

    // Check for duplicate service codes in existing data
    const existingServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, authContext.tenantId));

    const existingCodes = new Set(existingServices.map((s) => s.code));

    // Import services in batches
    let processedCount = 0;
    let skippedCount = 0;
    const importErrors = [...parseResult.errors];
    const batchSize = 50;

    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      const batch = parseResult.data.slice(i, i + batchSize);

      // Prepare service data for insertion
      const servicesData = batch
        .map((row, batchIndex) => {
          const rowNumber = i + batchIndex + 2;

          // Check for duplicate code
          if (existingCodes.has(row.code)) {
            importErrors.push({
              row: rowNumber,
              field: "code",
              message: `Service code already exists: ${row.code}`,
              value: row.code,
            });
            skippedCount++;
            return null;
          }

          // Add to existing codes to prevent duplicates within the import
          existingCodes.add(row.code);

          return {
            id: nanoid(),
            tenantId: authContext.tenantId,
            name: row.name,
            code: row.code,
            description: row.description || null,
            category: row.category || null,
            price: row.price?.toString() || null,
            priceType: row.price_type || "fixed",
            estimatedHours: row.estimated_hours?.toString() || null,
            isActive: row.is_active !== undefined ? row.is_active : true,
            isTaxable: row.is_taxable !== undefined ? row.is_taxable : true,
            taxRate: row.tax_rate?.toString() || "20",
            notes: row.notes || null,
          };
        })
        .filter((service) => service !== null);

      // Insert batch
      if (servicesData.length > 0) {
        await db.insert(services).values(servicesData);
        processedCount += servicesData.length;
      }

      // Update progress
      await db
        .update(importLogs)
        .set({
          processedRows: processedCount,
          skippedRows: skippedCount,
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
        failedRows: parseResult.errors.length,
        skippedRows: skippedCount + parseResult.meta.skippedRows,
      },
      errors: importErrors,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "importServices" },
    });

    console.error("[Service Import] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Import failed",
      },
      { status: 500 },
    );
  }
}
