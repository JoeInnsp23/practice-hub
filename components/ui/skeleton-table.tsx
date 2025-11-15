import type * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

/**
 * Props for the SkeletonTable component.
 */
interface SkeletonTableProps extends React.ComponentProps<"div"> {
  /**
   * Number of rows to display.
   * @default 5
   */
  rows?: number;

  /**
   * Number of columns to display.
   * @default 4
   */
  columns?: number;

  /**
   * Whether to show a header row.
   * @default true
   */
  showHeader?: boolean;

  /**
   * Optional hub color for skeleton elements.
   */
  hubColor?: string;
}

/**
 * SkeletonTable - A skeleton component that mimics a table layout.
 *
 * Features:
 * - Configurable number of rows and columns
 * - Optional header row
 * - Uses shimmer animation for smooth loading
 *
 * @example
 * ```tsx
 * // Basic table skeleton (5 rows, 4 columns)
 * <SkeletonTable />
 *
 * // Custom table skeleton
 * <SkeletonTable rows={10} columns={3} showHeader={false} />
 * ```
 */
export function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
  showHeader = true,
  hubColor,
  ...props
}: SkeletonTableProps) {
  return (
    <div
      data-slot="skeleton-table"
      className={cn("glass-table rounded-lg overflow-hidden", className)}
      {...props}
    >
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th
                  key={`skeleton-header-${i}`}
                  className="px-4 py-3 text-left"
                >
                  <Skeleton
                    variant="shimmer"
                    hubColor={hubColor}
                    className="h-4 w-24"
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr
              key={`skeleton-row-${rowIndex}`}
              className="border-t border-border"
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td
                  key={`skeleton-cell-${rowIndex}-${colIndex}`}
                  className="px-4 py-3"
                >
                  <Skeleton
                    variant="shimmer"
                    hubColor={hubColor}
                    className={cn(
                      "h-4",
                      colIndex === 0
                        ? "w-32"
                        : colIndex === columns - 1
                          ? "w-20"
                          : "w-full",
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
