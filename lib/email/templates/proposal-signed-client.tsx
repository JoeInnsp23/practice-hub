import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ProposalSignedClientEmailProps {
  clientName: string;
  proposalNumber: string;
  signedAt: string;
  monthlyTotal: string;
  companyName?: string;
}

export function ProposalSignedClientEmail({
  clientName,
  proposalNumber,
  signedAt,
  monthlyTotal,
  companyName = "Innspired Accountancy",
}: ProposalSignedClientEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for signing your proposal with {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Proposal Signed Successfully! 🎉</Heading>

          <Text style={text}>Dear {clientName},</Text>

          <Text style={text}>
            Thank you for signing your proposal! We're excited to begin working
            with you and helping your business succeed.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightLabel}>Proposal #{proposalNumber}</Text>
            <Text style={detailText}>
              <strong>Signed:</strong> {signedAt}
            </Text>
            <Text style={detailText}>
              <strong>Monthly Fee:</strong> £{monthlyTotal}
            </Text>
          </Section>

          <Heading style={h2}>What Happens Next?</Heading>

          <Section style={stepContainer}>
            <Text style={stepNumber}>1</Text>
            <Section style={stepContent}>
              <Text style={stepTitle}>Welcome Call</Text>
              <Text style={stepText}>
                Our team will reach out within 24-48 hours to schedule your
                onboarding call and discuss the next steps.
              </Text>
            </Section>
          </Section>

          <Section style={stepContainer}>
            <Text style={stepNumber}>2</Text>
            <Section style={stepContent}>
              <Text style={stepTitle}>Document Collection</Text>
              <Text style={stepText}>
                We'll send you a secure link to upload any necessary documents
                and provide access to your accounting systems.
              </Text>
            </Section>
          </Section>

          <Section style={stepContainer}>
            <Text style={stepNumber}>3</Text>
            <Section style={stepContent}>
              <Text style={stepTitle}>Onboarding & Setup</Text>
              <Text style={stepText}>
                We'll set up your accounting systems, review your current
                financial position, and establish our workflow together.
              </Text>
            </Section>
          </Section>

          <Section style={stepContainer}>
            <Text style={stepNumber}>4</Text>
            <Section style={stepContent}>
              <Text style={stepTitle}>Service Commencement</Text>
              <Text style={stepText}>
                Your services will officially begin, and you'll gain access to
                our client portal for real-time financial insights.
              </Text>
            </Section>
          </Section>

          <Hr style={hr} />

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Need Help?</strong>
            </Text>
            <Text style={infoText}>
              If you have any questions about the onboarding process or your
              proposal, please don't hesitate to contact us. We're here to make
              this transition as smooth as possible.
            </Text>
          </Section>

          <Text style={text}>
            We're looking forward to a successful partnership with you!
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,
            <br />
            The {companyName} Team
            <br />
            <br />
            <Text style={footerSmall}>
              This confirmation was sent to {clientName}. A copy of your signed
              proposal is attached to this email.
            </Text>
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
  maxWidth: "600px",
  backgroundColor: "#ffffff",
};

const h1 = {
  color: "#FF8534",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 20px",
  lineHeight: "1.3",
};

const h2 = {
  color: "#000",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "32px 0 20px",
  lineHeight: "1.3",
};

const text = {
  color: "#4A4A4A",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 15px",
};

const highlightBox = {
  backgroundColor: "#FFF5ED",
  border: "2px solid #FF8534",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const highlightLabel = {
  color: "#4A4A4A",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 16px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const detailText = {
  color: "#4A4A4A",
  fontSize: "15px",
  margin: "8px 0",
};

const stepContainer = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "20px",
};

const stepNumber = {
  backgroundColor: "#FF8534",
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "bold",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "16px",
  flexShrink: 0,
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  color: "#000",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const stepText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "32px 0",
};

const infoBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "20px",
  margin: "20px 0",
};

const infoText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 10px",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "32px",
};

const footerSmall = {
  color: "#999",
  fontSize: "12px",
  marginTop: "16px",
};

export default ProposalSignedClientEmail;
