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

export interface ProposalDeclinedTeamEmailProps {
  clientName: string;
  clientEmail: string;
  proposalNumber: string;
  declinedAt: string;
  monthlyTotal: string;
  annualTotal: string;
  signerEmail: string;
  viewProposalUrl: string;
}

export function ProposalDeclinedTeamEmail({
  clientName,
  clientEmail,
  proposalNumber,
  declinedAt,
  monthlyTotal,
  annualTotal,
  signerEmail,
  viewProposalUrl,
}: ProposalDeclinedTeamEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        ⚠️ Proposal #{proposalNumber} declined by {clientName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBanner}>
            <Text style={bannerText}>⚠️ PROPOSAL DECLINED</Text>
          </Section>

          <Heading style={h1}>Proposal Declined</Heading>

          <Text style={text}>
            Proposal #{proposalNumber} was declined by the signer. This requires
            immediate follow-up to understand objections and potentially revise
            the proposal.
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

            <Heading style={h3}>Declined Details</Heading>
            <Section style={detailRow}>
              <Text style={detailLabel}>Declined By:</Text>
              <Text style={detailValue}>{signerEmail}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Declined At:</Text>
              <Text style={detailValue}>{declinedAt}</Text>
            </Section>

            <Hr style={divider} />

            <Heading style={h3}>Proposal Value</Heading>
            <Section style={detailRow}>
              <Text style={detailLabel}>Proposal Number:</Text>
              <Text style={detailValue}>#{proposalNumber}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Monthly Fee:</Text>
              <Text style={{ ...detailValue, ...priceHighlight }}>
                £{monthlyTotal}
              </Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Annual Value:</Text>
              <Text style={{ ...detailValue, ...priceHighlight }}>
                £{annualTotal}
              </Text>
            </Section>
          </Section>

          <Section style={actionBox}>
            <Heading style={h3}>Recommended Next Steps</Heading>
            <Text style={actionText}>
              1. Follow up with the client within 24 hours
              <br />
              2. Understand their objections and concerns
              <br />
              3. Consider revising the proposal to address issues
              <br />
              4. Schedule a call to discuss alternative options
              <br />
              5. Document feedback in the CRM for future reference
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={viewProposalUrl}>
              View Proposal Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This notification was automatically generated when {signerEmail}{" "}
            declined the proposal signature request.
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
  backgroundColor: "#dc2626",
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
  color: "#dc2626",
  fontSize: "16px",
};

const divider = {
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "20px 0",
};

const actionBox = {
  backgroundColor: "#fef2f2",
  border: "2px solid #dc2626",
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
  backgroundColor: "#dc2626",
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

export default ProposalDeclinedTeamEmail;
