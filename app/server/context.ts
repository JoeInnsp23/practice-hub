import { auth, getAuthContext } from "@/lib/auth";

export const createContext = async () => {
  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  // Get our app's auth context (with tenant info)
  const authContext = await getAuthContext();

  return {
    session,
    authContext,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
