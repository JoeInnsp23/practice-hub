import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const skeletonVariants = cva("rounded-md", {
  variants: {
    variant: {
      default: "bg-accent animate-pulse",
      shimmer: "skeleton-shimmer",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface SkeletonProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof skeletonVariants> {}

/**
 * Skeleton - A loading placeholder component.
 *
 * Features:
 * - Default pulse animation variant
 * - Shimmer animation variant for smoother loading
 * - Dark mode compatible
 *
 * @example
 * ```tsx
 * // Default pulse animation
 * <Skeleton className="h-4 w-32" />
 *
 * // Shimmer animation
 * <Skeleton variant="shimmer" className="h-4 w-32" />
 * ```
 */
function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Skeleton, skeletonVariants };
