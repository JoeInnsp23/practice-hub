import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, activityLogs } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import Papa from "papaparse";

interface ImportRow {
  "Client Code"?: string;
  "Name": string;
  "Type": string;
  "Status"?: string;
  "Email"?: string;
  "Phone"?: string;
  "Website"?: string;
  "VAT Number"?: string;
  "Registration Number"?: string;
  "Address Line 1"?: string;
  "Address Line 2"?: string;
  "City"?: string;
  "State"?: string;
  "Postal Code"?: string;
  "Country"?: string;
  "Year End"?: string;
  "Notes"?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  data?: any;
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const dryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<ImportRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        {
          error: "CSV parsing failed",
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    const rows = parseResult.data;
    const errors: ImportError[] = [];
    const successful: any[] = [];
    const skipped: any[] = [];

    // Validate and process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row

      // Validate required fields
      if (!row.Name) {
        errors.push({
          row: rowNumber,
          field: "Name",
          message: "Name is required",
          data: row,
        });
        continue;
      }

      if (!row.Type) {
        errors.push({
          row: rowNumber,
          field: "Type",
          message: "Type is required",
          data: row,
        });
        continue;
      }

      // Validate type enum
      const validTypes = ["individual", "company", "trust", "partnership"];
      if (!validTypes.includes(row.Type.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: "Type",
          message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
          data: row,
        });
        continue;
      }

      // Validate status enum if provided
      const validStatuses = ["active", "inactive", "prospect", "archived"];
      if (row.Status && !validStatuses.includes(row.Status.toLowerCase())) {
        errors.push({
          row: rowNumber,
          field: "Status",
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          data: row,
        });
        continue;
      }

      // Check for duplicate client code if provided
      if (row["Client Code"]) {
        const existing = await db
          .select()
          .from(clients)
          .where(
            and(
              eq(clients.tenantId, authContext.tenantId),
              eq(clients.clientCode, row["Client Code"])
            )
          )
          .limit(1);

        if (existing.length > 0) {
          skipped.push({
            row: rowNumber,
            reason: `Client code "${row["Client Code"]}" already exists`,
            data: row,
          });
          continue;
        }
      }

      // Prepare client data
      const clientData = {
        tenantId: authContext.tenantId,
        clientCode: row["Client Code"] || `CLI-${Date.now()}-${i}`,
        name: row.Name.trim(),
        type: row.Type.toLowerCase() as any,
        status: (row.Status?.toLowerCase() || "active") as any,
        email: row.Email?.trim() || null,
        phone: row.Phone?.trim() || null,
        website: row.Website?.trim() || null,
        vatNumber: row["VAT Number"]?.trim() || null,
        registrationNumber: row["Registration Number"]?.trim() || null,
        addressLine1: row["Address Line 1"]?.trim() || null,
        addressLine2: row["Address Line 2"]?.trim() || null,
        city: row.City?.trim() || null,
        state: row.State?.trim() || null,
        postalCode: row["Postal Code"]?.trim() || null,
        country: row.Country?.trim() || null,
        yearEnd: row["Year End"]?.trim() || null,
        notes: row.Notes?.trim() || null,
        accountManagerId: authContext.userId,
        createdBy: authContext.userId,
      };

      if (!dryRun) {
        try {
          // Create the client
          const [newClient] = await db
            .insert(clients)
            .values(clientData)
            .returning();

          // Log the activity
          await db.insert(activityLogs).values({
            tenantId: authContext.tenantId,
            entityType: "client",
            entityId: newClient.id,
            action: "imported",
            description: `Imported client "${clientData.name}" via CSV`,
            userId: authContext.userId,
            userName: `${authContext.firstName} ${authContext.lastName}`,
            metadata: { source: "csv_import", row: rowNumber },
          });

          successful.push({
            row: rowNumber,
            client: newClient,
          });
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            field: "database",
            message: error.message || "Failed to create client",
            data: row,
          });
        }
      } else {
        // Dry run - just validate
        successful.push({
          row: rowNumber,
          client: clientData,
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: errors.length === 0,
      dryRun,
      summary: {
        total: rows.length,
        successful: successful.length,
        failed: errors.length,
        skipped: skipped.length,
      },
      successful: successful.slice(0, 10), // Limit response size
      errors,
      skipped,
    });
  } catch (error) {
    console.error("Import API: Failed to import clients", error);
    return NextResponse.json(
      { error: "Failed to import clients" },
      { status: 500 }
    );
  }
}

// Provide template for download
export async function GET(req: NextRequest) {
  const template = Papa.unparse([
    {
      "Client Code": "CLI-0001",
      "Name": "John Smith",
      "Type": "individual",
      "Status": "active",
      "Email": "john@example.com",
      "Phone": "020 1234 5678",
      "Website": "",
      "VAT Number": "",
      "Registration Number": "",
      "Address Line 1": "123 Main Street",
      "Address Line 2": "",
      "City": "London",
      "State": "",
      "Postal Code": "SW1A 1AA",
      "Country": "United Kingdom",
      "Year End": "03-31",
      "Notes": "Example client",
    },
    {
      "Client Code": "CLI-0002",
      "Name": "ABC Company Ltd",
      "Type": "company",
      "Status": "active",
      "Email": "info@abccompany.com",
      "Phone": "020 9876 5432",
      "Website": "https://abccompany.com",
      "VAT Number": "GB123456789",
      "Registration Number": "12345678",
      "Address Line 1": "456 Business Park",
      "Address Line 2": "Suite 200",
      "City": "Manchester",
      "State": "",
      "Postal Code": "M1 1AA",
      "Country": "United Kingdom",
      "Year End": "12-31",
      "Notes": "Example company",
    },
  ]);

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="client_import_template.csv"',
    },
  });
}