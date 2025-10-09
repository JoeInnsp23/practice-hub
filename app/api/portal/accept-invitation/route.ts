import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientPortalInvitations,
  clientPortalUsers,
  clientPortalAccounts,
  clientPortalAccess,
  clients,
} from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find and validate invitation
    const [invitation] = await db
      .select()
      .from(clientPortalInvitations)
      .where(eq(clientPortalInvitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: `This invitation has already been ${invitation.status}` },
        { status: 400 },
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.email, invitation.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID for Better Auth
    const userId = crypto.randomUUID();

    // Create portal user
    const [newUser] = await db
      .insert(clientPortalUsers)
      .values({
        id: userId,
        tenantId: invitation.tenantId,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        status: "active",
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.sentAt,
        acceptedAt: new Date(),
      })
      .returning();

    // Create Better Auth account (email/password provider)
    await db.insert(clientPortalAccounts).values({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: invitation.email,
      providerId: "credential",
      password: hashedPassword,
    });

    // Create client access records for all clients in invitation
    const clientIds = invitation.clientIds as string[];
    const accessPromises = clientIds.map((clientId) =>
      db.insert(clientPortalAccess).values({
        tenantId: invitation.tenantId,
        portalUserId: userId,
        clientId,
        role: invitation.role,
        grantedBy: invitation.invitedBy,
        isActive: true,
      }),
    );

    await Promise.all(accessPromises);

    // Update invitation status
    await db
      .update(clientPortalInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(clientPortalInvitations.id, invitation.id));

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: newUser.id,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 },
    );
  }
}
