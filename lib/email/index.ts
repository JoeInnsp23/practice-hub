import { render } from "@react-email/render";
import { Resend } from "resend";
import { InvitationEmail } from "@/emails/invitation-email";
import { InvoiceReminderEmail } from "@/emails/invoice-reminder-email";
import { PasswordResetEmail } from "@/emails/password-reset-email";
import { VerificationEmail } from "@/emails/verification-email";

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

interface SendInvoiceEmailParams {
  email: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  status: "reminder" | "overdue" | "final_notice";
  paymentLink?: string;
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const html = await render(
    InvoiceReminderEmail({
      clientName: params.clientName,
      invoiceNumber: params.invoiceNumber,
      invoiceDate: params.invoiceDate,
      dueDate: params.dueDate,
      totalAmount: params.totalAmount,
      status: params.status,
      paymentLink: params.paymentLink,
    }),
  );

  const subjectPrefix = {
    reminder: "Payment Reminder",
    overdue: "Overdue Invoice Notice",
    final_notice: "FINAL NOTICE - Immediate Action Required",
  }[params.status];

  return sendEmail({
    to: params.email,
    subject: `${subjectPrefix} - Invoice ${params.invoiceNumber}`,
    html,
  });
}
