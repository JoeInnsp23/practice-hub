import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Professional invoice color scheme
const COLORS = {
  primary: "#2563eb", // Blue
  text: "#000000",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.white,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: `2px solid ${COLORS.primary}`,
  },
  companySection: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },

  // Invoice title and number
  invoiceTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 5,
  },

  // Invoice info section
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },

  // Line items table
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    padding: 10,
    borderBottom: `2px solid ${COLORS.border}`,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  tableCol1: { width: "50%", fontSize: 9 },
  tableCol2: { width: "15%", fontSize: 9, textAlign: "right" },
  tableCol3: { width: "15%", fontSize: 9, textAlign: "right" },
  tableCol4: { width: "20%", fontSize: 9, textAlign: "right" },

  // Totals section
  totalsSection: {
    marginLeft: "auto",
    width: "40%",
    marginTop: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 10,
    color: COLORS.text,
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "bold",
  },

  // Payment status badge
  statusBadge: {
    padding: "6px 12px",
    borderRadius: 4,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  statusPaid: {
    backgroundColor: COLORS.success,
    color: COLORS.white,
  },
  statusOverdue: {
    backgroundColor: COLORS.danger,
    color: COLORS.white,
  },
  statusPending: {
    backgroundColor: COLORS.warning,
    color: COLORS.white,
  },

  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: `1px solid ${COLORS.border}`,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    marginBottom: 5,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.background,
    borderLeft: `3px solid ${COLORS.primary}`,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
});

export interface InvoiceLineItem {
  description: string;
  quantity: string; // decimal as string
  rate: string; // decimal as string
  amount: string; // decimal as string
}

export interface InvoiceData {
  invoiceNumber: string;
  clientName: string | null;
  clientEmail: string | null;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  status: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  discount: string;
  total: string;
  amountPaid: string;
  currency: string | null;
  notes?: string | null;
  terms?: string | null;
  purchaseOrderNumber?: string | null;
}

export interface InvoiceDocumentProps {
  invoice: InvoiceData;
  lineItems: InvoiceLineItem[];
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
}

/**
 * Professional Invoice PDF Template
 * Generates a clean, business-ready invoice document
 */
export const InvoiceDocument = ({
  invoice,
  lineItems,
  companyName = "Innspired Accountancy",
  companyAddress,
  companyEmail = "accounts@innspired.co.uk",
  companyPhone,
}: InvoiceDocumentProps) => {
  // Format currency
  const formatCurrency = (amount: string) => {
    const num = Number.parseFloat(amount);
    return `${invoice.currency || "GBP"} ${num.toFixed(2)}`;
  };

  // Calculate balance due
  const balanceDue = (
    Number.parseFloat(invoice.total) - Number.parseFloat(invoice.amountPaid)
  ).toFixed(2);

  // Determine status
  const getStatusStyle = () => {
    if (invoice.status === "paid") return styles.statusPaid;
    if (invoice.status === "overdue") return styles.statusOverdue;
    return styles.statusPending;
  };

  const getStatusText = () => {
    if (invoice.status === "paid") return "PAID";
    if (invoice.status === "overdue") return "OVERDUE";
    return "PENDING";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>
              {companyAddress && `${companyAddress}\n`}
              {companyEmail && `Email: ${companyEmail}\n`}
              {companyPhone && `Phone: ${companyPhone}`}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, getStatusStyle()]}>
              <Text>{getStatusText()}</Text>
            </View>
          </View>
        </View>

        {/* Invoice and Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>BILL TO:</Text>
            <Text style={styles.infoText}>
              {invoice.clientName || "N/A"}
              {"\n"}
              {invoice.clientAddress && `${invoice.clientAddress}\n`}
              {invoice.clientEmail && invoice.clientEmail}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>INVOICE DETAILS:</Text>
            <Text style={styles.infoText}>
              Invoice Date: {invoice.issueDate}
              {"\n"}
              Due Date: {invoice.dueDate}
              {"\n"}
              {invoice.paidDate && `Paid Date: ${invoice.paidDate}\n`}
              {invoice.purchaseOrderNumber &&
                `PO Number: ${invoice.purchaseOrderNumber}`}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>DESCRIPTION</Text>
            <Text style={styles.tableCol2}>QTY</Text>
            <Text style={styles.tableCol3}>RATE</Text>
            <Text style={styles.tableCol4}>AMOUNT</Text>
          </View>

          {/* Table Rows */}
          {lineItems.map((item) => (
            <View
              key={`${item.description}-${item.amount}`}
              style={styles.tableRow}
            >
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>{formatCurrency(item.rate)}</Text>
              <Text style={styles.tableCol4}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>

          {Number.parseFloat(invoice.discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(invoice.discount)}
              </Text>
            </View>
          )}

          {Number.parseFloat(invoice.taxAmount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>

          {Number.parseFloat(invoice.amountPaid) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.amountPaid)}
              </Text>
            </View>
          )}

          {Number.parseFloat(balanceDue) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Due:</Text>
              <Text style={[styles.totalValue, { color: COLORS.danger }]}>
                {formatCurrency(balanceDue)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms and Footer */}
        <View style={styles.footer}>
          {invoice.terms && (
            <Text style={styles.footerText}>
                <Text style={{ fontWeight: "bold" }}>Payment Terms: </Text>
                {invoice.terms}
              </Text>
          )}
          <Text style={styles.footerText}>
            Thank you for your business. For any questions about this invoice,
            please contact {companyEmail}.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
