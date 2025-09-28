import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, invoiceItems } from "@/lib/db/schema";
import { getAuthContext } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    // Use invoice details view
    let query = sql`
      SELECT * FROM invoice_details_view
      WHERE tenant_id = ${authContext.tenantId}
    `;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(sql`status = ${status}`);
    }
    if (clientId) {
      conditions.push(sql`client_id = ${clientId}`);
    }

    if (conditions.length > 0) {
      query = sql`
        SELECT * FROM invoice_details_view
        WHERE tenant_id = ${authContext.tenantId}
          AND ${sql.join(conditions, sql` AND `)}
      `;
    }

    query = sql`${query} ORDER BY issue_date DESC, invoice_number DESC`;

    const result = await db.execute(query);

    const invoicesList = result.rows.map((invoice: any) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      clientId: invoice.client_id,
      clientName: invoice.client_name,
      clientCode: invoice.client_code,
      clientEmail: invoice.client_email,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paidDate: invoice.paid_date,
      subtotal: Number(invoice.subtotal || 0),
      taxRate: Number(invoice.tax_rate || 0),
      taxAmount: Number(invoice.tax_amount || 0),
      discount: Number(invoice.discount || 0),
      total: Number(invoice.total || 0),
      amountPaid: Number(invoice.amount_paid || 0),
      balanceDue: Number(invoice.balance_due || 0),
      status: invoice.status,
      currency: invoice.currency || "GBP",
      notes: invoice.notes,
      terms: invoice.terms,
      createdAt: invoice.created_at
    }));

    return NextResponse.json({ invoices: invoicesList });
  } catch (error) {
    console.error("Invoices API: Failed to fetch invoices", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.clientId || !body.issueDate || !body.dueDate || !body.items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      // Generate invoice number (simplified - in production, use a sequence)
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

      // Calculate totals
      let subtotal = 0;
      body.items.forEach((item: any) => {
        subtotal += item.quantity * item.rate;
      });

      const taxAmount = (subtotal * (body.taxRate || 0)) / 100;
      const total = subtotal + taxAmount - (body.discount || 0);

      // Create invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          tenantId: authContext.tenantId,
          invoiceNumber,
          clientId: body.clientId,
          issueDate: body.issueDate,
          dueDate: body.dueDate,
          subtotal: subtotal.toString(),
          taxRate: (body.taxRate || 0).toString(),
          taxAmount: taxAmount.toString(),
          discount: (body.discount || 0).toString(),
          total: total.toString(),
          amountPaid: "0",
          status: body.status || "draft",
          currency: body.currency || "GBP",
          notes: body.notes,
          terms: body.terms,
          purchaseOrderNumber: body.poNumber,
          createdById: authContext.userId
        })
        .returning();

      // Create invoice items
      for (const item of body.items) {
        await tx.insert(invoiceItems).values({
          invoiceId: newInvoice.id,
          description: item.description,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          amount: (item.quantity * item.rate).toString(),
          serviceId: item.serviceId,
          timeEntryId: item.timeEntryId,
          sortOrder: item.sortOrder || 0
        });
      }

      return newInvoice;
    });

    return NextResponse.json({ success: true, invoice: result });
  } catch (error) {
    console.error("Invoices API: Failed to create invoice", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}