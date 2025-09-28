import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthContext } from "@/lib/auth";
import { sql } from "drizzle-orm";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build query
    let query = sql`
      SELECT
        c.client_code,
        c.name,
        c.type,
        c.status,
        c.email,
        c.phone,
        c.website,
        c.vat_number,
        c.registration_number,
        c.address_line1,
        c.address_line2,
        c.city,
        c.state,
        c.postal_code,
        c.country,
        CONCAT(u.first_name, ' ', u.last_name) as account_manager,
        c.incorporation_date,
        c.year_end,
        c.notes,
        c.created_at
      FROM clients c
      LEFT JOIN users u ON c.account_manager_id = u.id
      WHERE c.tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(sql`c.status = ${status}`);
    }
    if (type && type !== "all") {
      conditions.push(sql`c.type = ${type}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY c.created_at DESC`;

    const result = await db.execute(query);
    const clients = result.rows;

    // Format the data
    const exportData = clients.map((client: any) => ({
      "Client Code": client.client_code,
      "Name": client.name,
      "Type": client.type,
      "Status": client.status,
      "Email": client.email || "",
      "Phone": client.phone || "",
      "Website": client.website || "",
      "VAT Number": client.vat_number || "",
      "Registration Number": client.registration_number || "",
      "Address Line 1": client.address_line1 || "",
      "Address Line 2": client.address_line2 || "",
      "City": client.city || "",
      "State": client.state || "",
      "Postal Code": client.postal_code || "",
      "Country": client.country || "",
      "Account Manager": client.account_manager || "",
      "Incorporation Date": client.incorporation_date || "",
      "Year End": client.year_end || "",
      "Notes": client.notes || "",
      "Created Date": client.created_at ? new Date(client.created_at).toLocaleDateString() : "",
    }));

    if (format === "json") {
      // Return JSON
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="clients_export_${Date.now()}.json"`,
        },
      });
    } else {
      // Return CSV
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="clients_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export API: Failed to export clients", error);
    return NextResponse.json(
      { error: "Failed to export clients" },
      { status: 500 }
    );
  }
}