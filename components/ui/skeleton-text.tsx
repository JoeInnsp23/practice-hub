import type * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Props for the SkeletonText component.
 */
interface SkeletonTextProps extends React.ComponentProps<"div"> {
  /**
   * Number of lines to display.
   * @default 3
   */
  lines?: number;

  /**
   * Whether the last line should be shorter.
   * @default true
   */
  lastLineShorter?: boolean;

  /**
   * Optional hub color for skeleton elements.
   */
  hubColor?: string;
}

/**
 * SkeletonText - A skeleton component that mimics text content.
 *
 * Features:
 * - Configurable number of lines
 * - Last line can be shorter (mimics paragraph ending)
 * - Uses shimmer animation for smooth loading
 *
 * @example
 * ```tsx
 * // Basic text skeleton (3 lines)
 * <SkeletonText />
 *
 * // Custom text skeleton
 * <SkeletonText lines={5} lastLineShorter={false} />
 * ```
 */
export function SkeletonText({
  className,
  lines = 3,
  lastLineShorter = true,
  hubColor,
  ...props
}: SkeletonTextProps) {
  return (
    <div
      data-slot="skeleton-text"
      className={cn("space-y-2", className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`skeleton-text-line-${i}`}
          variant="shimmer"
          hubColor={hubColor}
          className={cn(
            "h-4",
            lastLineShorter && i === lines - 1 ? "w-5/6" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
