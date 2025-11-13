import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

/**
 * Better Auth client for React Native
 * Connects to the same Better Auth API as the web app
 *
 * Set EXPO_PUBLIC_API_URL in .env.local:
 * - Local development: http://localhost:3000 or http://YOUR_IP:3000
 * - Production: https://your-domain.com
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [organizationClient()],
});

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Sign in failed",
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Sign in failed",
    };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  try {
    await authClient.signOut();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Sign out failed",
    };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const result = await authClient.getSession();

    if (!result.data) {
      return {
        success: false,
        session: null,
      };
    }

    return {
      success: true,
      session: result.data,
    };
  } catch (error: any) {
    return {
      success: false,
      session: null,
      error: error.message,
    };
  }
}
