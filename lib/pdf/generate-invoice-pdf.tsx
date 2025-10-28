import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoiceItems, invoices } from "@/lib/db/schema";
import { uploadToS3 } from "@/lib/storage/s3";
import {
  type InvoiceData,
  InvoiceDocument,
  type InvoiceLineItem,
} from "./invoice-template";

export interface GenerateInvoicePdfOptions {
  invoiceId: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
}

export interface GenerateInvoicePdfResult {
  pdfUrl: string;
  fileName: string;
}

/**
 * Generate a PDF for an invoice and upload it to S3
 * @param options - Configuration options
 * @returns Public URL of the generated PDF
 */
export async function generateInvoicePdf(
  options: GenerateInvoicePdfOptions,
): Promise<GenerateInvoicePdfResult> {
  const { invoiceId, companyName, companyAddress, companyEmail, companyPhone } =
    options;

  try {
    // 1. Fetch invoice data from database with client information
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        clientName: clients.name,
        clientEmail: clients.email,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        status: invoices.status,
        subtotal: invoices.subtotal,
        taxRate: invoices.taxRate,
        taxAmount: invoices.taxAmount,
        discount: invoices.discount,
        total: invoices.total,
        amountPaid: invoices.amountPaid,
        currency: invoices.currency,
        notes: invoices.notes,
        terms: invoices.terms,
        purchaseOrderNumber: invoices.purchaseOrderNumber,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    // 2. Fetch invoice line items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(invoiceItems.sortOrder);

    // 3. Transform data for PDF template
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidDate: invoice.paidDate,
      status: invoice.status,
      subtotal: invoice.subtotal || "0.00",
      taxRate: invoice.taxRate || "0.00",
      taxAmount: invoice.taxAmount || "0.00",
      discount: invoice.discount || "0.00",
      total: invoice.total || "0.00",
      amountPaid: invoice.amountPaid || "0.00",
      currency: invoice.currency,
      notes: invoice.notes,
      terms: invoice.terms,
      purchaseOrderNumber: invoice.purchaseOrderNumber,
    };

    const lineItemsData: InvoiceLineItem[] = items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    }));

    // 4. Render PDF to buffer
    console.log("Rendering PDF for invoice:", invoiceId);
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument
        invoice={invoiceData}
        lineItems={lineItemsData}
        companyName={companyName}
        companyAddress={companyAddress}
        companyEmail={companyEmail}
        companyPhone={companyPhone}
      />,
    );

    // 5. Generate unique filename
    const timestamp = Date.now();
    const fileName = `invoices/${invoiceId}/invoice-${invoice.invoiceNumber}-${timestamp}.pdf`;

    // 6. Upload to S3
    console.log("Uploading PDF to S3:", fileName);
    const pdfUrl = await uploadToS3({
      fileName,
      buffer: Buffer.from(pdfBuffer),
      contentType: "application/pdf",
      metadata: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        generatedAt: new Date().toISOString(),
      },
    });

    // 7. Update invoice record with PDF URL
    // Note: Invoice schema doesn't have pdfUrl field yet
    // If needed, add it to schema: pdfUrl: text("pdf_url")
    // For now, we'll just return the URL without updating the record
    console.log("PDF generated successfully:", pdfUrl);

    return {
      pdfUrl,
      fileName,
    };
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
