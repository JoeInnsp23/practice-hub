import { eq } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UserManagementClient } from "./user-management-client";

export default async function UserManagementPage() {
  const authContext = await getAuthContext();
  if (!authContext) return null;

  // Get all users for this tenant
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      isActive: users.isActive,
      departmentId: users.departmentId,
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

  return (
    <UserManagementClient
      initialUsers={allUsers}
      stats={stats}
      currentUserId={authContext.userId}
      tenantId={authContext.tenantId}
    />
  );
}
