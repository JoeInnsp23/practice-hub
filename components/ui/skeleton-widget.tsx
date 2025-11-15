import type * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Props for the SkeletonWidget component.
 */
interface SkeletonWidgetProps extends React.ComponentProps<"div"> {
  /**
   * Title text to display (or skeleton if not provided).
   */
  title?: string;

  /**
   * Whether to show a chart/graph area.
   * @default false
   */
  showChart?: boolean;

  /**
   * Optional hub color for skeleton elements.
   */
  hubColor?: string;
}

/**
 * SkeletonWidget - A skeleton component that mimics a dashboard widget.
 *
 * Features:
 * - Optional title (or skeleton title)
 * - Optional chart/graph area
 * - Uses shimmer animation for smooth loading
 *
 * @example
 * ```tsx
 * // Basic widget skeleton
 * <SkeletonWidget />
 *
 * // Widget with chart area
 * <SkeletonWidget title="Loading..." showChart />
 * ```
 */
export function SkeletonWidget({
  className,
  title,
  showChart = false,
  hubColor,
  ...props
}: SkeletonWidgetProps) {
  return (
    <div
      data-slot="skeleton-widget"
      className={cn("glass-card rounded-lg p-6 space-y-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        {title ? (
          <h3 className="text-lg font-semibold">{title}</h3>
        ) : (
          <Skeleton
            variant="shimmer"
            hubColor={hubColor}
            className="h-6 w-32"
          />
        )}
        <Skeleton
          variant="shimmer"
          hubColor={hubColor}
          className="h-4 w-4 rounded"
        />
      </div>
      <div className="space-y-2">
        <Skeleton variant="shimmer" hubColor={hubColor} className="h-8 w-24" />
        <Skeleton variant="shimmer" hubColor={hubColor} className="h-4 w-40" />
      </div>
      {showChart && (
        <div className="pt-4">
          <Skeleton
            variant="shimmer"
            hubColor={hubColor}
            className="h-32 w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
