import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const authContext = await requireAdmin();

    // Get all users for this tenant
    const allUsers = await db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        status: users.status,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.tenantId, authContext.tenantId));

    // Calculate stats
    const stats = {
      total: allUsers.length,
      active: allUsers.filter((u) => u.isActive).length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      accountants: allUsers.filter((u) => u.role === "accountant").length,
      members: allUsers.filter((u) => u.role === "member").length,
    };

    return NextResponse.json({ users: allUsers, stats });
  } catch (error) {
    console.error("Users API: Failed to fetch users", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
