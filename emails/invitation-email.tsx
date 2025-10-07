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

interface InvitationEmailProps {
	invitedByName: string;
	organizationName: string;
	inviteLink: string;
	customMessage?: string;
}

export function InvitationEmail({
	invitedByName = "Your Administrator",
	organizationName = "Practice Hub",
	inviteLink = "https://example.com/accept-invitation",
	customMessage,
}: InvitationEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>
				You've been invited to join {organizationName} on Practice Hub
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section style={header}>
						<Heading style={headerText}>Practice Hub</Heading>
					</Section>

					<Section style={content}>
						<Heading style={h2}>You've been invited!</Heading>

						<Text style={text}>Hi there,</Text>

						<Text style={text}>
							<strong>{invitedByName}</strong> has invited you to join{" "}
							<strong>{organizationName}</strong> on Practice Hub.
						</Text>

						{customMessage && (
							<Section style={customMessageBox}>
								<Text style={customMessageText}>"{customMessage}"</Text>
							</Section>
						)}

						<Text style={text}>
							Click the button below to accept your invitation and set up your
							account:
						</Text>

						<Section style={buttonContainer}>
							<Button style={button} href={inviteLink}>
								Accept Invitation
							</Button>
						</Section>

						<Text style={notice}>
							This invitation will expire in 7 days. If you didn't expect this
							invitation, you can safely ignore this email.
						</Text>

						<Hr style={hr} />

						<Text style={footer}>
							If the button doesn't work, copy and paste this link into your
							browser:
							<br />
							<Link href={inviteLink} style={link}>
								{inviteLink}
							</Link>
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}

export default InvitationEmail;

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
	background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
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

const customMessageBox = {
	backgroundColor: "#f8fafc",
	borderLeft: "4px solid #f97316",
	padding: "16px",
	marginTop: "24px",
	marginBottom: "24px",
	borderRadius: "4px",
};

const customMessageText = {
	margin: "0",
	fontSize: "15px",
	color: "#475569",
	fontStyle: "italic" as const,
	lineHeight: "22px",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "40px 0",
};

const button = {
	backgroundColor: "#f97316",
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
