import { toNextJsHandler } from "better-auth/next-js";
import { clientPortalAuth } from "@/lib/client-portal-auth";

export const runtime = "nodejs"; // Required for Better Auth

// Client Portal authentication API endpoint
// Completely separate from staff authentication
export const { POST, GET } = toNextJsHandler(clientPortalAuth);
