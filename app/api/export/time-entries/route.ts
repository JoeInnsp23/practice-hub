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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const clientId = searchParams.get("clientId");

    // Build query
    let query = sql`
      SELECT
        te.date,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        c.name as client_name,
        c.client_code,
        t.title as task_title,
        s.name as service_name,
        te.description,
        te.hours,
        te.work_type,
        te.billable,
        te.billed,
        te.rate,
        te.amount,
        te.status,
        CONCAT(a.first_name, ' ', a.last_name) as approved_by,
        te.approved_at,
        te.notes,
        te.created_at
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      LEFT JOIN clients c ON te.client_id = c.id
      LEFT JOIN tasks t ON te.task_id = t.id
      LEFT JOIN services s ON te.service_id = s.id
      LEFT JOIN users a ON te.approved_by_id = a.id
      WHERE te.tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (startDate) {
      conditions.push(sql`te.date >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`te.date <= ${endDate}`);
    }
    if (userId) {
      conditions.push(sql`te.user_id = ${userId}`);
    }
    if (clientId) {
      conditions.push(sql`te.client_id = ${clientId}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY te.date DESC, te.created_at DESC`;

    const result = await db.execute(query);
    const entries = result.rows;

    // Calculate totals
    const totals = {
      totalHours: 0,
      billableHours: 0,
      totalAmount: 0,
    };

    // Format the data
    const exportData = entries.map((entry: any) => {
      const hours = parseFloat(entry.hours || 0);
      const amount = parseFloat(entry.amount || 0);

      totals.totalHours += hours;
      if (entry.billable) {
        totals.billableHours += hours;
        totals.totalAmount += amount;
      }

      return {
        "Date": entry.date,
        "User": entry.user_name || "",
        "Client": entry.client_name || "",
        "Client Code": entry.client_code || "",
        "Task": entry.task_title || "",
        "Service": entry.service_name || "",
        "Description": entry.description || "",
        "Hours": hours.toFixed(2),
        "Work Type": entry.work_type || "",
        "Billable": entry.billable ? "Yes" : "No",
        "Billed": entry.billed ? "Yes" : "No",
        "Rate": entry.rate || "",
        "Amount": amount.toFixed(2),
        "Status": entry.status || "",
        "Approved By": entry.approved_by || "",
        "Approved Date": entry.approved_at ? new Date(entry.approved_at).toLocaleDateString() : "",
        "Notes": entry.notes || "",
      };
    });

    // Add summary row
    if (exportData.length > 0) {
      exportData.push({
        "Date": "TOTAL",
        "User": "",
        "Client": "",
        "Client Code": "",
        "Task": "",
        "Service": "",
        "Description": `Total Hours: ${totals.totalHours.toFixed(2)}, Billable: ${totals.billableHours.toFixed(2)}`,
        "Hours": totals.totalHours.toFixed(2),
        "Work Type": "",
        "Billable": "",
        "Billed": "",
        "Rate": "",
        "Amount": totals.totalAmount.toFixed(2),
        "Status": "",
        "Approved By": "",
        "Approved Date": "",
        "Notes": "",
      });
    }

    if (format === "json") {
      // Return JSON with summary
      return new NextResponse(
        JSON.stringify({
          entries: exportData.slice(0, -1), // Exclude summary row from JSON
          summary: totals,
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="time_entries_export_${Date.now()}.json"`,
          },
        }
      );
    } else {
      // Return CSV
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="time_entries_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export API: Failed to export time entries", error);
    return NextResponse.json(
      { error: "Failed to export time entries" },
      { status: 500 }
    );
  }
}