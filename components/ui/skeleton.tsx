import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("rounded-md", {
  variants: {
    variant: {
      default: "[background:var(--skeleton-color)] animate-pulse",
      shimmer: "skeleton-shimmer",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface SkeletonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof skeletonVariants> {
  /**
   * Optional hub color to use for the skeleton.
   * When provided, the skeleton will use this color instead of the default accent color.
   * Useful for maintaining hub-specific color consistency across loading states.
   *
   * @example
   * ```tsx
   * import { HUB_COLORS } from "@/lib/utils/hub-colors";
   *
   * <Skeleton hubColor={HUB_COLORS["admin-hub"]} className="h-4 w-32" />
   * ```
   */
  hubColor?: string;
}

/**
 * Skeleton - A loading placeholder component.
 *
 * Features:
 * - Default pulse animation variant
 * - Shimmer animation variant for smoother loading
 * - Dark mode compatible
 * - Hub-aware color support via hubColor prop
 *
 * @example
 * ```tsx
 * // Default pulse animation
 * <Skeleton className="h-4 w-32" />
 *
 * // Shimmer animation
 * <Skeleton variant="shimmer" className="h-4 w-32" />
 *
 * // Hub-specific color
 * <Skeleton hubColor={HUB_COLORS["admin-hub"]} className="h-4 w-32" />
 * ```
 */
function Skeleton({
  className,
  variant,
  hubColor,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant, className }))}
      style={
        hubColor
          ? ({ ...style, "--skeleton-color": hubColor } as React.CSSProperties)
          : style
      }
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
