import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

/**
 * OAuth Setup Handler
 *
 * This endpoint is called after a user signs in with Microsoft OAuth
 * to check if they need tenant assignment and organization setup.
 *
 * Flow:
 * 1. User signs in with Microsoft → Better Auth creates user account
 * 2. Redirect to this endpoint to check tenant status
 * 3. If no tenant, prompt for organization info
 * 4. Create tenant and assign user
 */

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
    const { organizationName, firstName, lastName } = body;

    // Check if user already has a tenant
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].tenantId) {
      return NextResponse.json(
        {
          hasTenant: true,
          tenantId: existingUser[0].tenantId,
        },
        { status: 200 },
      );
    }

    // If no organization name provided, just check status
    if (!organizationName) {
      return NextResponse.json(
        {
          hasTenant: false,
          needsSetup: true,
        },
        { status: 200 },
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

    // Extract name parts from session if not provided
    const userFirstName = firstName || session.user.name?.split(" ")[0] || "";
    const userLastName =
      lastName || session.user.name?.split(" ").slice(1).join(" ") || "";

    // Update user with tenant and details
    await db
      .update(users)
      .set({
        tenantId: tenant.id,
        firstName: userFirstName,
        lastName: userLastName,
        name: session.user.name || `${userFirstName} ${userLastName}`,
        role: "admin", // First user is admin
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      hasTenant: true,
    });
  } catch (error) {
    console.error("OAuth setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup organization" },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check if current user needs organization setup
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].tenantId) {
      return NextResponse.json({
        hasTenant: true,
        tenantId: existingUser[0].tenantId,
        needsSetup: false,
      });
    }

    return NextResponse.json({
      hasTenant: false,
      needsSetup: true,
    });
  } catch (error) {
    console.error("OAuth setup check error:", error);
    return NextResponse.json(
      { error: "Failed to check setup status" },
      { status: 500 },
    );
  }
}
