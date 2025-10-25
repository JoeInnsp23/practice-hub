"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import superjson from "superjson";
import type { AppRouter } from "@/app/server";

export const trpc = createTRPCReact<AppRouter>();

// Export router output types for type-safe component props
export type RouterOutputs = inferRouterOutputs<AppRouter>;

function getBaseUrl() {
  if (typeof window !== "undefined") {
    // browser should use relative path
    return "";
  }
  // SSR should use absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          // Ensure cookies are sent with requests
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "same-origin",
            });
          },
          headers() {
            return {
              // Add any additional headers if needed
            };
          },
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
