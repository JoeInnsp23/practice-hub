import { Resend } from "resend";
import { LeaveRequestApprovedEmail } from "./templates/leave-request-approved";
import { LeaveRequestRejectedEmail } from "./templates/leave-request-rejected";
import { LeaveRequestSubmittedEmail } from "./templates/leave-request-submitted";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface LeaveNotificationData {
  to: string;
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  approverName?: string;
  comments?: string | null;
}

/**
 * Send email notification when a leave request is submitted
 */
export async function sendLeaveRequestSubmitted(
  data: Omit<LeaveNotificationData, "approverName" | "comments">,
) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - skipping email notification");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@practicehub.com",
      to: data.to,
      subject: "Leave Request Submitted",
      react: LeaveRequestSubmittedEmail(data),
    });

    if (error) {
      console.error("Failed to send leave request submitted email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send leave request submitted email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email notification when a leave request is approved
 */
export async function sendLeaveRequestApproved(data: LeaveNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - skipping email notification");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@practicehub.com",
      to: data.to,
      subject: "Leave Request Approved",
      react: LeaveRequestApprovedEmail(data),
    });

    if (error) {
      console.error("Failed to send leave request approved email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send leave request approved email:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send email notification when a leave request is rejected
 */
export async function sendLeaveRequestRejected(data: LeaveNotificationData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured - skipping email notification");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@practicehub.com",
      to: data.to,
      subject: "Leave Request Rejected",
      react: LeaveRequestRejectedEmail(data),
    });

    if (error) {
      console.error("Failed to send leave request rejected email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send leave request rejected email:", error);
    return { success: false, error: String(error) };
  }
}
