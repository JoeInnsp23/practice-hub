import type * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Props for the SkeletonAvatar component.
 */
interface SkeletonAvatarProps extends React.ComponentProps<"div"> {
  /**
   * Size of the avatar.
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl";

  /**
   * Whether to show a badge indicator.
   * @default false
   */
  showBadge?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  default: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

/**
 * SkeletonAvatar - A skeleton component that mimics an avatar.
 *
 * Features:
 * - Multiple size variants (sm, default, lg, xl)
 * - Optional badge indicator
 * - Uses shimmer animation for smooth loading
 *
 * @example
 * ```tsx
 * // Basic avatar skeleton
 * <SkeletonAvatar />
 *
 * // Large avatar with badge
 * <SkeletonAvatar size="lg" showBadge />
 * ```
 */
export function SkeletonAvatar({
  className,
  size = "default",
  showBadge = false,
  ...props
}: SkeletonAvatarProps) {
  return (
    <div
      data-slot="skeleton-avatar"
      className={cn("relative inline-block", className)}
      {...props}
    >
      <Skeleton
        variant="shimmer"
        className={cn("rounded-full", sizeClasses[size])}
      />
      {showBadge && (
        <Skeleton
          variant="shimmer"
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background"
        />
      )}
    </div>
  );
}
