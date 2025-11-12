import { z } from "zod";

/**
 * Shared types and schemas used across web and mobile apps
 */

// User types
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "staff", "client"]),
  tenantId: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Client types
export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tenantId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Client = z.infer<typeof clientSchema>;

// Multi-tenant auth context
export const authContextSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: z.enum(["admin", "staff", "client"]),
});

export type AuthContext = z.infer<typeof authContextSchema>;
