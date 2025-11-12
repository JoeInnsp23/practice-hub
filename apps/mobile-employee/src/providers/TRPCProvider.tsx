import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@practice-hub/api-client";
import superjson from "superjson";

/**
 * tRPC Provider for React Native
 * This wraps your app and provides tRPC hooks to all components
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // Change this to your API URL
          // In production: https://api.practicehub.com/api/trpc
          // In development: http://localhost:3000/api/trpc
          url: "http://localhost:3000/api/trpc",

          // Add authentication headers here
          async headers() {
            // TODO: Get auth token from SecureStore or AsyncStorage
            // const token = await SecureStore.getItemAsync('auth-token');
            return {
              // authorization: token ? `Bearer ${token}` : '',
            };
          },

          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
