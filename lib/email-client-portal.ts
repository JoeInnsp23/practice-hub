import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@practicehub.com";

interface ClientPortalPasswordResetEmailParams {
  email: string;
  userName: string;
  resetLink: string;
}

export async function sendClientPortalPasswordResetEmail({
  email,
  userName,
  resetLink,
}: ClientPortalPasswordResetEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset Your Client Portal Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">Reset Your Password</h2>

              <p>Hello ${userName},</p>

              <p>We received a request to reset your Client Portal password. Click the button below to create a new password:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}"
                   style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>

              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>

              <p>This link will expire in 1 hour for security reasons.</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
              </p>

              <p style="font-size: 12px; color: #666;">
                If you have any questions or concerns, please contact your account manager.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Client Portal password reset email sent successfully to:", email);
  } catch (error) {
    console.error("Failed to send client portal password reset email:", error);
    // Don't throw - email failures shouldn't block the password reset flow
  }
}
