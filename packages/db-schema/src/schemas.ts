import { z } from "zod";

/**
 * Example: Re-export your Drizzle schema types here
 * These will be shared between web and mobile apps
 */

// Placeholder - you'll move your actual schema here
export const exampleSchema = z.object({
  id: z.string(),
  name: z.string(),
});
