import bcrypt from "bcryptjs";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// Separate Better Auth instance for external client portal
// This ensures complete isolation from internal staff authentication
export const clientPortalAuth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      // Map to client portal specific tables
      user: schema.clientPortalUsers,
      session: schema.clientPortalSessions,
      account: schema.clientPortalAccounts,
      verification: schema.clientPortalVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Invitations handle verification
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
    sendResetPassword: async ({ user, url }) => {
      const { sendClientPortalPasswordResetEmail } = await import(
        "@/lib/email-client-portal"
      );
      await sendClientPortalPasswordResetEmail({
        email: user.email,
        userName: user.name || user.email,
        resetLink: url,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days for client convenience
    updateAge: 60 * 60 * 24 * 7, // 7 days (update session if older than this)
  },
  // No social providers for client portal (email/password only)
  // No organization plugin (clients don't create orgs)
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.CLIENT_PORTAL_URL || "http://localhost:3000",
  ],
  basePath: "/api/client-portal-auth", // Different base path for isolation
});

// Client Portal Auth Context
export interface ClientPortalAuthContext {
  portalUserId: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  // Access to clients this user can view
  clientAccess: Array<{
    clientId: string;
    clientName: string;
    role: string;
    isActive: boolean;
  }>;
  // Currently selected client (for multi-client users)
  currentClientId?: string;
}

export async function getClientPortalAuthContext(
  selectedClientId?: string,
): Promise<ClientPortalAuthContext | null> {
  try {
    // Get the current session from Client Portal Auth
    const session = await clientPortalAuth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session || !session.user) {
      return null;
    }

    // Look up the portal user and their client access
    const { eq, and } = await import("drizzle-orm");
    const { clientPortalUsers, clientPortalAccess, clients } = await import(
      "@/lib/db/schema"
    );

    const portalUserRecord = await db
      .select({
        id: clientPortalUsers.id,
        tenantId: clientPortalUsers.tenantId,
        email: clientPortalUsers.email,
        firstName: clientPortalUsers.firstName,
        lastName: clientPortalUsers.lastName,
        status: clientPortalUsers.status,
      })
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.id, session.user.id))
      .limit(1);

    if (portalUserRecord.length === 0) {
      console.warn(
        "Client Portal Auth: User not found in client_portal_users table",
      );
      return null;
    }

    const user = portalUserRecord[0];

    // Check user status
    if (user.status !== "active") {
      console.warn("Client Portal Auth: User is not active", user.status);
      return null;
    }

    // Get all clients this user has access to
    const accessRecords = await db
      .select({
        clientId: clientPortalAccess.clientId,
        clientName: clients.name,
        role: clientPortalAccess.role,
        isActive: clientPortalAccess.isActive,
      })
      .from(clientPortalAccess)
      .innerJoin(clients, eq(clientPortalAccess.clientId, clients.id))
      .where(
        and(
          eq(clientPortalAccess.portalUserId, user.id),
          eq(clientPortalAccess.isActive, true),
        ),
      );

    if (accessRecords.length === 0) {
      console.warn("Client Portal Auth: User has no active client access");
      return null;
    }

    // Determine current client
    let currentClientId = selectedClientId;
    if (
      !currentClientId ||
      !accessRecords.find((a) => a.clientId === currentClientId)
    ) {
      // Default to first client if no selection or invalid selection
      currentClientId = accessRecords[0].clientId;
    }

    return {
      portalUserId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      clientAccess: accessRecords.map((r) => ({
        clientId: r.clientId,
        clientName: r.clientName,
        role: r.role,
        isActive: r.isActive,
      })),
      currentClientId,
    };
  } catch (error: unknown) {
    console.error("Client Portal Auth: Failed to get auth context", error);
    return null;
  }
}

export async function requireClientPortalAuth(
  selectedClientId?: string,
): Promise<ClientPortalAuthContext> {
  const authContext = await getClientPortalAuthContext(selectedClientId);

  if (!authContext) {
    throw new Error("Unauthorized");
  }

  return authContext;
}
