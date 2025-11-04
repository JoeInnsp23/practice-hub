import { FileQuestion } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Props for the TableEmpty component.
 */
interface TableEmptyProps extends React.ComponentProps<"div"> {
  /**
   * Title text to display.
   * @default "No data available"
   */
  title?: string;

  /**
   * Description text to display.
   * @default "There are no items to display."
   */
  description?: string;

  /**
   * Icon component to display.
   * @default FileQuestion
   */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * TableEmpty - A component that displays an empty state for tables.
 *
 * Features:
 * - Customizable title and description
 * - Customizable icon
 * - Centered layout with proper spacing
 * - Dark mode compatible
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <TableEmpty />
 *
 * // Custom empty state
 * <TableEmpty
 *   title="No tasks found"
 *   description="Create your first task to get started."
 *   icon={CheckCircle}
 * />
 * ```
 */
export function TableEmpty({
  className,
  title = "No data available",
  description = "There are no items to display.",
  icon: Icon = FileQuestion,
  ...props
}: TableEmptyProps) {
  return (
    <div
      data-slot="table-empty"
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
      {...props}
    >
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
