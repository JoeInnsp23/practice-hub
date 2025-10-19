/**
 * Application Configuration
 *
 * Centralized configuration for environment variables and application settings.
 * All environment variables should be accessed through this file for better
 * maintainability and type safety.
 */

/**
 * Support email address for client communications
 *
 * Used in:
 * - Client portal onboarding pages
 * - Email templates
 * - Help/support links
 *
 * Default: support@innspiredaccountancy.com
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@innspiredaccountancy.com";

/**
 * Application name
 * Used in email templates and branding
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Practice Hub";

/**
 * Application URL
 * Used in email links and redirects
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";
