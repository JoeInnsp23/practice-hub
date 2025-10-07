import { render } from "@react-email/render";
import { Resend } from "resend";
import { InvitationEmail } from "@/emails/invitation-email";
import { VerificationEmail } from "@/emails/verification-email";
import { PasswordResetEmail } from "@/emails/password-reset-email";

if (!process.env.RESEND_API_KEY) {
	throw new Error("RESEND_API_KEY is not set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Practice Hub <noreply@notify.innspiredaccountancy.com>";

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
	try {
		const { data, error } = await resend.emails.send({
			from: FROM_EMAIL,
			to,
			subject,
			html,
		});

		if (error) {
			console.error("Error sending email:", error);
			throw new Error(`Failed to send email: ${error.message}`);
		}

		return data;
	} catch (error) {
		console.error("Error sending email:", error);
		throw error;
	}
}

interface SendInvitationEmailParams {
	email: string;
	invitedByName: string;
	organizationName: string;
	inviteLink: string;
	customMessage?: string;
}

export async function sendInvitationEmail(params: SendInvitationEmailParams) {
	const html = await render(
		InvitationEmail({
			invitedByName: params.invitedByName,
			organizationName: params.organizationName,
			inviteLink: params.inviteLink,
			customMessage: params.customMessage,
		}),
	);

	return sendEmail({
		to: params.email,
		subject: `You've been invited to join ${params.organizationName}`,
		html,
	});
}

interface SendVerificationEmailParams {
	email: string;
	userName?: string;
	verificationLink: string;
}

export async function sendVerificationEmail(
	params: SendVerificationEmailParams,
) {
	const html = await render(
		VerificationEmail({
			userName: params.userName,
			verificationLink: params.verificationLink,
		}),
	);

	return sendEmail({
		to: params.email,
		subject: "Verify your email address",
		html,
	});
}

interface SendPasswordResetEmailParams {
	email: string;
	userName?: string;
	resetLink: string;
}

export async function sendPasswordResetEmail(
	params: SendPasswordResetEmailParams,
) {
	const html = await render(
		PasswordResetEmail({
			userName: params.userName,
			resetLink: params.resetLink,
		}),
	);

	return sendEmail({
		to: params.email,
		subject: "Reset your password",
		html,
	});
}
