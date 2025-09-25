import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.warn("Auth: No current user found");
      return null;
    }

    // Look up the user's tenant from the database
    const userRecord = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        role: users.role,
        email: users.email,
        tenantName: tenants.name,
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      console.warn("Auth: User not found in users table");

      // For development, auto-register the user with a default tenant
      if (process.env.NODE_ENV === "development") {
        // Check if we have a default tenant
        const defaultTenant = await db.select().from(tenants).limit(1);

        if (defaultTenant.length > 0) {
          console.info("Auth: Auto-registering user in development");

          const newUser = await db
            .insert(users)
            .values({
              tenantId: defaultTenant[0].id,
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
              role: "member", // Default role
            })
            .returning();

          return {
            userId: clerkUser.id,
            tenantId: defaultTenant[0].id,
            organizationName: defaultTenant[0].name,
            role: "member",
            email: newUser[0].email,
          };
        }
      }

      return null;
    }

    const { tenantId, role, email, tenantName } = userRecord[0];

    return {
      userId: clerkUser.id,
      tenantId,
      organizationName: tenantName,
      role,
      email,
    };
  } catch (error) {
    console.error("Auth: Failed to get auth context", error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthContext> {
  const authContext = await getAuthContext();

  if (!authContext) {
    throw new Error("Unauthorized");
  }

  return authContext;
}

export async function requireAdmin(): Promise<AuthContext> {
  const authContext = await requireAuth();

  // Check for both old and new admin role formats
  if (authContext.role !== "admin" && authContext.role !== "org:admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return authContext;
}
