import { render } from "@react-email/render";
import { InvitationEmail } from "@/emails/invitation-email";

// Email preview generator - returns HTML string for preview
export interface InvitationEmailPreviewParams {
	email: string;
	invitedByName: string;
	organizationName: string;
	customMessage?: string;
}

export async function generateInvitationEmailPreview(
	params: InvitationEmailPreviewParams,
): Promise<string> {
	const html = await render(
		InvitationEmail({
			invitedByName: params.invitedByName,
			organizationName: params.organizationName,
			inviteLink: "[Your Invitation Link]",
			customMessage: params.customMessage,
		}),
	);

	return html;
}
