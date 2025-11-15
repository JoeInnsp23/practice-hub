"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getHubGradient,
  HUB_COLORS,
  type HubName,
} from "@/lib/utils/hub-colors";

/**
 * Result of the useHubColor hook.
 */
export interface UseHubColorResult {
  /**
   * The current hub color (e.g., "#3b82f6" for client-hub).
   * Falls back to practice-hub teal if no hub context is detected.
   */
  hubColor: string;

  /**
   * CSS gradient string for the current hub color.
   */
  hubGradient: string;

  /**
   * Whether a hub context was successfully detected.
   */
  isHubContext: boolean;

  /**
   * The detected hub name (e.g., "client-hub", "admin-hub").
   */
  hubName: HubName | null;
}

/**
 * React hook that provides access to the current hub's color scheme.
 *
 * This hook attempts to read the `--hub-color` CSS variable from the nearest
 * `[data-hub-root]` element. If that fails, it falls back to detecting the hub
 * from the current pathname (e.g., `/admin-hub/...` → admin-hub orange).
 *
 * **Use Cases:**
 * - Client components that need dynamic hub colors
 * - Components that can't rely on CSS variables alone
 * - Inline styles or JavaScript-based color calculations
 *
 * **Performance:**
 * - Uses browser APIs (getComputedStyle, querySelector) - client-side only
 * - Handles SSR safely with fallback logic
 * - Caches the hub color to avoid repeated DOM queries
 *
 * @example
 * ```tsx
 * import { useHubColor } from "@/lib/hooks/use-hub-color";
 *
 * function MyComponent() {
 *   const { hubColor, hubGradient, isHubContext } = useHubColor();
 *
 *   return (
 *     <div style={{ background: hubGradient }}>
 *       <p style={{ color: hubColor }}>Hub-specific content</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditionally apply hub color for charts
 * function ChartComponent() {
 *   const { hubColor, isHubContext } = useHubColor();
 *
 *   const chartOptions = {
 *     colors: [hubColor, '#gray-500', '#gray-300'],
 *   };
 *
 *   return <Chart options={chartOptions} />;
 * }
 * ```
 *
 * @returns Hub color information including color, gradient, and context detection
 */
export function useHubColor(): UseHubColorResult {
  const pathname = usePathname();
  const [hubColor, setHubColor] = useState<string>(HUB_COLORS["practice-hub"]);
  const [isHubContext, setIsHubContext] = useState(false);
  const [hubName, setHubName] = useState<HubName | null>(null);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") {
      return;
    }

    // Strategy 1: Read --hub-color from [data-hub-root] element (most accurate)
    const hubRoot = document.querySelector("[data-hub-root]");
    if (hubRoot) {
      const computedStyle = getComputedStyle(hubRoot);
      const color = computedStyle.getPropertyValue("--hub-color").trim();

      if (color) {
        setHubColor(color);
        setIsHubContext(true);

        // Try to determine hub name from color value
        const detectedHub = (Object.keys(HUB_COLORS) as HubName[]).find(
          (key) => HUB_COLORS[key] === color,
        );
        if (detectedHub) {
          setHubName(detectedHub);
        }
        return;
      }
    }

    // Strategy 2: Fallback to pathname detection
    const pathSegments = pathname.split("/").filter(Boolean);
    const firstSegment = pathSegments[0];

    // Check if first segment matches a known hub
    const detectedHub = (Object.keys(HUB_COLORS) as HubName[]).find(
      (key) => key === firstSegment,
    );

    if (detectedHub) {
      setHubColor(HUB_COLORS[detectedHub]);
      setHubName(detectedHub);
      setIsHubContext(true);
    } else {
      // Default to practice-hub teal
      setHubColor(HUB_COLORS["practice-hub"]);
      setHubName("practice-hub");
      setIsHubContext(false);
    }
  }, [pathname]);

  return {
    hubColor,
    hubGradient: getHubGradient(hubColor),
    isHubContext,
    hubName,
  };
}
