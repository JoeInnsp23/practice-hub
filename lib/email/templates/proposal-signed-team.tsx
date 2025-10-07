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

export interface ProposalSignedTeamEmailProps {
  clientName: string;
  clientEmail: string;
  proposalNumber: string;
  signedAt: string;
  monthlyTotal: string;
  annualTotal: string;
  signerName: string;
  signerEmail: string;
  viewProposalUrl: string;
}

export function ProposalSignedTeamEmail({
  clientName,
  clientEmail,
  proposalNumber,
  signedAt,
  monthlyTotal,
  annualTotal,
  signerName,
  signerEmail,
  viewProposalUrl,
}: ProposalSignedTeamEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        🎉 Proposal #{proposalNumber} signed by {clientName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBanner}>
            <Text style={bannerText}>🎉 NEW SIGNED PROPOSAL</Text>
          </Section>

          <Heading style={h1}>Proposal Signed!</Heading>

          <Text style={text}>
            Great news! Proposal #{proposalNumber} has been signed and a new
            client is ready to onboard.
          </Text>

          <Section style={detailsBox}>
            <Heading style={h3}>Client Details</Heading>
            <Section style={detailRow}>
              <Text style={detailLabel}>Company:</Text>
              <Text style={detailValue}>{clientName}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Email:</Text>
              <Text style={detailValue}>{clientEmail}</Text>
            </Section>

            <Hr style={divider} />

            <Heading style={h3}>Signature Details</Heading>
            <Section style={detailRow}>
              <Text style={detailLabel}>Signed By:</Text>
              <Text style={detailValue}>{signerName}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Signer Email:</Text>
              <Text style={detailValue}>{signerEmail}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Signed At:</Text>
              <Text style={detailValue}>{signedAt}</Text>
            </Section>

            <Hr style={divider} />

            <Heading style={h3}>Financial Details</Heading>
            <Section style={detailRow}>
              <Text style={detailLabel}>Proposal Number:</Text>
              <Text style={detailValue}>#{proposalNumber}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Monthly Fee:</Text>
              <Text style={[detailValue, priceHighlight]}>£{monthlyTotal}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Annual Value:</Text>
              <Text style={[detailValue, priceHighlight]}>£{annualTotal}</Text>
            </Section>
          </Section>

          <Section style={actionBox}>
            <Heading style={h3}>Next Steps</Heading>
            <Text style={actionText}>
              1. Review the signed proposal and client details
              <br />
              2. Schedule the onboarding call within 24-48 hours
              <br />
              3. Send the welcome email and document request
              <br />
              4. Create the client in the system and set up their portal
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewProposalUrl}>
              View Signed Proposal
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This notification was automatically generated when {signerName}{" "}
            signed the proposal.
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

const headerBanner = {
  backgroundColor: "#FF8534",
  padding: "16px",
  borderRadius: "6px 6px 0 0",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const bannerText = {
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "1px",
};

const h1 = {
  color: "#000",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 16px",
  lineHeight: "1.3",
};

const h3 = {
  color: "#000",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const text = {
  color: "#4A4A4A",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const detailsBox = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #e6e6e6",
  borderRadius: "6px",
  padding: "24px",
  margin: "20px 0",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
};

const detailLabel = {
  color: "#666",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
  width: "40%",
};

const detailValue = {
  color: "#000",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0",
  textAlign: "right" as const,
  width: "60%",
};

const priceHighlight = {
  color: "#FF8534",
  fontSize: "16px",
};

const divider = {
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "20px 0",
};

const actionBox = {
  backgroundColor: "#FFF5ED",
  border: "2px solid #FF8534",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const actionText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
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

const footer = {
  color: "#999",
  fontSize: "12px",
  lineHeight: "1.6",
  marginTop: "32px",
  textAlign: "center" as const,
};

export default ProposalSignedTeamEmail;
