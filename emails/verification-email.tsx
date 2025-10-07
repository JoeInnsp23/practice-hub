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

interface VerificationEmailProps {
  userName?: string;
  verificationLink: string;
}

export function VerificationEmail({
  userName,
  verificationLink = "https://example.com/verify",
}: VerificationEmailProps) {
  const greeting = userName ? `Hi ${userName}` : "Hi there";

  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Practice Hub</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerText}>Practice Hub</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Verify your email address</Heading>

            <Text style={text}>{greeting},</Text>

            <Text style={text}>
              Thank you for signing up for Practice Hub. Please verify your
              email address by clicking the button below:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationLink}>
                Verify Email
              </Button>
            </Section>

            <Text style={notice}>
              This verification link will expire in 24 hours. If you didn't
              create an account, you can safely ignore this email.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              If the button doesn't work, copy and paste this link into your
              browser:
              <br />
              <Link href={verificationLink} style={link}>
                {verificationLink}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default VerificationEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  marginTop: "20px",
  marginBottom: "20px",
  borderRadius: "8px",
  overflow: "hidden" as const,
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  padding: "30px",
  textAlign: "center" as const,
};

const headerText = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold" as const,
  margin: "0",
};

const content = {
  padding: "40px",
};

const h2 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold" as const,
  marginTop: "0",
  marginBottom: "20px",
};

const text = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: "14px 32px",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: "600" as const,
  fontSize: "16px",
  display: "inline-block",
};

const notice = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "20px",
  marginTop: "30px",
};

const hr = {
  borderColor: "#e2e8f0",
  marginTop: "30px",
  marginBottom: "30px",
};

const footer = {
  fontSize: "12px",
  color: "#94a3b8",
  lineHeight: "18px",
  marginBottom: "0",
};

const link = {
  color: "#3b82f6",
  wordBreak: "break-all" as const,
};
