"use client";

import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import type * as React from "react";
import { useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Props for the FloatingLabelInput component.
 */
interface FloatingLabelInputProps
  extends Omit<React.ComponentProps<"input">, "placeholder"> {
  /**
   * Label text that floats above the input.
   */
  label: string;

  /**
   * Error message to display below the input.
   * When provided, the input will show error styling and shake animation.
   */
  error?: string;

  /**
   * Whether to show success state with checkmark icon.
   */
  success?: boolean;

  /**
   * Hub color for focus ring (CSS variable --module-color).
   * Optional - defaults to ring color if not provided.
   */
  moduleColor?: string;

  /**
   * Whether to show password visibility toggle button.
   * Only applies when type="password".
   */
  showPasswordToggle?: boolean;
}

/**
 * FloatingLabelInput - An input component with a floating label pattern.
 *
 * Features:
 * - Label floats up smoothly on focus or when input has value
 * - Error message display with slide-down animation
 * - Success checkmark display
 * - Error shake animation on validation failure
 * - Focus ring uses hub color when available
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FloatingLabelInput
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 *
 * // With error
 * <FloatingLabelInput
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * // With success
 * <FloatingLabelInput
 *   label="Username"
 *   value={username}
 *   success
 * />
 * ```
 */
export function FloatingLabelInput({
  label,
  error,
  success,
  moduleColor,
  showPasswordToggle = false,
  className,
  id,
  value,
  defaultValue,
  type,
  onFocus,
  onBlur,
  ...props
}: FloatingLabelInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue?.toString() || "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine actual input type (toggle password visibility)
  const inputType =
    type === "password" && showPasswordToggle && showPassword ? "text" : type;

  // Check if input has a value
  // For controlled inputs, check value prop
  // For uncontrolled inputs, check internal state
  // For React Hook Form, check DOM value directly
  const hasValue = Boolean(
    (value !== undefined && value !== null && value !== "") ||
      (value === undefined && internalValue !== "") ||
      inputRef.current?.value,
  );

  // Determine if label should be floating
  const isLabelFloating = isFocused || hasValue;

  // Handle focus events
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Handle change for uncontrolled inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      // Uncontrolled input - track value internally
      setInternalValue(e.target.value);
    }
    props.onChange?.(e);
  };

  // Set CSS variable for hub color if provided
  const style: React.CSSProperties = moduleColor
    ? ({ "--module-color": moduleColor } as React.CSSProperties)
    : {};

  return (
    <div className="relative" style={style}>
      <input
        ref={inputRef}
        id={inputId}
        data-slot="input-floating"
        type={inputType}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        className={cn(
          "peer w-full rounded-md border bg-slate-100 dark:bg-input/30 px-3 pt-6 pb-2 text-sm transition-all duration-200",
          "file:text-foreground placeholder:text-muted-foreground",
          "selection:bg-primary selection:text-primary-foreground",
          "border-slate-300 dark:border-input",
          "shadow-sm outline-none",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[var(--module-color,var(--ring))]",
          // Error state
          error &&
            "border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          error && "input-error-shake",
          // Success state
          success &&
            !error &&
            "border-green-500 focus-visible:ring-green-500/20",
          // Aria invalid for accessibility
          error && "aria-invalid",
          // Add right padding when password toggle is shown
          showPasswordToggle && type === "password" && "pr-12",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "absolute left-3 pointer-events-none transition-all duration-200 ease-out",
          "text-muted-foreground",
          isLabelFloating
            ? "top-2 text-xs"
            : "top-1/2 -translate-y-1/2 text-sm",
        )}
      >
        {label}
      </label>
      {/* Password visibility toggle button */}
      {showPasswordToggle && type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Eye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-destructive input-error-message"
          role="alert"
        >
          {error}
        </p>
      )}
      {success && !error && (
        <CheckCircle2
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-fade-in",
            // Position success icon to avoid overlap with password toggle
            showPasswordToggle && type === "password" ? "right-12" : "right-3",
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
