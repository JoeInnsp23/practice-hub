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
  "client-hub": "#3b82f6", // Blue
  admin: "#f97316", // Orange
  "employee-hub": "#10b981", // Emerald
  "proposal-hub": "#ec4899", // Pink
  "social-hub": "#8b5cf6", // Purple
  "practice-hub": "#2563eb", // Default blue
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
  "#3b82f6": "linear-gradient(90deg, #3b82f6, #2563eb)", // Blue gradient
  "#f97316": "linear-gradient(90deg, #f97316, #ea580c)", // Orange gradient
  "#10b981": "linear-gradient(90deg, #10b981, #059669)", // Emerald gradient
  "#ec4899": "linear-gradient(90deg, #ec4899, #db2777)", // Pink gradient
  "#8b5cf6": "linear-gradient(90deg, #8b5cf6, #7c3aed)", // Purple gradient
  "#2563eb": "linear-gradient(90deg, #2563eb, #1d4ed8)", // Practice Hub blue gradient
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
