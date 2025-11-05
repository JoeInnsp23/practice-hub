"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";
import { getHubGradient, HUB_COLORS } from "@/lib/utils/hub-colors";

/**
 * Props for the CardInteractive component.
 */
interface CardInteractiveProps extends React.ComponentProps<"div"> {
  /**
   * Hub color for the gradient accent bar.
   * Defaults to blue (#3b82f6) if not provided.
   *
   * @example
   * ```tsx
   * <CardInteractive moduleColor="#3b82f6">Content</CardInteractive>
   * ```
   */
  moduleColor?: string;

  /**
   * Click handler for the card.
   * If provided, the card becomes clickable and renders as a button.
   *
   * @example
   * ```tsx
   * <CardInteractive onClick={() => console.log('Clicked')}>
   *   Content
   * </CardInteractive>
   * ```
   */
  onClick?: () => void;

  /**
   * Accessibility label for the card.
   * Required when onClick is provided for screen reader support.
   *
   * @example
   * ```tsx
   * <CardInteractive onClick={handleClick} ariaLabel="Navigate to dashboard">
   *   Dashboard Card
   * </CardInteractive>
   * ```
   */
  ariaLabel?: string;

  /**
   * Additional CSS classes to apply to the card.
   */
  className?: string;

  /**
   * Card content.
   */
  children: React.ReactNode;
}

/**
 * CardInteractive - An interactive card component with hover lift and gradient accent bar.
 *
 * Features:
 * - Hover lift effect (translateY -4px)
 * - Gradient accent bar that slides in from left on hover
 * - Hub color support via moduleColor prop
 * - Full dark mode support
 * - Accessibility support (aria-label)
 * - Optional onClick handler
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CardInteractive>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </CardInteractive>
 *
 * // With hub color
 * <CardInteractive moduleColor="#3b82f6">
 *   <h3>Client Hub Card</h3>
 *   <p>Card content</p>
 * </CardInteractive>
 *
 * // With onClick handler
 * <CardInteractive
 *   moduleColor="#3b82f6"
 *   onClick={() => router.push('/dashboard')}
 *   ariaLabel="Navigate to dashboard"
 * >
 *   <h3>Dashboard</h3>
 *   <p>View dashboard</p>
 * </CardInteractive>
 * ```
 */
export function CardInteractive({
  moduleColor = HUB_COLORS["client-hub"], // Default to blue
  onClick,
  ariaLabel,
  className,
  children,
  style: propsStyle,
  ...props
}: CardInteractiveProps) {
  // Get gradient for the module color
  const gradient = getHubGradient(moduleColor);

  // Set CSS variables for module color and gradient
  // Merge with any existing styles to ensure CSS variables are preserved
  // CSS variables must come last to ensure they override any conflicting properties
  const style: React.CSSProperties = {
    ...propsStyle,
    "--module-color": moduleColor,
    "--module-gradient": gradient,
  } as React.CSSProperties;

  // If onClick is provided, render as button for better accessibility
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        onKeyDown={(e) => {
          // Handle keyboard navigation (Enter and Space)
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={ariaLabel}
        className={cn("card-interactive text-left w-full", className)}
        style={style}
        {...(props as React.ComponentProps<"button">)}
      >
        {children}
      </button>
    );
  }

  // Otherwise, render as div
  return (
    <div className={cn("card-interactive", className)} style={style} {...props}>
      {children}
    </div>
  );
}
