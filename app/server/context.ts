import { auth, getAuthContext } from "@/lib/auth";
import {
  clientPortalAuth,
  getClientPortalAuthContext,
} from "@/lib/client-portal-auth";

export const createContext = async () => {
  // Get Better Auth session (staff)
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  // Get our app's auth context (with tenant info)
  const authContext = await getAuthContext();

  // Get Client Portal Auth session (external clients)
  const clientPortalSession = await clientPortalAuth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  // Get client portal auth context (with client access info)
  const clientPortalAuthContext = await getClientPortalAuthContext();

  return {
    session,
    authContext,
    clientPortalSession,
    clientPortalAuthContext,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
