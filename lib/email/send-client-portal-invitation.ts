import { Resend } from "resend";
import { format } from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@practicehub.com";

interface ClientPortalInvitationParams {
  email: string;
  firstName: string;
  lastName: string;
  invitedBy: string;
  clientNames: string[];
  invitationLink: string;
  expiresAt: Date;
  customMessage?: string;
}

export async function sendClientPortalInvitationEmail({
  email,
  firstName,
  lastName,
  invitedBy,
  clientNames,
  invitationLink,
  expiresAt,
  customMessage,
}: ClientPortalInvitationParams): Promise<void> {
  const expiryDate = format(expiresAt, "MMMM d, yyyy 'at' h:mm a");
  const clientList = clientNames.join(", ");

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're invited to access the Client Portal",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 30px; border-radius: 8px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; margin: 0 auto 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 28px; font-weight: bold;">P</span>
                </div>
                <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">Client Portal Invitation</h1>
              </div>

              <!-- Greeting -->
              <p style="font-size: 16px; margin-bottom: 20px;">Hello ${firstName} ${lastName},</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                ${invitedBy} has invited you to access the Client Portal, where you can securely view and manage important information for your ${clientNames.length > 1 ? "accounts" : "account"}.
              </p>

              <!-- Client List -->
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">You'll have access to:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  ${clientNames.map((name) => `<li style="margin: 8px 0;">${name}</li>`).join("")}
                </ul>
              </div>

              ${customMessage ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px;">
                <p style="margin: 0; font-style: italic; color: #1e40af;">"${customMessage}"</p>
              </div>
              ` : ""}

              <!-- Benefits -->
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #1f2937; font-size: 18px;">What you can do:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">📄 View and sign proposals</li>
                  <li style="margin: 8px 0;">💰 Access invoices and payment history</li>
                  <li style="margin: 8px 0;">📂 Download important documents</li>
                  <li style="margin: 8px 0;">💬 Communicate securely with your team</li>
                  <li style="margin: 8px 0;">🔔 Receive real-time updates</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${invitationLink}"
                   style="background-color: #4f46e5; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                  Accept Invitation & Set Password
                </a>
              </div>

              <!-- Expiration Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⏰ <strong>This invitation expires on ${expiryDate}</strong>
                </p>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">
                  🔒 <strong>Security Note:</strong> This is a secure, one-time invitation link. Never share this link with anyone.
                </p>
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">
                  If you didn't expect this invitation or have questions, please contact ${invitedBy}.
                </p>
              </div>

              <!-- Manual Link -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #4f46e5; word-break: break-all; background-color: white; padding: 10px; border-radius: 4px;">
                  ${invitationLink}
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 5px 0;">This email was sent to ${email}</p>
              <p style="margin: 5px 0;">© ${new Date().getFullYear()} Practice Hub. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Client portal invitation email sent successfully to:", email);
  } catch (error) {
    console.error("Failed to send client portal invitation email:", error);
    throw error;
  }
}
