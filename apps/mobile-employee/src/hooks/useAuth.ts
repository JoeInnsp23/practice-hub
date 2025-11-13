import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import * as authClient from "../lib/auth-client";

const SESSION_KEY = "better-auth-session";

interface User {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Authentication hook using Better Auth
 * Connects to the same Better Auth API as the web app
 * Stores session in SecureStore for persistence
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load stored session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      // Check if there's a stored session
      const storedSession = await SecureStore.getItemAsync(SESSION_KEY);

      if (storedSession) {
        const sessionData = JSON.parse(storedSession);

        // Verify session is still valid with Better Auth
        const result = await authClient.getSession();

        if (result.success && result.session) {
          setAuthState({
            user: result.session.user,
            isLoading: false,
            isAuthenticated: true,
          });
          return;
        }
      }

      // No valid session
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Failed to load session:", error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await authClient.signIn(email, password);

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Invalid credentials",
        };
      }

      // Get the session after successful sign in
      const sessionResult = await authClient.getSession();

      if (sessionResult.success && sessionResult.session) {
        // Store session in SecureStore
        await SecureStore.setItemAsync(
          SESSION_KEY,
          JSON.stringify(sessionResult.session),
        );

        setAuthState({
          user: sessionResult.session.user,
          isLoading: false,
          isAuthenticated: true,
        });

        return { success: true };
      }

      return { success: false, error: "Failed to get session" };
    } catch (error: any) {
      console.error("Sign in failed:", error);
      return {
        success: false,
        error: error.message || "Invalid credentials",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Call Better Auth sign out
      await authClient.signOut();

      // Clear SecureStore
      await SecureStore.deleteItemAsync(SESSION_KEY);

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Sign out failed:", error);
      return {
        success: false,
        error: error.message || "Failed to sign out",
      };
    }
  }, []);

  return {
    ...authState,
    signIn,
    signOut,
    refreshSession: loadSession,
  };
}
