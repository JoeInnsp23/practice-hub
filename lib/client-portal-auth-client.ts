"use client";

import { createAuthClient } from "better-auth/react";

// Client-side auth client for external client portal
// Isolated from staff authentication
export const clientPortalAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/client-portal-auth", // Different base path
  // No plugins - clients don't have organizations
});

// Export commonly used functions
export const {
  signIn: clientPortalSignIn,
  signUp: clientPortalSignUp,
  signOut: clientPortalSignOut,
  useSession: useClientPortalSession,
} = clientPortalAuthClient;
