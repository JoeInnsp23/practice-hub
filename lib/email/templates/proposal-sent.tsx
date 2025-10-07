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

export interface ProposalSentEmailProps {
  clientName: string;
  proposalNumber: string;
  monthlyTotal: string;
  annualTotal: string;
  validUntil: string;
  viewProposalUrl: string;
  companyName?: string;
}

export function ProposalSentEmail({
  clientName,
  proposalNumber,
  monthlyTotal,
  annualTotal,
  validUntil,
  viewProposalUrl,
  companyName = "Innspired Accountancy",
}: ProposalSentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your accounting services proposal from {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Accounting Services Proposal</Heading>

          <Text style={text}>Dear {clientName},</Text>

          <Text style={text}>
            Thank you for your interest in our accounting services. We've
            prepared a comprehensive proposal tailored specifically for your
            business needs.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightLabel}>Proposal #{proposalNumber}</Text>
            <Text style={priceText}>£{monthlyTotal}/month</Text>
            <Text style={smallText}>(£{annualTotal}/year)</Text>
          </Section>

          <Text style={text}>
            Your proposal includes detailed information about our services,
            pricing breakdown, and terms. We've attached the full proposal PDF
            to this email for your convenience.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={viewProposalUrl}>
              View & Sign Proposal
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Valid Until:</strong> {validUntil}
            </Text>
            <Text style={infoText}>
              This proposal is valid until the date above. If you have any
              questions or need clarification on any aspect of the proposal,
              please don't hesitate to reach out to us.
            </Text>
          </Section>

          <Text style={text}>
            We look forward to working with you and helping your business thrive
            with our expert accounting services.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,
            <br />
            The {companyName} Team
            <br />
            <br />
            <Text style={footerSmall}>
              This email was sent to {clientName}. If you have any questions,
              please contact us directly.
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
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const priceText = {
  color: "#FF8534",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0",
  lineHeight: "1.2",
};

const smallText = {
  color: "#666",
  fontSize: "16px",
  margin: "8px 0 0",
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

export default ProposalSentEmail;
