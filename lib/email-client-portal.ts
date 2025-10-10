import { Resend } from "resend";
import { SUPPORT_EMAIL } from "@/lib/config";

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

interface KYCVerificationEmailParams {
  email: string;
  clientName: string;
  verificationUrl: string;
}

export async function sendKYCVerificationEmail({
  email,
  clientName,
  verificationUrl,
}: KYCVerificationEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Complete Your Identity Verification - Innspired Accountancy",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">🔐 Identity Verification Required</h2>

              <p>Hello ${clientName},</p>

              <p>Thank you for completing your onboarding questionnaire! We've received your information and are excited to work with you.</p>

              <p><strong>Next Step: Identity Verification</strong></p>

              <p>To activate your client portal access and comply with UK Money Laundering Regulations 2017, we need to verify your identity through our secure partner, LEM Verify.</p>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>Please note:</strong> You may need to upload your identity documents again on the secure verification platform. This is required for biometric verification and AML compliance checks.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}"
                   style="background-color: #4f46e5; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Complete Identity Verification →
                </a>
              </div>

              <p><strong>The verification process includes:</strong></p>
              <ul style="line-height: 1.8;">
                <li>Document verification (passport or UK driving license)</li>
                <li>Face matching and liveness detection</li>
                <li>AML and PEP screening</li>
              </ul>

              <p><strong>Timeline:</strong></p>
              <ul style="line-height: 1.8;">
                <li>Verification typically takes 2-5 minutes to complete</li>
                <li>Results are usually available within 24 hours</li>
                <li>You'll receive an email once your portal access is activated</li>
              </ul>

              <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #0c5460;">
                  <strong>Deadline:</strong> Please complete verification within 48 hours to avoid delays in accessing your portal.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="font-size: 12px; color: #666;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
              </p>

              <p style="font-size: 12px; color: #666;">
                If you have any questions or need assistance, please contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color: #4f46e5;">${SUPPORT_EMAIL}</a>
              </p>

              <p style="font-size: 12px; color: #999; margin-top: 30px;">
                This email was sent to you as part of your onboarding with Innspired Accountancy.
                Identity verification is required by UK Money Laundering Regulations 2017.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("KYC verification email sent successfully to:", email);
  } catch (error) {
    console.error("Failed to send KYC verification email:", error);
    // Don't throw - email failures shouldn't block the onboarding flow
  }
}
