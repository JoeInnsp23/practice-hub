import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive button-feedback",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-[var(--hub-color,var(--accent))]/10 hover:text-[var(--hub-color,var(--accent))] dark:bg-input/30 dark:border-input dark:hover:bg-[var(--hub-color,var(--primary))]/20 dark:hover:text-[var(--hub-color,var(--primary))]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-[var(--hub-color,var(--accent))]/10 hover:text-[var(--hub-color,var(--accent))] dark:hover:bg-[var(--hub-color,var(--primary))]/20 dark:hover:text-[var(--hub-color,var(--primary))]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Whether the button is in a loading state.
   * When true, shows a spinner and disables the button.
   */
  isLoading?: boolean;
  /**
   * Optional text to display when loading.
   * If not provided, the button's children text is shown.
   */
  loadingText?: string;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  // When asChild is true, we can't add spinner (Slot expects single child)
  // So we disable loading state when asChild is true
  const canShowLoading = !asChild && isLoading;
  const Comp = asChild ? Slot : "button";

  // When loading, show spinner and disable button
  const isDisabled = disabled || canShowLoading;
  const displayText = canShowLoading && loadingText ? loadingText : children;

  // When asChild, just pass through with disabled state
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...(isDisabled && { disabled: true })}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isDisabled}
      {...props}
    >
      {canShowLoading && (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {displayText}
    </Comp>
  );
}

export { Button, buttonVariants };
