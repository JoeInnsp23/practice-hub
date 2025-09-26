import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UserManagementClient } from "./user-management-client";

export default async function UserManagementPage() {
  const authContext = await getAuthContext();
  if (!authContext) return null;

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

  // Calculate stats (checking both old and new role formats)
  const stats = {
    total: allUsers.length,
    active: allUsers.filter((u) => u.isActive).length,
    admins: allUsers.filter((u) => u.role === "admin" || u.role === "org:admin")
      .length,
    accountants: allUsers.filter(
      (u) => u.role === "accountant" || u.role === "org:accountant",
    ).length,
    members: allUsers.filter(
      (u) => u.role === "member" || u.role === "org:member",
    ).length,
  };

  return (
    <UserManagementClient
      initialUsers={allUsers}
      stats={stats}
      currentUserId={authContext.userId}
      tenantId={authContext.tenantId}
    />
  );
}
