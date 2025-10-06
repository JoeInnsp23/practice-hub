import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, organizationName } = body;

    if (!firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already has a tenant
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].tenantId) {
      return NextResponse.json(
        { error: "User already has an organization" },
        { status: 400 },
      );
    }

    // Create tenant
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Generate a unique ID for the tenant
    const tenantId = crypto.randomUUID();

    const [tenant] = await db
      .insert(tenants)
      .values({
        id: tenantId,
        name: organizationName,
        slug,
      })
      .returning();

    // Update user with tenant and details
    await db
      .update(users)
      .set({
        tenantId: tenant.id,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: "org:admin", // First user is admin
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, tenantId: tenant.id });
  } catch (error) {
    console.error("Setup tenant error:", error);
    return NextResponse.json(
      { error: "Failed to setup organization" },
      { status: 500 },
    );
  }
}
