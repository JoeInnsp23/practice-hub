import { getAuthContext } from "@/lib/auth";
import { PracticeHubClient } from "./practice-hub-client";

export default async function PracticeHubPage() {
  const authContext = await getAuthContext();

  // Get the user's role and name from our database
  const userRole = authContext?.role;
  const userName = authContext?.email?.split("@")[0]; // Use email prefix as fallback name

  return <PracticeHubClient userRole={userRole} userName={userName} />;
}
