import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components";

export interface NewLeadNotificationEmailProps {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  businessType: string;
  industry: string;
  estimatedTurnover: number;
  estimatedEmployees: number;
  interestedServices: string[];
  notes?: string;
  viewLeadUrl: string;
}

export function NewLeadNotificationEmail({
  leadId,
  firstName,
  lastName,
  email,
  phone,
  companyName,
  businessType,
  industry,
  estimatedTurnover,
  estimatedEmployees,
  interestedServices,
  notes,
  viewLeadUrl,
}: NewLeadNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New lead from website: {firstName} {lastName} at {companyName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={alertBox}>
            <Heading style={h1}>🎉 New Lead Received!</Heading>
            <Text style={alertText}>
              A new lead has submitted a quote request through the website.
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Heading style={h2}>Contact Information</Heading>
            <Text style={detailText}>
              <strong>Name:</strong> {firstName} {lastName}
            </Text>
            <Text style={detailText}>
              <strong>Email:</strong> {email}
            </Text>
            {phone && (
              <Text style={detailText}>
                <strong>Phone:</strong> {phone}
              </Text>
            )}
          </Section>

          <Section style={detailsBox}>
            <Heading style={h2}>Company Details</Heading>
            <Text style={detailText}>
              <strong>Company Name:</strong> {companyName}
            </Text>
            <Text style={detailText}>
              <strong>Business Type:</strong> {businessType}
            </Text>
            <Text style={detailText}>
              <strong>Industry:</strong> {industry}
            </Text>
            <Text style={detailText}>
              <strong>Estimated Annual Turnover:</strong> £
              {estimatedTurnover.toLocaleString()}
            </Text>
            <Text style={detailText}>
              <strong>Number of Employees:</strong> {estimatedEmployees}
            </Text>
          </Section>

          <Section style={servicesBox}>
            <Heading style={h2}>Services of Interest</Heading>
            <Text style={servicesList}>
              {interestedServices.map((service, index) => (
                <span key={index}>
                  • {service}
                  <br />
                </span>
              ))}
            </Text>
          </Section>

          {notes && (
            <Section style={notesBox}>
              <Heading style={h2}>Additional Notes</Heading>
              <Text style={detailText}>{notes}</Text>
            </Section>
          )}

          <Section style={buttonContainer}>
            <Button style={button} href={viewLeadUrl}>
              View Lead in Practice Hub
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={actionBox}>
            <Text style={actionTitle}>Recommended Next Steps:</Text>
            <Text style={actionText}>
              1. Review the lead details in Practice Hub
              <br />
              2. Assign the lead to an account manager
              <br />
              3. Schedule initial contact within 2 hours
              <br />
              4. Prepare a custom proposal within 24-48 hours
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Lead ID: {leadId}
            <br />
            Submitted: {new Date().toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            <br />
            Source: Website Lead Capture Form
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "650px",
  backgroundColor: "#ffffff",
};

const alertBox = {
  backgroundColor: "#FFF5ED",
  border: "2px solid #FF8534",
  borderRadius: "8px",
  padding: "24px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#FF8534",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const alertText = {
  color: "#4A4A4A",
  fontSize: "16px",
  margin: "0",
  lineHeight: "1.5",
};

const h2 = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const detailsBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "20px",
  margin: "0 0 16px",
};

const detailText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const servicesBox = {
  backgroundColor: "#e3f2fd",
  borderRadius: "6px",
  padding: "20px",
  margin: "0 0 16px",
};

const servicesList = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
  fontFamily: "monospace",
};

const notesBox = {
  backgroundColor: "#fff9e6",
  borderRadius: "6px",
  padding: "20px",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#FF8534",
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
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "32px 0",
};

const actionBox = {
  backgroundColor: "#f0f0f0",
  borderLeft: "4px solid #FF8534",
  borderRadius: "4px",
  padding: "16px 20px",
  margin: "16px 0",
};

const actionTitle = {
  color: "#333",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const actionText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const footer = {
  color: "#999",
  fontSize: "12px",
  lineHeight: "1.6",
  marginTop: "32px",
  textAlign: "center" as const,
};

export default NewLeadNotificationEmail;
