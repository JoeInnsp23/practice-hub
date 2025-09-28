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
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let query = sql`
      SELECT
        i.invoice_number,
        i.date,
        i.due_date,
        c.name as client_name,
        c.client_code,
        i.status,
        i.currency,
        i.subtotal,
        i.tax_rate,
        i.tax_amount,
        i.discount_amount,
        i.total_amount,
        i.amount_paid,
        i.payment_method,
        i.payment_date,
        i.description,
        i.terms,
        i.notes,
        i.created_at
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.tenant_id = ${authContext.tenantId}
    `;

    // Add filters
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(sql`i.status = ${status}`);
    }
    if (clientId) {
      conditions.push(sql`i.client_id = ${clientId}`);
    }
    if (startDate) {
      conditions.push(sql`i.date >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`i.date <= ${endDate}`);
    }

    if (conditions.length > 0) {
      query = sql`${query} AND ${sql.join(conditions, sql` AND `)}`;
    }

    query = sql`${query} ORDER BY i.date DESC, i.created_at DESC`;

    const result = await db.execute(query);
    const invoices = result.rows;

    // Calculate totals
    const totals = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };

    // Format the data
    const exportData = invoices.map((invoice: any) => {
      const totalAmount = parseFloat(invoice.total_amount || 0);
      const amountPaid = parseFloat(invoice.amount_paid || 0);

      totals.totalInvoiced += totalAmount;
      totals.totalPaid += amountPaid;
      totals.totalOutstanding += totalAmount - amountPaid;

      return {
        "Invoice Number": invoice.invoice_number,
        "Date": invoice.date,
        "Due Date": invoice.due_date || "",
        "Client": invoice.client_name || "",
        "Client Code": invoice.client_code || "",
        "Status": invoice.status,
        "Currency": invoice.currency || "GBP",
        "Subtotal": parseFloat(invoice.subtotal || 0).toFixed(2),
        "Tax Rate %": invoice.tax_rate || "0",
        "Tax Amount": parseFloat(invoice.tax_amount || 0).toFixed(2),
        "Discount": parseFloat(invoice.discount_amount || 0).toFixed(2),
        "Total Amount": totalAmount.toFixed(2),
        "Amount Paid": amountPaid.toFixed(2),
        "Outstanding": (totalAmount - amountPaid).toFixed(2),
        "Payment Method": invoice.payment_method || "",
        "Payment Date": invoice.payment_date || "",
        "Description": invoice.description || "",
        "Terms": invoice.terms || "",
        "Notes": invoice.notes || "",
        "Created Date": invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "",
      };
    });

    // Add summary row
    if (exportData.length > 0 && format === "csv") {
      exportData.push({
        "Invoice Number": "TOTALS",
        "Date": "",
        "Due Date": "",
        "Client": "",
        "Client Code": "",
        "Status": "",
        "Currency": "",
        "Subtotal": "",
        "Tax Rate %": "",
        "Tax Amount": "",
        "Discount": "",
        "Total Amount": totals.totalInvoiced.toFixed(2),
        "Amount Paid": totals.totalPaid.toFixed(2),
        "Outstanding": totals.totalOutstanding.toFixed(2),
        "Payment Method": "",
        "Payment Date": "",
        "Description": `Total Invoices: ${invoices.length}`,
        "Terms": "",
        "Notes": "",
        "Created Date": "",
      });
    }

    if (format === "json") {
      // Return JSON with summary
      return new NextResponse(
        JSON.stringify({
          invoices: exportData.slice(0, -1), // Exclude summary row from JSON
          summary: totals,
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="invoices_export_${Date.now()}.json"`,
          },
        }
      );
    } else {
      // Return CSV
      const csv = Papa.unparse(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="invoices_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Export API: Failed to export invoices", error);
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    );
  }
}