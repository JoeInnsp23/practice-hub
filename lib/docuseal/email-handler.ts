import { Resend } from "resend";
import { getProposalSignedPdfUrl } from "@/lib/s3/signed-pdf-access";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Practice Hub <proposals@yourdomain.com>";

export interface SigningInvitationParams {
  proposalId: string;
  proposalNumber: string;
  recipientEmail: string;
  recipientName: string;
  embeddedSigningUrl: string;
}

export interface SignedConfirmationParams {
  recipientEmail: string;
  recipientName: string;
  proposalNumber: string;
  proposalId: string; // Changed: Pass proposalId instead of URL for secure presigned URL generation
  auditTrailSummary: {
    signerName: string;
    signedAt: string;
    ipAddress: string;
    documentHash: string;
  };
}

/**
 * Send signing invitation email via Resend
 * Includes UK SES compliance information
 */
export async function sendSigningInvitation(
  params: SigningInvitationParams,
): Promise<void> {
  const { recipientEmail, recipientName, proposalNumber, embeddedSigningUrl } =
    params;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Action Required: Sign Proposal #${proposalNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
              .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .button:hover { background: #2563eb; }
              ul { padding-left: 20px; margin: 10px 0; }
              li { margin: 8px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e5e5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Proposal Ready for Signature</h1>
            </div>

            <div class="content">
              <p style="font-size: 16px;">Dear ${recipientName},</p>

              <p>Your proposal <strong>#${proposalNumber}</strong> is ready for your signature.</p>

              <div class="info-box">
                <p style="margin: 0 0 10px 0;"><strong>📋 Important: E-Signature Information</strong></p>
                <ul style="margin: 0;">
                  <li>This signing link is unique to you and your email address</li>
                  <li>The link will expire in 30 days</li>
                  <li>By clicking below, you consent to sign electronically</li>
                  <li>Your e-signature will have the same legal effect as a handwritten signature</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${embeddedSigningUrl}" class="button">
                  Review and Sign Proposal →
                </a>
              </div>

              <div class="warning-box">
                <p style="margin: 0 0 10px 0;"><strong>🔒 What we'll capture for compliance:</strong></p>
                <ul style="margin: 0;">
                  <li><strong>Technical data:</strong> Your IP address and device information</li>
                  <li><strong>Timestamps:</strong> When you view and sign the document</li>
                  <li><strong>Identity verification:</strong> Your name, email, and signing capacity</li>
                  <li><strong>Company details:</strong> Company name and registration number</li>
                  <li><strong>Authority confirmation:</strong> Your confirmation of signing authority</li>
                </ul>
                <p style="margin: 12px 0 0 0; font-size: 13px; color: #78350f;">
                  This information is required for UK Simple Electronic Signature (SES) compliance and will be included in the audit trail appended to the signed document.
                </p>
              </div>

              <p style="margin-top: 30px;">If you have any questions about this proposal, please don't hesitate to contact us.</p>

              <p style="margin-top: 20px;">Best regards,<br><strong>Practice Hub Team</strong></p>
            </div>

            <div class="footer">
              <p>This is an automated message from Practice Hub.<br>
              Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send signing invitation email:", error);
    throw new Error("Failed to send signing invitation email");
  }
}

/**
 * Send signed confirmation email via Resend
 * Includes audit trail summary
 */
export async function sendSignedConfirmation(
  params: SignedConfirmationParams,
): Promise<void> {
  const {
    recipientEmail,
    recipientName,
    proposalNumber,
    proposalId,
    auditTrailSummary,
  } = params;

  // Generate presigned URL valid for 7 days (reasonable for email context)
  const signedPdfUrl = await getProposalSignedPdfUrl(
    proposalId,
    7 * 24 * 60 * 60, // 7 days
  );

  if (!signedPdfUrl) {
    throw new Error(
      `Failed to generate signed PDF URL for proposal ${proposalId}`,
    );
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Signed: Proposal #${proposalNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
              .success-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }
              .audit-box { background: #f9fafb; padding: 16px; margin: 20px 0; border-radius: 4px; border: 1px solid #e5e7eb; }
              .button { display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .button:hover { background: #059669; }
              .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .detail:last-child { border-bottom: none; }
              .label { font-weight: 600; color: #6b7280; }
              .value { color: #1a1a1a; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e5e5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">✓ Proposal Signed Successfully</h1>
            </div>

            <div class="content">
              <p style="font-size: 16px;">Dear ${recipientName},</p>

              <p>Your proposal <strong>#${proposalNumber}</strong> has been successfully signed and finalized.</p>

              <div class="success-box">
                <p style="margin: 0;"><strong>✓ Signature Confirmed</strong></p>
                <p style="margin: 8px 0 0 0; color: #059669;">
                  Your electronic signature has been recorded and the document has been secured.
                </p>
              </div>

              <div class="audit-box">
                <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Signature Details:</h3>
                <div class="detail">
                  <span class="label">Signed by:</span>
                  <span class="value">${auditTrailSummary.signerName}</span>
                </div>
                <div class="detail">
                  <span class="label">Date & Time:</span>
                  <span class="value">${new Date(
                    auditTrailSummary.signedAt,
                  ).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}</span>
                </div>
                <div class="detail">
                  <span class="label">IP Address:</span>
                  <span class="value">${auditTrailSummary.ipAddress}</span>
                </div>
                <div class="detail">
                  <span class="label">Document Hash:</span>
                  <span class="value" style="font-family: monospace; font-size: 11px;">${auditTrailSummary.documentHash.substring(0, 32)}...</span>
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${signedPdfUrl}" class="button">
                  Download Signed PDF →
                </a>
              </div>

              <p style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
                <strong>Note:</strong> A complete audit trail has been appended to the signed document for UK SES compliance. This includes all technical metadata, timestamps, and verification details.
              </p>

              <p style="margin-top: 30px;">Thank you for your business. We look forward to working with you.</p>

              <p style="margin-top: 20px;">Best regards,<br><strong>Practice Hub Team</strong></p>
            </div>

            <div class="footer">
              <p>This is an automated confirmation from Practice Hub.<br>
              Please retain this email for your records.</p>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send signed confirmation email:", error);
    throw new Error("Failed to send signed confirmation email");
  }
}

/**
 * Send internal team notification when proposal is signed
 */
export async function sendTeamSignedNotification(params: {
  proposalNumber: string;
  clientName: string;
  signerName: string;
  signedAt: string;
  teamEmail: string;
}): Promise<void> {
  const { proposalNumber, clientName, signerName, signedAt, teamEmail } =
    params;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: teamEmail,
      subject: `🎉 Proposal #${proposalNumber} Signed`,
      html: `
        <h2>Proposal Signed!</h2>
        <p><strong>Proposal:</strong> #${proposalNumber}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Signed by:</strong> ${signerName}</p>
        <p><strong>Date:</strong> ${new Date(signedAt).toLocaleString()}</p>
        <p>The signed proposal is now available in the system.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send team notification:", error);
    // Don't throw - team notification failure shouldn't block the signing process
  }
}
