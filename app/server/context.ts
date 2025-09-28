import { auth } from "@clerk/nextjs/server";
import { getAuthContext } from "@/lib/auth";

export const createContext = async () => {
  // Get Clerk auth object
  const clerkAuth = await auth();

  // Get our app's auth context (with tenant info)
  const authContext = await getAuthContext();

  return {
    auth: clerkAuth,
    authContext,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;