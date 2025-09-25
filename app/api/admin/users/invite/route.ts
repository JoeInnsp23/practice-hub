import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const authContext = await requireAdmin();
    const body = await req.json();

    const { email, firstName, lastName, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(eq(users.email, email), eq(users.tenantId, authContext.tenantId)),
      )
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // In production, you would use Clerk's invitation API here
    // For now, we'll just create a placeholder
    // const invitation = await clerkClient.invitations.createInvitation({
    //   emailAddress: email,
    //   publicMetadata: {
    //     tenantId: authContext.tenantId,
    //     role: role,
    //     firstName: firstName,
    //     lastName: lastName,
    //   },
    //   redirectUrl: '/sign-up',
    // });

    // For development, we'll just return success
    // In production, the invitation would be sent via Clerk
    return NextResponse.json({
      success: true,
      message:
        "Invitation functionality will be implemented with Clerk invitations",
      email,
    });
  } catch (error) {
    console.error("Invite API: Failed to send invitation", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 },
    );
  }
}
