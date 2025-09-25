import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await requireAdmin();
    const body = await req.json();
    const { id } = await params;

    // Don't allow users to change their own role
    if (id === authContext.userId && body.role) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 },
      );
    }

    const updatedUser = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(eq(users.id, id), eq(users.tenantId, authContext.tenantId)),
      )
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser[0] });
  } catch (error) {
    console.error("Users API: Failed to update user", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authContext = await requireAdmin();
    const { id } = await params;

    // Don't allow users to delete themselves
    if (id === authContext.userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    const deletedUser = await db
      .delete(users)
      .where(
        and(eq(users.id, id), eq(users.tenantId, authContext.tenantId)),
      )
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Users API: Failed to delete user", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
