import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";

export interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface ClerkOrganizationMembership {
  organization?: {
    name?: string | null;
    slug?: string | null;
  } | null;
}

interface ClerkUserWithOrganizations {
  organizationMemberships?: ClerkOrganizationMembership[] | null;
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
        firstName: users.firstName,
        lastName: users.lastName,
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
        let defaultTenant = await db.select().from(tenants).limit(1);

        // If no tenant exists, create one
        if (defaultTenant.length === 0) {
          console.info("Auth: Creating default tenant");

          // Use Clerk organization data if available, otherwise use defaults
          const orgMemberships = (clerkUser as ClerkUserWithOrganizations)
            .organizationMemberships;
          const firstOrganization = orgMemberships?.[0]?.organization;
          const orgName = firstOrganization?.name || "Default Organization";
          const orgSlug = firstOrganization?.slug || "default";

          defaultTenant = await db
            .insert(tenants)
            .values({
              name: orgName,
              slug: orgSlug,
            })
            .returning();
        }

        if (defaultTenant.length > 0) {
          console.info("Auth: Auto-registering user in development");

          // Check if this is the first user (they should be admin)
          const existingUsers = await db
            .select()
            .from(users)
            .where(eq(users.tenantId, defaultTenant[0].id))
            .limit(1);

          const isFirstUser = existingUsers.length === 0;
          const userRole = isFirstUser ? "org:admin" : "org:member";

          const newUser = await db
            .insert(users)
            .values({
              tenantId: defaultTenant[0].id,
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
              role: userRole, // First user is admin, others are members
            })
            .returning();

          console.info(`Auth: User registered with role: ${userRole}`);

          return {
            userId: newUser[0].id,
            tenantId: defaultTenant[0].id,
            organizationName: defaultTenant[0].name,
            role: userRole,
            email: newUser[0].email,
            firstName: newUser[0].firstName,
            lastName: newUser[0].lastName,
          };
        }
      }

      return null;
    }

    const { id, tenantId, role, email, firstName, lastName, tenantName } =
      userRecord[0];

    return {
      userId: id,
      tenantId,
      organizationName: tenantName,
      role,
      email,
      firstName,
      lastName,
    };
  } catch (error: unknown) {
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
