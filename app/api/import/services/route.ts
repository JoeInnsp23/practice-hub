/**
 * Service CSV Import API Route
 *
 * POST /api/import/services
 * - Handles CSV file upload for bulk service import
 * - Validates data and creates import log
 * - Supports dry-run mode for validation-only
 * - Checks for duplicate service codes
 */

import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { importLogs, services } from "@/lib/db/schema";
import { parseCsvFile } from "@/lib/services/csv-import";
import { serviceImportSchema } from "@/lib/validators/csv-import";

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
    const importLogId = crypto.randomUUID();
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

    // Check for duplicate service names in existing data (per story requirement: duplicate detection by tenant_id + name)
    const existingServices = await db
      .select()
      .from(services)
      .where(eq(services.tenantId, authContext.tenantId));

    const existingNames = new Set(
      existingServices.map((s) => s.name.toLowerCase()),
    );

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

          // Check for duplicate name (per story requirement: duplicate detection by tenant_id + name)
          const normalizedName = row.name.toLowerCase();
          if (existingNames.has(normalizedName)) {
            importErrors.push({
              row: rowNumber,
              field: "name",
              message: `Service name already exists: ${row.name}`,
              value: row.name,
            });
            skippedCount++;
            return null;
          }

          // Add to existing names to prevent duplicates within the import
          existingNames.add(normalizedName);

          return {
            id: crypto.randomUUID(),
            tenantId: authContext.tenantId,
            name: row.name,
            code: row.code,
            description: row.description || null,
            category: (row.category || "compliance") as
              | "compliance"
              | "vat"
              | "bookkeeping"
              | "payroll"
              | "management"
              | "secretarial"
              | "tax_planning"
              | "addon",
            pricingModel: "turnover" as "turnover" | "transaction" | "both",
            basePrice: row.price?.toString() || null, // Add basePrice to match schema
            price: row.price?.toString() || null,
            priceType: (row.price_type || "fixed") as any,
            defaultRate: row.price?.toString() || null, // Use price as default rate
            duration: row.estimated_hours
              ? Math.round(row.estimated_hours * 60)
              : null, // Convert hours to minutes
            supportsComplexity: false,
            tags: null, // Add tags field to match schema
            isActive: row.is_active !== false,
            metadata: row.notes
              ? {
                  notes: row.notes,
                  ...(row.is_taxable !== undefined && {
                    is_taxable: row.is_taxable,
                  }),
                  ...(row.tax_rate && { tax_rate: row.tax_rate }),
                }
              : null,
          };
        })
        .filter(
          (service): service is NonNullable<typeof service> => service !== null,
        );

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
