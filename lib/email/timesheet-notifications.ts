import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Simple email sending function (using existing sendEmail pattern)
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // Import Resend dynamically to avoid initialization errors
  const { Resend } = await import("resend");

  if (!process.env.RESEND_API_KEY) {
    const error = new Error("RESEND_API_KEY is not set, skipping email");
    Sentry.captureException(error, {
      tags: { operation: "email_send", type: "config_missing" },
      extra: { recipient: to, subject },
    });
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM_EMAIL = "Practice Hub <noreply@notify.innspiredaccountancy.com>";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      const sendError = new Error(`Failed to send email: ${error.message}`);
      Sentry.captureException(sendError, {
        tags: { operation: "email_send", type: "resend_error" },
        extra: { recipient: to, subject, resendError: error },
      });
      throw sendError;
    }

    return data;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { operation: "email_send", type: "unexpected_error" },
      extra: { recipient: to, subject },
    });
    throw error;
  }
}

export async function sendTimesheetApprovalEmail({
  userId,
  weekStartDate,
  weekEndDate,
  managerName,
  totalHours,
}: {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  managerName: string;
  totalHours?: number;
}) {
  // Get user email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) {
    const error = new Error(`User ${userId} not found for timesheet approval email`);
    Sentry.captureException(error, {
      tags: { operation: "email_approval", type: "user_not_found" },
      extra: { userId, weekStartDate, weekEndDate },
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subject = `Timesheet Approved - Week of ${weekStartDate}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Timesheet Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${user[0].firstName || "there"},</p>

            <p>Your timesheet for the week of <strong>${weekStartDate}</strong> to <strong>${weekEndDate}</strong> has been approved by ${managerName}.</p>

            ${totalHours ? `<p><strong>Total Hours:</strong> ${totalHours}</p>` : ""}

            <p>You can view your timesheet anytime in the Practice Hub.</p>

            <a href="${appUrl}/client-hub/time" class="button">View Timesheet</a>
          </div>
          <div class="footer">
            <p>This is an automated message from Practice Hub</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user[0].email,
    subject,
    html,
  });
}

export async function sendTimesheetRejectionEmail({
  userId,
  weekStartDate,
  weekEndDate,
  managerName,
  rejectionReason,
}: {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  managerName: string;
  rejectionReason: string;
}) {
  // Get user email
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) {
    const error = new Error(`User ${userId} not found for timesheet rejection email`);
    Sentry.captureException(error, {
      tags: { operation: "email_rejection", type: "user_not_found" },
      extra: { userId, weekStartDate, weekEndDate, rejectionReason },
    });
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const subject = `Timesheet Rejected - Week of ${weekStartDate}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reason { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Timesheet Rejected</h1>
          </div>
          <div class="content">
            <p>Hi ${user[0].firstName || "there"},</p>

            <p>Your timesheet for the week of <strong>${weekStartDate}</strong> to <strong>${weekEndDate}</strong> has been rejected by ${managerName}.</p>

            <div class="reason">
              <strong>Reason:</strong><br>
              ${rejectionReason}
            </div>

            <p>Please review and correct your timesheet, then resubmit for approval.</p>

            <a href="${appUrl}/client-hub/time" class="button">Edit & Resubmit Timesheet</a>
          </div>
          <div class="footer">
            <p>This is an automated message from Practice Hub</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: user[0].email,
    subject,
    html,
  });
}
