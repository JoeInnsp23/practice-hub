import { getAuthContext } from "@/lib/auth";
import { EmployeeHubDashboard } from "./employee-hub-dashboard";

export default async function EmployeeHubPage() {
  const authContext = await getAuthContext();

  // Get the user's name from our database context
  const userName = authContext?.firstName || authContext?.email?.split("@")[0];

  return <EmployeeHubDashboard userName={userName} />;
}
