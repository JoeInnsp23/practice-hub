import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientPortalInvitations } from "@/lib/db/schema";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 },
      );
    }

    // Find invitation by token
    const [invitation] = await db
      .select()
      .from(clientPortalInvitations)
      .where(eq(clientPortalInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}` },
        { status: 400 },
      );
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      // Update status to expired
      await db
        .update(clientPortalInvitations)
        .set({ status: "expired" })
        .where(eq(clientPortalInvitations.id, invitation.id));

      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Return invitation details (without sensitive info)
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Failed to verify invitation" },
      { status: 500 },
    );
  }
}
