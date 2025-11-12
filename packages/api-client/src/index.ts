/**
 * Shared tRPC client for React Native mobile apps
 * This client can be used in both iOS and Android apps
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@practice-hub/db-schema";

/**
 * tRPC React hooks for mobile apps
 * Usage in mobile app:
 *
 * import { trpc } from '@practice-hub/api-client';
 *
 * function MyComponent() {
 *   const { data, isLoading } = trpc.clients.list.useQuery();
 *   return <Text>{data?.length} clients</Text>;
 * }
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC client for React Native
 * @param baseUrl - Your API base URL (e.g., 'https://api.practicehub.com' or 'http://localhost:3000')
 * @param getToken - Function to retrieve auth token (from SecureStore, AsyncStorage, etc.)
 */
export function createTRPCClient(
  baseUrl: string,
  getToken: () => Promise<string | null>,
) {
  return {
    links: [
      // You can add authentication headers here
      // httpBatchLink or httpLink configuration
    ],
  };
}

export type { AppRouter } from "@practice-hub/db-schema";
