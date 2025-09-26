import { getAuthContext } from "@/lib/auth";
import { ClientHubDashboard } from "./client-hub-dashboard";

export default async function ClientHubPage() {
  const authContext = await getAuthContext();

  // Get the user's name from our database context
  const userName = authContext?.email?.split("@")[0]; // Use email prefix as fallback name

  return <ClientHubDashboard userName={userName} />;
}
