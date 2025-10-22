import { z } from "zod";

/**
 * Schema for company/tenant settings stored in tenants.metadata JSONB
 */
export const companySettingsSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().default("United Kingdom"),
    }),
  }),
  regional: z.object({
    currency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
    dateFormat: z
      .enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"])
      .default("DD/MM/YYYY"),
    timezone: z.string().default("Europe/London"),
  }),
  fiscal: z.object({
    fiscalYearStart: z
      .string()
      .regex(/^\d{2}-\d{2}$/, "Format: MM-DD")
      .default("04-06"),
  }),
});

/**
 * Schema for user-scoped settings stored in userSettings table
 */
export const userSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  digestEmail: z.enum(["daily", "weekly", "never"]).default("daily"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es", "fr", "de"]).default("en"),
  timezone: z.string().default("Europe/London"),
});

/**
 * Type exports for use in tRPC procedures and components
 */
export type CompanySettings = z.infer<typeof companySettingsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
