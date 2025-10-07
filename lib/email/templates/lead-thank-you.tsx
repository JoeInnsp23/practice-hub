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
} from "@react-email/components";

export interface LeadThankYouEmailProps {
  firstName: string;
  companyName: string;
  estimatedTurnover: number;
  interestedServices: string[];
  firmName?: string;
}

export function LeadThankYouEmail({
  firstName,
  companyName,
  estimatedTurnover,
  interestedServices,
  firmName = "Innspired Accountancy",
}: LeadThankYouEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for your interest in our accounting services</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank You for Your Interest!</Heading>

          <Text style={text}>Dear {firstName},</Text>

          <Text style={text}>
            Thank you for taking the time to fill out our quote request form.
            We've received your information and are excited to learn more about
            {companyName} and how we can support your accounting needs.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightLabel}>What Happens Next?</Text>
            <Section style={stepsList}>
              <Text style={stepText}>
                <strong>1. Review (Within 2 hours)</strong>
                <br />
                Our team will review your requirements and company details.
              </Text>
              <Text style={stepText}>
                <strong>2. Custom Proposal (Within 24-48 hours)</strong>
                <br />
                You'll receive a detailed proposal tailored to your needs.
              </Text>
              <Text style={stepText}>
                <strong>3. Discovery Call (Within 3-5 days)</strong>
                <br />
                We'll schedule a call to discuss your proposal and answer any
                questions.
              </Text>
              <Text style={stepText}>
                <strong>4. Get Started</strong>
                <br />
                Once approved, we'll begin onboarding your accounting services.
              </Text>
            </Section>
          </Section>

          <Section style={infoBox}>
            <Text style={infoTitle}>Your Submission Summary</Text>
            <Text style={infoText}>
              <strong>Company:</strong> {companyName}
            </Text>
            <Text style={infoText}>
              <strong>Estimated Turnover:</strong> £
              {estimatedTurnover.toLocaleString()}
            </Text>
            <Text style={infoText}>
              <strong>Services of Interest:</strong>
              <br />
              {interestedServices.join(", ")}
            </Text>
          </Section>

          <Text style={text}>
            If you have any urgent questions or need immediate assistance,
            please don't hesitate to contact us directly at
            hello@innspiredaccountancy.com or call us at +44 1234 567890.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,
            <br />
            The {firmName} Team
            <br />
            <br />
            <Text style={footerSmall}>
              We're committed to providing exceptional accounting services and
              look forward to partnering with you.
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
};

const highlightLabel = {
  color: "#FF8534",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const stepsList = {
  margin: "16px 0 0",
};

const stepText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const infoBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "20px",
  margin: "20px 0",
};

const infoTitle = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const infoText = {
  color: "#4A4A4A",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 10px",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e6e6e6",
  margin: "32px 0",
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

export default LeadThankYouEmail;
