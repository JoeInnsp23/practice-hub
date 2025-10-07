import { render } from "@react-email/components";
import { Resend } from "resend";
import { LeadThankYouEmail } from "./templates/lead-thank-you";
import { NewLeadNotificationEmail } from "./templates/new-lead-notification";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendLeadThankYouParams {
  to: string; // Lead's email
  firstName: string;
  companyName: string;
  estimatedTurnover: number;
  interestedServices: string[];
}

export interface SendNewLeadNotificationParams {
  leadId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  businessType: string;
  industry: string;
  estimatedTurnover: number;
  estimatedEmployees: number;
  interestedServices: string[];
  notes?: string;
  viewLeadUrl: string;
}

/**
 * Send thank you email to the lead after form submission
 */
export async function sendLeadThankYouEmail(
  params: SendLeadThankYouParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = await render(LeadThankYouEmail(params));

    await resend.emails.send({
      from: "Innspired Accountancy <hello@innspiredaccountancy.com>",
      to: params.to,
      subject: "Thank you for your interest - Innspired Accountancy",
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send lead thank you email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification email to the team when a new lead is created
 */
export async function sendNewLeadNotificationEmail(
  params: SendNewLeadNotificationParams,
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailHtml = await render(NewLeadNotificationEmail(params));

    // Send to the internal team email
    await resend.emails.send({
      from: "Practice Hub <notifications@innspiredaccountancy.com>",
      to: "team@innspiredaccountancy.com", // Replace with actual team email
      subject: `🎉 New Lead: ${params.firstName} ${params.lastName} from ${params.companyName}`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send new lead notification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
