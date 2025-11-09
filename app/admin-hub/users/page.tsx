import { getAuthContext } from "@/lib/auth";
import { UnifiedUserManagementClient } from "./unified-user-management-client";

export default async function UserManagementPage() {
  const authContext = await getAuthContext();
  if (!authContext) return null;

  return <UnifiedUserManagementClient />;
}
