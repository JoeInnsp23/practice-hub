import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { MUTED_FOREGROUND_HEX_LIGHT } from "@/lib/constants/colors";

interface InvoiceReminderEmailProps {
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  status: "reminder" | "overdue" | "final_notice";
  paymentLink?: string;
}

export function InvoiceReminderEmail({
  clientName = "Valued Client",
  invoiceNumber = "INV-2024-001",
  invoiceDate = "2024-01-01",
  dueDate = "2024-01-31",
  totalAmount = "£1,000.00",
  status = "reminder",
  paymentLink,
}: InvoiceReminderEmailProps) {
  const subjectText = {
    reminder: "Payment Reminder",
    overdue: "Overdue Invoice Notice",
    final_notice: "Final Notice - Immediate Action Required",
  }[status];

  const urgencyText = {
    reminder: "This is a friendly reminder that payment is due soon.",
    overdue: "This invoice is now overdue. Please arrange payment immediately.",
    final_notice:
      "This is a FINAL NOTICE. Immediate action is required to avoid further consequences.",
  }[status];

  return (
    <Html>
      <Head />
      <Preview>
        {subjectText} - Invoice {invoiceNumber} ({totalAmount})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerText}>Practice Hub</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>{subjectText}</Heading>

            <Text style={text}>Dear {clientName},</Text>

            <Text style={text}>{urgencyText}</Text>

            <Section style={invoiceDetailsBox}>
              <Heading style={h3}>Invoice Details</Heading>
              <Text style={detailRow}>
                <strong>Invoice Number:</strong> {invoiceNumber}
              </Text>
              <Text style={detailRow}>
                <strong>Invoice Date:</strong> {invoiceDate}
              </Text>
              <Text style={detailRow}>
                <strong>Due Date:</strong> {dueDate}
              </Text>
              <Text style={detailRow}>
                <strong>Amount Due:</strong>{" "}
                <span style={amountText}>{totalAmount}</span>
              </Text>
            </Section>

            {paymentLink && (
              <>
                <Text style={text}>
                  You can view and pay your invoice securely by clicking the
                  button below:
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href={paymentLink}>
                    View & Pay Invoice
                  </Button>
                </Section>
              </>
            )}

            <Text style={text}>
              If you have already made payment, please disregard this notice.
            </Text>

            <Text style={text}>
              For any questions regarding this invoice, please contact your
              account manager.
            </Text>

            <Hr style={hr} />

            {paymentLink && (
              <Text style={footer}>
                If the button doesn't work, copy and paste this link into your
                browser:
                <br />
                <Link href={paymentLink} style={link}>
                  {paymentLink}
                </Link>
              </Text>
            )}

            <Text style={footer}>
              Thank you for your business.
              <br />
              Practice Hub Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 20px",
  backgroundColor: "#0ea5e9",
  textAlign: "center" as const,
};

const headerText = {
  margin: "0",
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
};

const content = {
  padding: "0 40px",
};

const h2 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "600",
  margin: "30px 0 15px",
};

const h3 = {
  color: "#1e293b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const invoiceDetailsBox = {
  backgroundColor: "#f1f5f9",
  borderLeft: "4px solid #0ea5e9",
  padding: "20px",
  margin: "24px 0",
  borderRadius: "6px",
};

const detailRow = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "8px 0",
};

const amountText = {
  color: "#0ea5e9",
  fontSize: "18px",
  fontWeight: "bold",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0ea5e9",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: MUTED_FOREGROUND_HEX_LIGHT,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "16px 0",
};

const link = {
  color: "#0ea5e9",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};
