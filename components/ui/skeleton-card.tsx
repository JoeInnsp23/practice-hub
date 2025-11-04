import type * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Props for the SkeletonCard component.
 */
interface SkeletonCardProps extends React.ComponentProps<"div"> {
  /**
   * Number of text lines to show in the card.
   * @default 3
   */
  lines?: number;

  /**
   * Whether to show an avatar skeleton.
   * @default false
   */
  showAvatar?: boolean;

  /**
   * Whether to show action buttons.
   * @default false
   */
  showActions?: boolean;
}

/**
 * SkeletonCard - A skeleton component that mimics a card layout.
 *
 * Features:
 * - Configurable number of text lines
 * - Optional avatar skeleton
 * - Optional action buttons skeleton
 * - Uses shimmer animation for smooth loading
 *
 * @example
 * ```tsx
 * // Basic card skeleton
 * <SkeletonCard />
 *
 * // Card with avatar and actions
 * <SkeletonCard showAvatar showActions lines={4} />
 * ```
 */
export function SkeletonCard({
  className,
  lines = 3,
  showAvatar = false,
  showActions = false,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn("glass-card rounded-lg p-6 space-y-4", className)}
      {...props}
    >
      <div className="flex items-start gap-4">
        {showAvatar && (
          <Skeleton
            variant="shimmer"
            className="h-12 w-12 rounded-full shrink-0"
          />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant="shimmer" className="h-5 w-3/4" />
          <Skeleton variant="shimmer" className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={`skeleton-line-${i}`}
            variant="shimmer"
            className={cn("h-4", i === lines - 1 ? "w-5/6" : "w-full")}
          />
        ))}
      </div>
      {showActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton variant="shimmer" className="h-9 w-24" />
          <Skeleton variant="shimmer" className="h-9 w-24" />
        </div>
      )}
    </div>
  );
}
