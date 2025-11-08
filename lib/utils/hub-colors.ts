/**
 * Hub Color Utilities
 *
 * Centralized hub color constants and gradient utility functions for Practice Hub.
 * Provides consistent color management across all hub modules.
 *
 * @module hub-colors
 */

/**
 * Hub color mapping for all Practice Hub modules.
 *
 * Each hub has a unique color identity used for:
 * - Header and sidebar styling
 * - Interactive card gradient accents
 * - Active state indicators
 * - Visual module differentiation
 *
 * @example
 * ```tsx
 * import { HUB_COLORS } from '@/lib/utils/hub-colors';
 *
 * const headerColor = HUB_COLORS['client-hub']; // "#3b82f6"
 * ```
 */
export const HUB_COLORS = {
  "practice-hub": "oklch(0.56 0.15 196.6)", // Teal (EXACT landing page CTA color)
  "client-hub": "#3b82f6", // Blue
  "proposal-hub": "#ec4899", // Pink
  "employee-hub": "#10b981", // Emerald
  "social-hub": "#8b5cf6", // Purple
  "portal-hub": "#4f46e5", // Indigo
  "admin-hub": "#f97316", // Orange
  "bookkeeping-hub": "#f59e0b", // Amber (planned)
  "accounts-hub": "#06b6d4", // Cyan (planned)
  "payroll-hub": "#84cc16", // Lime (planned)
} as const;

/**
 * Type representing valid hub names.
 *
 * @example
 * ```tsx
 * import type { HubName } from '@/lib/utils/hub-colors';
 *
 * function getHubColor(hub: HubName): string {
 *   return HUB_COLORS[hub];
 * }
 * ```
 */
export type HubName = keyof typeof HUB_COLORS;

/**
 * Gradient mapping for hub colors.
 *
 * Each gradient transitions from the primary hub color to a darker shade,
 * creating visual depth for interactive elements like card accent bars.
 */
const HUB_GRADIENTS: Record<string, string> = {
  "oklch(0.56 0.15 196.6)":
    "linear-gradient(90deg, oklch(0.56 0.15 196.6), oklch(0.48 0.14 196.6))", // Teal gradient (Practice Hub)
  "#3b82f6": "linear-gradient(90deg, #3b82f6, #2563eb)", // Blue gradient (Client Hub)
  "#ec4899": "linear-gradient(90deg, #ec4899, #db2777)", // Pink gradient (Proposal Hub)
  "#10b981": "linear-gradient(90deg, #10b981, #059669)", // Emerald gradient (Employee Hub)
  "#8b5cf6": "linear-gradient(90deg, #8b5cf6, #7c3aed)", // Purple gradient (Social Hub)
  "#4f46e5": "linear-gradient(90deg, #4f46e5, #4338ca)", // Indigo gradient (Portal Hub)
  "#f97316": "linear-gradient(90deg, #f97316, #ea580c)", // Orange gradient (Admin Hub)
  "#f59e0b": "linear-gradient(90deg, #f59e0b, #d97706)", // Amber gradient (Bookkeeping Hub)
  "#06b6d4": "linear-gradient(90deg, #06b6d4, #0891b2)", // Cyan gradient (Accounts Hub)
  "#84cc16": "linear-gradient(90deg, #84cc16, #65a30d)", // Lime gradient (Payroll Hub)
} as const;

/**
 * Gets the gradient string for a given hub color.
 *
 * Returns a CSS linear-gradient string that transitions from the primary
 * hub color to a darker shade. Used for interactive card accent bars,
 * hover effects, and visual depth indicators.
 *
 * @param hubColor - The hex color code of the hub (e.g., "#3b82f6")
 * @returns CSS linear-gradient string for the hub color
 *
 * @example
 * ```tsx
 * import { getHubGradient } from '@/lib/utils/hub-colors';
 *
 * const gradient = getHubGradient("#3b82f6");
 * // Returns: "linear-gradient(90deg, #3b82f6, #2563eb)"
 *
 * // Unknown color defaults to blue gradient
 * const unknownGradient = getHubGradient("#ff0000");
 * // Returns: "linear-gradient(90deg, #3b82f6, #2563eb)"
 * ```
 *
 * @example
 * ```tsx
 * // Usage in CardInteractive component
 * <div
 *   style={{
 *     background: getHubGradient(moduleColor),
 *   }}
 * />
 * ```
 */
export function getHubGradient(hubColor: string): string {
  return HUB_GRADIENTS[hubColor] || HUB_GRADIENTS["#3b82f6"];
}
