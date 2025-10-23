import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Client CSV Template
// Defines the structure for bulk client import
export async function GET() {
  try {
    // Require authentication
    await requireAuth();

    // Define CSV headers
    const headers = [
      "company_name",
      "client_code",
      "email",
      "phone",
      "vat_number",
      "companies_house_number",
      "client_type",
      "status",
      "street_address",
      "city",
      "postcode",
      "country",
      "client_manager_email",
    ];

    // Define example row with sample data
    const exampleRow = [
      "Example Ltd",
      "CL-001",
      "contact@example.com",
      "020 1234 5678",
      "GB123456789",
      "12345678",
      "company",
      "active",
      "123 High Street",
      "London",
      "SW1A 1AA",
      "United Kingdom",
      "manager@youraccount.com",
    ];

    // Define field descriptions (as a comment row)
    const descriptions = [
      "Company or individual name (required)",
      "Unique code (leave blank to auto-generate)",
      "Primary email address (required)",
      "Contact phone number (optional)",
      "UK VAT number format: GB + 9-12 digits (optional)",
      "Companies House registration (8 characters, optional)",
      "Type: individual, company, partnership, or trust (required)",
      "Status: lead, prospect, active, or inactive (defaults to active)",
      "Street address (optional)",
      "City or town (optional)",
      "Postal code (optional)",
      "Country (defaults to United Kingdom)",
      "Email of assigned manager (must exist in your account)",
    ];

    // Build CSV content
    const csvRows = [
      headers.join(","),
      exampleRow.map((field) => `"${field}"`).join(","),
      descriptions.map((desc) => `"${desc}"`).join(","),
    ];

    const csvContent = csvRows.join("\n");

    // Return CSV file response
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="client-import-template.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating client CSV template:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV template" },
      { status: 500 },
    );
  }
}
