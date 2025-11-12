/**
 * Design system colors for Practice Hub mobile apps
 * Matches hub-colors.ts from web app
 */

// Hub Colors - Each hub has its unique brand color
export const HUB_COLORS = {
  practiceHub: "oklch(0.56 0.15 196.6)", // Teal (web format - not usable in RN)
  practiceHubHex: "#14b8a6", // Approximate hex for React Native
  clientHub: "#3b82f6", // Blue
  proposalHub: "#ec4899", // Pink
  employeeHub: "#10b981", // Emerald ✅ This is what we should use!
  socialHub: "#8b5cf6", // Purple
  portalHub: "#4f46e5", // Indigo
  adminHub: "#f97316", // Orange
} as const;

// Slate color palette (neutral grays)
export const SLATE = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
  950: "#020617",
} as const;

// Semantic colors
export const COLORS = {
  // Employee Hub primary
  primary: HUB_COLORS.employeeHub, // #10b981 Emerald
  primaryDark: "#059669", // Darker emerald for gradients

  // Neutral
  background: SLATE[50],
  surface: "#ffffff",
  border: SLATE[200],

  // Text
  textPrimary: SLATE[800],
  textSecondary: SLATE[500],
  textTertiary: SLATE[400],

  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // States
  disabled: SLATE[300],
  placeholder: SLATE[400],
} as const;

// Client Portal specific colors (for mobile-client app)
export const CLIENT_PORTAL_COLORS = {
  primary: HUB_COLORS.portalHub, // #4f46e5 Indigo
  primaryDark: "#4338ca",
} as const;
