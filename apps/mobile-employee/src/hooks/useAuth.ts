import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth-token";
const USER_KEY = "auth-user";

interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: "admin" | "staff";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Authentication hook using Better Auth + SecureStore
 * Manages auth state and token storage
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // TODO: Call Better Auth API via tRPC
      // const result = await trpc.auth.signIn.mutate({ email, password });

      // For now, mock response
      const mockUser: User = {
        id: "1",
        email,
        name: "Test User",
        tenantId: "tenant-1",
        role: "staff",
      };
      const mockToken = "mock-token-123";

      // Store in SecureStore
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, mockToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(mockUser)),
      ]);

      setAuthState({
        user: mockUser,
        token: mockToken,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      console.error("Sign in failed:", error);
      return { success: false, error: "Invalid credentials" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);

      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      return { success: true };
    } catch (error) {
      console.error("Sign out failed:", error);
      return { success: false, error: "Failed to sign out" };
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        // TODO: Call Better Auth API via tRPC
        // const result = await trpc.auth.signUp.mutate({ email, password, name });

        return { success: true };
      } catch (error) {
        console.error("Sign up failed:", error);
        return { success: false, error: "Sign up failed" };
      }
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      // TODO: Call Better Auth API via tRPC
      // const result = await trpc.auth.resetPassword.mutate({ email });

      return { success: true };
    } catch (error) {
      console.error("Reset password failed:", error);
      return { success: false, error: "Reset password failed" };
    }
  }, []);

  return {
    ...authState,
    signIn,
    signOut,
    signUp,
    resetPassword,
  };
}
