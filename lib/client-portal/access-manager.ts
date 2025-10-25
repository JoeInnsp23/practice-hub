import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientPortalAccess,
  clientPortalInvitations,
  clientPortalUsers,
  clients,
} from "@/lib/db/schema";
import { sendClientPortalInvitationEmail } from "@/lib/email/send-client-portal-invitation";

/**
 * Multi-Client Portal Access Manager
 *
 * Handles creation and management of client portal users with support for:
 * - Multiple clients per user
 * - Automatic user creation or access addition
 * - Invitation email management
 */

export interface PortalUserResult {
  portalUserId: string;
  isNewUser: boolean;
  email: string;
}

/**
 * Get existing portal user or create a new one
 *
 * @param email - User's email address
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param tenantId - Tenant ID
 * @returns Portal user info indicating if user is new
 */
export async function getOrCreatePortalUser(
  email: string,
  firstName: string,
  lastName: string,
  tenantId: string,
): Promise<PortalUserResult> {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(clientPortalUsers)
    .where(eq(clientPortalUsers.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      portalUserId: existingUser[0].id,
      isNewUser: false,
      email: existingUser[0].email,
    };
  }

  // Create new portal user
  const [newUser] = await db
    .insert(clientPortalUsers)
    .values({
      id: crypto.randomUUID(),
      tenantId,
      email,
      firstName,
      lastName,
      status: "invited",
      // Password will be set when they accept invitation
    })
    .returning();

  return {
    portalUserId: newUser.id,
    isNewUser: true,
    email: newUser.email,
  };
}

/**
 * Grant a portal user access to a client
 *
 * @param portalUserId - Portal user ID
 * @param clientId - Client ID
 * @param role - Access role (viewer, editor, admin)
 * @param grantedBy - User ID who granted access (internal staff)
 * @param tenantId - Tenant ID
 */
export async function grantClientAccess(
  portalUserId: string,
  clientId: string,
  role: "viewer" | "editor" | "admin",
  grantedBy: string | null,
  tenantId: string,
): Promise<void> {
  // Check if access already exists
  const existingAccess = await db
    .select()
    .from(clientPortalAccess)
    .where(
      and(
        eq(clientPortalAccess.portalUserId, portalUserId),
        eq(clientPortalAccess.clientId, clientId),
      ),
    )
    .limit(1);

  if (existingAccess.length > 0) {
    // Update existing access
    await db
      .update(clientPortalAccess)
      .set({
        role,
        isActive: true,
        grantedBy,
        grantedAt: new Date(),
      })
      .where(eq(clientPortalAccess.id, existingAccess[0].id));
  } else {
    // Create new access
    await db.insert(clientPortalAccess).values({
      tenantId,
      portalUserId,
      clientId,
      role,
      isActive: true,
      grantedBy,
      grantedAt: new Date(),
    });
  }
}

/**
 * Send portal invitation email to user
 *
 * @param portalUserId - Portal user ID
 * @param clientId - Client ID
 * @param isNewUser - Whether this is a new user or adding to existing
 * @param invitedBy - Staff member who sent invitation
 * @param customMessage - Optional custom message
 */
export async function sendPortalInvitation(
  portalUserId: string,
  clientId: string,
  _isNewUser: boolean,
  invitedBy: { firstName: string; lastName: string },
  customMessage?: string,
): Promise<void> {
  // Get portal user details
  const [portalUser] = await db
    .select()
    .from(clientPortalUsers)
    .where(eq(clientPortalUsers.id, portalUserId))
    .limit(1);

  if (!portalUser) {
    throw new Error("Portal user not found");
  }

  // Get client details
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error("Client not found");
  }

  // Generate invitation token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Store invitation (clientIds is JSONB array, not individual clientId)
  await db.insert(clientPortalInvitations).values({
    tenantId: client.tenantId,
    email: portalUser.email,
    firstName: portalUser.firstName || "",
    lastName: portalUser.lastName || "",
    clientIds: [clientId], // Store as array in JSONB field
    token,
    expiresAt,
    invitedBy: `${invitedBy.firstName} ${invitedBy.lastName}`,
    metadata: customMessage ? { customMessage } : undefined, // Store in metadata JSONB field
    status: "pending", // Default status is "pending", not "sent"
  });

  // Send invitation email
  await sendClientPortalInvitationEmail({
    email: portalUser.email,
    firstName: portalUser.firstName || "",
    lastName: portalUser.lastName || "",
    clientNames: [client.name], // Multiple clients supported, pass as array
    invitedBy: `${invitedBy.firstName} ${invitedBy.lastName}`,
    invitationLink: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/portal/accept/${token}`,
    expiresAt,
    customMessage,
  });
}

/**
 * Check if a portal user has access to a specific client
 *
 * @param portalUserId - Portal user ID
 * @param clientId - Client ID
 * @returns Whether user has active access
 */
export async function hasClientAccess(
  portalUserId: string,
  clientId: string,
): Promise<boolean> {
  const access = await db
    .select()
    .from(clientPortalAccess)
    .where(
      and(
        eq(clientPortalAccess.portalUserId, portalUserId),
        eq(clientPortalAccess.clientId, clientId),
        eq(clientPortalAccess.isActive, true),
      ),
    )
    .limit(1);

  return access.length > 0;
}

/**
 * Get all clients a portal user has access to
 *
 * @param portalUserId - Portal user ID
 * @returns Array of client IDs and roles
 */
export async function getUserClientAccess(portalUserId: string): Promise<
  Array<{
    clientId: string;
    clientName: string | null;
    role: string | null;
  }>
> {
  const access = await db
    .select({
      clientId: clientPortalAccess.clientId,
      clientName: clients.name,
      role: clientPortalAccess.role,
    })
    .from(clientPortalAccess)
    .innerJoin(clients, eq(clientPortalAccess.clientId, clients.id))
    .where(
      and(
        eq(clientPortalAccess.portalUserId, portalUserId),
        eq(clientPortalAccess.isActive, true),
      ),
    );

  return access;
}
