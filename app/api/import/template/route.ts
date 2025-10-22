/**
 * CSV Template Generation API Route
 *
 * GET /api/import/template?type=clients|tasks|services
 * - Generates downloadable CSV templates with headers and example data
 * - Returns CSV file with proper content-type headers
 */

import { type NextRequest, NextResponse } from "next/server";
import { generateCsvTemplate } from "@/lib/services/csv-import";
import {
  CLIENT_CSV_FIELDS,
  TASK_CSV_FIELDS,
  SERVICE_CSV_FIELDS,
  CLIENT_EXAMPLE_DATA,
  TASK_EXAMPLE_DATA,
  SERVICE_EXAMPLE_DATA,
} from "@/lib/validators/csv-import";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const includeExample = searchParams.get("example") === "true";

    if (!type) {
      return NextResponse.json(
        { error: "Missing required parameter: type" },
        { status: 400 },
      );
    }

    let csvContent: string;
    let filename: string;

    switch (type) {
      case "clients":
        csvContent = generateCsvTemplate(
          CLIENT_CSV_FIELDS,
          includeExample,
          includeExample ? CLIENT_EXAMPLE_DATA : undefined,
        );
        filename = "clients_import_template.csv";
        break;

      case "tasks":
        csvContent = generateCsvTemplate(
          TASK_CSV_FIELDS,
          includeExample,
          includeExample ? TASK_EXAMPLE_DATA : undefined,
        );
        filename = "tasks_import_template.csv";
        break;

      case "services":
        csvContent = generateCsvTemplate(
          SERVICE_CSV_FIELDS,
          includeExample,
          includeExample ? SERVICE_EXAMPLE_DATA : undefined,
        );
        filename = "services_import_template.csv";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type. Must be one of: clients, tasks, services" },
          { status: 400 },
        );
    }

    // Return CSV file with proper headers
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Template Generation] Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Template generation failed",
      },
      { status: 500 },
    );
  }
}
