/**
 * Global type augmentation for tRPC Parser
 * Ensures TypeScript recognizes Zod's .parse() method on tRPC procedure input schemas
 */

import type { ZodTypeAny } from "zod";

declare module "@trpc/server" {
  interface Parser extends ZodTypeAny {}
}
