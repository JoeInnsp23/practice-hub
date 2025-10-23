import { render } from "@react-email/components";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { clients, proposals } from "@/lib/db/schema";
import { ProposalDeclinedTeamEmail } from "./templates/proposal-declined-team";
import { ProposalExpiredTeamEmail } from "./templates/proposal-expired-team";
import { ProposalSentEmail } from "./templates/proposal-sent";
import { ProposalSignedClientEmail } from "./templates/proposal-signed-client";
import { ProposalSignedTeamEmail } from "./templates/proposal-signed-team";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "proposals@innspiredaccountancy.com";
const TEAM_EMAIL =
  process.env.RESEND_TEAM_EMAIL || "team@innspiredaccountancy.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const COMPANY_NAME = "Innspired Accountancy";

export interface SendProposalEmailOptions {
  proposalId: string;
  recipientEmail: string;
  recipientName: string;
}

/**
 * Send proposal email to client with PDF attachment
 */
export async function sendProposalEmail(
  options: SendProposalEmailOptions,
): Promise<{ success: boolean; emailId?: string }> {
  const { proposalId, recipientEmail, recipientName } = options;

  try {
    // 1. Fetch proposal data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    if (!proposal.pdfUrl) {
      throw new Error("Proposal PDF not generated yet");
    }

    // 2. Prepare email data
    const validUntil = proposal.validUntil
      ? new Date(proposal.validUntil).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "30 days from today";

    const viewProposalUrl = `${APP_URL}/proposals/sign/${proposalId}`;

    // 3. Render email HTML
    const emailHtml = await render(
      <ProposalSentEmail
        clientName={recipientName}
        proposalNumber={proposal.proposalNumber}
        monthlyTotal={proposal.monthlyTotal.toString()}
        annualTotal={proposal.annualTotal.toString()}
        validUntil={validUntil}
        viewProposalUrl={viewProposalUrl}
        companyName={COMPANY_NAME}
      />,
    );

    // 4. Prepare PDF attachment
    // Extract filename from URL
    const _pdfFileName =
      proposal.pdfUrl.split("/").pop() ||
      `proposal-${proposal.proposalNumber}.pdf`;

    // 5. Send email with Resend
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Your Accounting Services Proposal #${proposal.proposalNumber}`,
      html: emailHtml,
      // Note: For PDF attachment, you would need to download it from S3 first
      // or use a public URL. For now, we'll include the link in the email.
      // attachments: [
      //   {
      //     filename: pdfFileName,
      //     path: proposal.pdfUrl,
      //   },
      // ],
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Proposal email sent successfully:", data?.id);

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Error sending proposal email:", error);
    throw new Error(
      `Failed to send proposal email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export interface SendSignedConfirmationOptions {
  proposalId: string;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
}

/**
 * Send confirmation email to client after signing
 */
export async function sendSignedConfirmationEmail(
  options: SendSignedConfirmationOptions,
): Promise<{ success: boolean; emailId?: string }> {
  const { proposalId, signerName, signerEmail, signedAt } = options;

  try {
    // Fetch proposal data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const signedAtFormatted = signedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Render email HTML
    const emailHtml = await render(
      <ProposalSignedClientEmail
        clientName={signerName}
        proposalNumber={proposal.proposalNumber}
        signedAt={signedAtFormatted}
        monthlyTotal={proposal.monthlyTotal.toString()}
        companyName={COMPANY_NAME}
      />,
    );

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} <${FROM_EMAIL}>`,
      to: signerEmail,
      subject: `Proposal #${proposal.proposalNumber} Signed Successfully`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Error sending signed confirmation email:", error);
    throw new Error(
      `Failed to send signed confirmation email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Send notification to internal team when proposal is signed
 */
export async function sendTeamNotificationEmail(
  options: SendSignedConfirmationOptions,
): Promise<{ success: boolean; emailId?: string }> {
  const { proposalId, signerName, signerEmail, signedAt } = options;

  try {
    // Fetch proposal data with client information
    const [proposal] = await db
      .select({
        id: proposals.id,
        proposalNumber: proposals.proposalNumber,
        title: proposals.title,
        clientName: clients.name,
        clientEmail: clients.email,
        monthlyTotal: proposals.monthlyTotal,
        annualTotal: proposals.annualTotal,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const signedAtFormatted = signedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const viewProposalUrl = `${APP_URL}/proposal-hub/proposals/${proposalId}`;

    // Render email HTML
    const emailHtml = await render(
      <ProposalSignedTeamEmail
        clientName={proposal.clientName || "Unknown Client"}
        clientEmail={proposal.clientEmail || signerEmail}
        proposalNumber={proposal.proposalNumber}
        signedAt={signedAtFormatted}
        monthlyTotal={proposal.monthlyTotal.toString()}
        annualTotal={proposal.annualTotal.toString()}
        signerName={signerName}
        signerEmail={signerEmail}
        viewProposalUrl={viewProposalUrl}
      />,
    );

    // Send email to team
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} System <${FROM_EMAIL}>`,
      to: TEAM_EMAIL,
      subject: `🎉 Proposal #${proposal.proposalNumber} Signed by ${proposal.clientName || signerName}`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Error sending team notification email:", error);
    throw new Error(
      `Failed to send team notification email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export interface SendProposalDeclinedOptions {
  proposalId: string;
  signerEmail: string;
  declinedAt: Date;
}

/**
 * Send notification to internal team when proposal is declined
 */
export async function sendProposalDeclinedTeamEmail(
  options: SendProposalDeclinedOptions,
): Promise<{ success: boolean; emailId?: string }> {
  const { proposalId, signerEmail, declinedAt } = options;

  try {
    // Fetch proposal data with client information
    const [proposal] = await db
      .select({
        id: proposals.id,
        proposalNumber: proposals.proposalNumber,
        title: proposals.title,
        clientName: clients.name,
        clientEmail: clients.email,
        monthlyTotal: proposals.monthlyTotal,
        annualTotal: proposals.annualTotal,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const declinedAtFormatted = declinedAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const viewProposalUrl = `${APP_URL}/proposal-hub/proposals/${proposalId}`;

    // Render email HTML
    const emailHtml = await render(
      <ProposalDeclinedTeamEmail
        clientName={proposal.clientName || "Unknown Client"}
        clientEmail={proposal.clientEmail || signerEmail}
        proposalNumber={proposal.proposalNumber}
        declinedAt={declinedAtFormatted}
        monthlyTotal={proposal.monthlyTotal.toString()}
        annualTotal={proposal.annualTotal.toString()}
        signerEmail={signerEmail}
        viewProposalUrl={viewProposalUrl}
      />,
    );

    // Send email to team
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} System <${FROM_EMAIL}>`,
      to: TEAM_EMAIL,
      subject: `⚠️ Proposal #${proposal.proposalNumber} Declined by ${proposal.clientName || "Client"}`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Error sending proposal declined team email:", error);
    throw new Error(
      `Failed to send proposal declined team email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export interface SendProposalExpiredOptions {
  proposalId: string;
  expiredAt: Date;
}

/**
 * Send notification to internal team when proposal expires
 */
export async function sendProposalExpiredTeamEmail(
  options: SendProposalExpiredOptions,
): Promise<{ success: boolean; emailId?: string }> {
  const { proposalId, expiredAt } = options;

  try {
    // Fetch proposal data with client information
    const [proposal] = await db
      .select({
        id: proposals.id,
        proposalNumber: proposals.proposalNumber,
        title: proposals.title,
        clientName: clients.name,
        clientEmail: clients.email,
        monthlyTotal: proposals.monthlyTotal,
        annualTotal: proposals.annualTotal,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const expiredAtFormatted = expiredAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const viewProposalUrl = `${APP_URL}/proposal-hub/proposals/${proposalId}`;

    // Render email HTML
    const emailHtml = await render(
      <ProposalExpiredTeamEmail
        clientName={proposal.clientName || "Unknown Client"}
        clientEmail={proposal.clientEmail || "Unknown"}
        proposalNumber={proposal.proposalNumber}
        expiredAt={expiredAtFormatted}
        monthlyTotal={proposal.monthlyTotal.toString()}
        annualTotal={proposal.annualTotal.toString()}
        viewProposalUrl={viewProposalUrl}
      />,
    );

    // Send email to team
    const { data, error } = await resend.emails.send({
      from: `${COMPANY_NAME} System <${FROM_EMAIL}>`,
      to: TEAM_EMAIL,
      subject: `⏰ Proposal #${proposal.proposalNumber} Signature Link Expired`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return {
      success: true,
      emailId: data?.id,
    };
  } catch (error) {
    console.error("Error sending proposal expired team email:", error);
    throw new Error(
      `Failed to send proposal expired team email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
