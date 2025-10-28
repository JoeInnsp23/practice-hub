import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface LeaveRequestRejectedEmailProps {
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  approverName?: string;
  comments?: string | null;
}

export function LeaveRequestRejectedEmail({
  userName,
  leaveType,
  startDate,
  endDate,
  daysCount,
  approverName,
  comments,
}: LeaveRequestRejectedEmailProps) {
  const leaveTypeLabel = formatLeaveType(leaveType);

  return (
    <Html>
      <Head />
      <Preview>Your leave request has been rejected</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Leave Request Not Approved</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Unfortunately, your leave request has not been approved
            {approverName ? ` by ${approverName}` : ""}.
          </Text>

          <Section style={detailsSection}>
            <Text style={detailLabel}>Leave Type:</Text>
            <Text style={detailValue}>{leaveTypeLabel}</Text>

            <Text style={detailLabel}>Start Date:</Text>
            <Text style={detailValue}>{formatDate(startDate)}</Text>

            <Text style={detailLabel}>End Date:</Text>
            <Text style={detailValue}>{formatDate(endDate)}</Text>

            <Text style={detailLabel}>Days:</Text>
            <Text style={detailValue}>
              {daysCount} {daysCount === 1 ? "day" : "days"}
            </Text>
          </Section>

          {comments && (
            <Section style={commentsSection}>
              <Text style={commentsLabel}>Reason:</Text>
              <Text style={commentsText}>{comments}</Text>
            </Section>
          )}

          <Text style={text}>
            If you have any questions or would like to discuss this decision,
            please contact your manager.
          </Text>

          <Text style={footer}>Practice Hub Leave Management System</Text>
        </Container>
      </Body>
    </Html>
  );
}

function formatLeaveType(type: string): string {
  const types: Record<string, string> = {
    annual_leave: "Annual Leave",
    sick_leave: "Sick Leave",
    toil: "Time Off In Lieu (TOIL)",
    unpaid: "Unpaid Leave",
    other: "Other",
  };
  return types[type] || type;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
};

const h1 = {
  color: "#dc2626",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const detailsSection = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  margin: "24px 40px",
  padding: "24px",
};

const detailLabel = {
  color: "#666",
  fontSize: "14px",
  fontWeight: "600",
  margin: "8px 0 4px 0",
};

const detailValue = {
  color: "#333",
  fontSize: "16px",
  margin: "0 0 16px 0",
};

const commentsSection = {
  backgroundColor: "#fee2e2",
  borderLeft: "4px solid #dc2626",
  borderRadius: "4px",
  margin: "24px 40px",
  padding: "16px",
};

const commentsLabel = {
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const commentsText = {
  color: "#7f1d1d",
  fontSize: "14px",
  margin: "0",
  lineHeight: "20px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
  padding: "24px 40px",
};

export default LeaveRequestRejectedEmail;
