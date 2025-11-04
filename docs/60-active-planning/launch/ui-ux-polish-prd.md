# Product Requirements Document: UI/UX Polish Phase 2
**Feature ID:** `ui-ux-polish-phase-2`  
**Feature Name:** Enhanced Design System & UI Polish  
**Status:** Ready for TDD  
**Created:** 2025-01-03  
**Analyst:** Athena 🦉  
**Documentation Architect:** Hermes 📜  
**Orchestrator:** Zeus ⚡  

---

## Executive Summary

This PRD defines the complete UI/UX polish enhancement for Practice Hub, transforming the application from a "generic AI app" appearance to a polished, professional design. The enhancement extracts design quality patterns from the archive (shadows, animations, typography) while preserving all existing hub colors and maintaining full dark mode support.

**Business Value:**
- Eliminates "generic AI app" visual perception
- Improves user confidence and trust
- Enhances brand perception and professionalism
- Launch blocker for Phase 2 of master launch plan

**Success Criteria:**
- Visual comparison: "No longer looks like generic AI app"
- User feedback: "App feels professional and polished"
- Consistent polish across all 7 hubs
- Zero accessibility regressions
- 60fps animations on target devices
- 100% WCAG 2.1 AA compliance

---

## User Stories

### US-1: Enhanced Visual Design
**As a** staff user  
**I want** the application to have professional visual depth and polish  
**So that** I have confidence in the platform's quality and reliability

**Acceptance:**
- Cards have multi-layer shadows creating visual depth
- Hover interactions provide clear feedback
- Animations are smooth and professional
- Dark mode is equally polished

---

### US-2: Smooth Interactions
**As a** staff user  
**I want** smooth, responsive interactions throughout the application  
**So that** the application feels modern and responsive

**Acceptance:**
- Buttons provide tactile feedback on click
- Cards lift on hover with smooth transitions
- Modals animate in/out smoothly
- Loading states are clear and polished

---

### US-3: Professional Landing Experience
**As an** unauthenticated visitor  
**I want** a professional landing page that introduces the platform  
**So that** I understand the platform's value before signing in

**Acceptance:**
- Landing page showcases platform features
- Smooth animations draw attention
- Clear call-to-action for sign-in
- Authenticated users redirect to practice-hub

---

### US-4: Consistent Hub Identity
**As a** staff user navigating between hubs  
**I want** each hub to maintain its unique color identity  
**So that** I can visually distinguish between different modules

**Acceptance:**
- Each hub's color is clear in header and sidebar
- Active states use hub-specific colors
- Card accents use hub colors appropriately
- No color leakage between hubs

---

### US-5: Accessible Experience
**As a** keyboard-only user  
**I want** all interactions to be accessible via keyboard  
**So that** I can use the application effectively

**Acceptance:**
- All interactive elements are keyboard accessible
- Focus states are clearly visible
- Animations respect `prefers-reduced-motion`
- Screen reader compatibility maintained

---

## Detailed Requirements

### Functional Requirements

#### FR-1: Enhanced Shadow System

**Description:** Implement multi-layer professional shadow system extracted from archive patterns.

**Source Pattern:** Archive `--shadow-*-brand` variables

**Implementation Specification:**

**CSS Shadow Classes (`app/enhanced-design.css`):**
```css
/* Soft shadow - subtle depth for cards */
.shadow-soft {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Medium shadow - standard card depth */
.shadow-medium {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Strong shadow - elevated cards */
.shadow-strong {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Elevated shadow - modals, overlays */
.shadow-elevated {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Dark mode variants */
.dark .shadow-soft {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.4);
}

.dark .shadow-medium {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.4),
    0 2px 4px -1px rgba(0, 0, 0, 0.3);
}

.dark .shadow-strong {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.5),
    0 4px 6px -2px rgba(0, 0, 0, 0.4);
}

.dark .shadow-elevated {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.6),
    0 10px 10px -5px rgba(0, 0, 0, 0.5);
}
```

**Usage:**
- Replace current `.glass-card` shadow with `.shadow-medium` base
- Apply `.shadow-strong` on hover for cards
- Use `.shadow-elevated` for modals and overlays

**Acceptance Criteria:**
- Cards have 2-layer shadows (subtle outline + depth shadow)
- Hover states increase shadow intensity smoothly (300ms transition)
- Dark mode shadows use black with appropriate opacity
- All hubs use consistent shadow system

---

#### FR-2: Animation System

**Description:** Add entrance animations and micro-interactions extracted from archive.

**Source Pattern:** Archive `@keyframes fadeIn`, `.portal-card` hover effects

**Implementation Specification:**

**Animation Keyframes (`app/enhanced-design.css`):**
```css
/* Fade in with upward motion - for page content */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide in from left - for modals/drawers */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Lift in with fade - for cards */
@keyframes liftIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Shimmer effect - for loading skeletons */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Spin - for loading spinners */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

**Animation Utility Classes:**
```css
/* Entrance animations */
.animate-fade-in {
  animation: fadeIn 0.5s ease forwards;
}

.animate-slide-in {
  animation: slideIn 0.3s ease forwards;
}

.animate-lift-in {
  animation: liftIn 0.4s ease forwards;
}

/* Hover lift effect */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
}

/* Button feedback */
.button-feedback {
  transition: all 0.2s ease;
}

.button-feedback:active {
  transform: scale(0.98);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-in,
  .animate-lift-in {
    animation: none;
  }
  
  .hover-lift:hover {
    transform: none;
  }
}
```

**Stagger Pattern (for card grids):**
```css
.card-grid .card:nth-child(1) { animation-delay: 0.1s; }
.card-grid .card:nth-child(2) { animation-delay: 0.2s; }
.card-grid .card:nth-child(3) { animation-delay: 0.3s; }
.card-grid .card:nth-child(4) { animation-delay: 0.4s; }
```

**Acceptance Criteria:**
- Page content fades in on load (500ms duration)
- Dashboard cards stagger in sequentially (0.1s delays)
- Modals slide/scale in (300ms duration)
- Buttons scale down on active (0.98 scale)
- All animations respect `prefers-reduced-motion`

---

#### FR-3: Enhanced Card Component

**Description:** Add CardInteractive variant with hover lift and gradient accent bar.

**Source Pattern:** Archive `.portal-card` and `.staff-portal-tool-card`

**Implementation Specification:**

**Component Interface (`components/ui/card-interactive.tsx`):**
```typescript
import { cn } from "@/lib/utils";
import { getHubGradient } from "@/lib/utils/hub-colors";
import type { ReactNode } from "react";

interface CardInteractiveProps {
  children: ReactNode;
  moduleColor?: string;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
}

export function CardInteractive({
  children,
  moduleColor = "#3b82f6",
  className,
  onClick,
  "aria-label": ariaLabel,
}: CardInteractiveProps) {
  const gradient = getHubGradient(moduleColor);
  
  return (
    <div
      className={cn(
        "card-interactive",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel}
      style={
        {
          "--module-gradient": gradient,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
```

**CSS Classes (`app/enhanced-design.css`):**
```css
.card-interactive {
  @apply bg-card rounded-xl p-6 relative transition-all duration-300;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid transparent;
  overflow: hidden;
}

.card-interactive::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--module-gradient, linear-gradient(90deg, #3b82f6, #2563eb));
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--module-color, #3b82f6);
}

.card-interactive:hover::before {
  transform: translateX(0);
}

/* Dark mode variants */
.dark .card-interactive {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4),
              0 2px 4px -1px rgba(0, 0, 0, 0.3);
}

.dark .card-interactive:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5),
              0 4px 6px -2px rgba(0, 0, 0, 0.4);
}
```

**Enhanced Card Component (`components/ui/card.tsx`):**
```typescript
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const cardVariants = cva(
  "glass-card text-card-foreground flex flex-col gap-6 rounded-xl py-6",
  {
    variants: {
      variant: {
        default: "",
        elevated: "shadow-medium",
        interactive: "card-interactive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

// ... rest of Card component exports
```

**Hub Color Utility (`lib/utils/hub-colors.ts`):**
```typescript
export const HUB_COLORS = {
  "client-hub": "#3b82f6",     // Blue
  "admin": "#f97316",          // Orange
  "employee-hub": "#10b981",   // Emerald
  "proposal-hub": "#ec4899",   // Pink
  "social-hub": "#8b5cf6",     // Purple
  "practice-hub": "#2563eb",   // Default blue
} as const;

export type HubName = keyof typeof HUB_COLORS;

export function getHubGradient(hubColor: string): string {
  const gradients: Record<string, string> = {
    "#3b82f6": "linear-gradient(90deg, #3b82f6, #2563eb)",
    "#f97316": "linear-gradient(90deg, #f97316, #ea580c)",
    "#10b981": "linear-gradient(90deg, #10b981, #059669)",
    "#ec4899": "linear-gradient(90deg, #ec4899, #db2777)",
    "#8b5cf6": "linear-gradient(90deg, #8b5cf6, #7c3aed)",
  };
  
  return gradients[hubColor] || gradients["#3b82f6"];
}
```

**Acceptance Criteria:**
- CardInteractive component available with `moduleColor` prop
- Hover lift works (translateY -4px)
- Gradient bar slides in from left on hover
- Hub color applied correctly via `moduleColor` prop
- Dark mode variants work correctly

---

#### FR-4: Button Enhancements

**Description:** Add micro-interactions and loading states to buttons.

**Implementation Specification:**

**Enhanced Button (`components/ui/button.tsx` - add to existing):**
```typescript
// Add to existing buttonVariants
const buttonVariants = cva(
  "button-feedback inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    // ... existing variants
  }
);

// Add loading state support
interface ButtonProps extends React.ComponentProps<"button"> {
  isLoading?: boolean;
  loadingText?: string;
  // ... existing props
}

function Button({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

**CSS Enhancements (`app/enhanced-design.css`):**
```css
/* Button hover scale (already in button-feedback class) */
.button-feedback:hover {
  transform: scale(1.02);
}

.button-feedback:active {
  transform: scale(0.98);
}

/* Focus ring with hub color (if available) */
.button-feedback:focus-visible {
  outline: 2px solid var(--module-color, var(--ring));
  outline-offset: 2px;
}
```

**Acceptance Criteria:**
- All buttons have hover scale effect (1.02)
- Active state provides tactile feedback (0.98 scale)
- Loading buttons show spinner without size shift
- Focus ring uses hub `moduleColor` when available
- Dark mode focus rings visible with sufficient contrast

---

#### FR-5: Table Polish

**Description:** Enhanced table row interactions and animations.

**Implementation Specification:**

**Table Row Hover (`app/enhanced-design.css`):**
```css
.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: var(--muted) / 0.5;
}

/* Table row actions - fade in on hover */
.table-row-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.table-row:hover .table-row-actions {
  opacity: 1;
}

/* Better spacing */
.table-row td {
  padding: 1rem 0.75rem;
}
```

**Empty State Component (`components/ui/table-empty.tsx`):**
```typescript
import { FileQuestion } from "lucide-react";

interface TableEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function TableEmpty({
  title = "No data available",
  description = "There are no items to display.",
  icon: Icon = FileQuestion,
}: TableEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
```

**Acceptance Criteria:**
- Table rows respond to hover smoothly (200ms transition)
- Action buttons appear/disappear with fade on row hover
- Empty tables show helpful empty state with icon
- Loading skeleton matches table structure
- Responsive: tables scroll horizontally on mobile with fixed header

---

#### FR-6: Form Input Polish

**Description:** Better focus states, floating labels, validation animations.

**Implementation Specification:**

**Floating Label Input (`components/ui/input-floating.tsx`):**
```typescript
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

interface FloatingLabelInputProps
  extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  success?: boolean;
}

export function FloatingLabelInput({
  label,
  error,
  success,
  className,
  ...props
}: FloatingLabelInputProps) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(props.value || props.defaultValue);

  return (
    <div className="relative">
      <input
        id={id}
        className={cn(
          "peer w-full rounded-md border border-input bg-background px-3 pt-6 pb-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "focus:scale-[1.01] transition-all duration-200",
          error && "border-destructive focus:ring-destructive",
          success && "border-green-500 focus:ring-green-500",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-3 transition-all duration-200 pointer-events-none",
          isFocused || hasValue
            ? "top-2 text-xs text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-sm text-destructive animate-slide-down">
          {error}
        </p>
      )}
      {success && (
        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-fade-in" />
      )}
    </div>
  );
}
```

**Input Focus States (`app/enhanced-design.css`):**
```css
/* Enhanced focus states */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  ring: 2px;
  ring-color: var(--module-color, var(--ring));
  ring-offset: 2px;
  scale: 1.01;
  transition: all 0.2s ease;
}

/* Placeholder styling */
input::placeholder,
textarea::placeholder {
  color: #9ca3af;
  opacity: 1;
}

/* Error shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.input-error {
  animation: shake 0.3s ease;
  border-color: var(--destructive);
}
```

**Acceptance Criteria:**
- All form inputs have polished focus states
- Floating labels move up on focus/fill smoothly
- Error shake animation works on validation failure
- Success checkmark fades in on validation success
- Placeholders readable in light + dark mode
- Keyboard navigation works flawlessly

---

#### FR-7: Modal/Dialog Animations

**Description:** Smooth entrance/exit animations for overlays.

**Implementation Specification:**

**Modal Animation (`components/ui/dialog.tsx` - enhance existing):**
```typescript
// Add to DialogContent component
<DialogContent className="animate-lift-in">
  {/* existing content */}
</DialogContent>
```

**CSS Animations (`app/enhanced-design.css`):**
```css
/* Modal backdrop */
[data-radix-dialog-overlay] {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

/* Modal content */
[data-radix-dialog-content] {
  animation: liftIn 0.3s ease;
  transform-origin: center;
}

/* Focus trap - handled by Radix UI */
```

**Acceptance Criteria:**
- Modal entrance feels smooth and professional (300ms)
- Backdrop blur enhances visual hierarchy
- Keyboard navigation works correctly (Escape closes)
- Focus management follows WAI-ARIA patterns
- All modal sizes (sm, md, lg, xl) animate consistently

---

#### FR-8: Navigation Enhancement (Sidebar)

**Description:** Smooth transitions and better active states.

**Implementation Specification:**

**Enhanced Sidebar (`components/shared/GlobalSidebar.tsx`):**
```typescript
// Update active state styling
<Link
  className={cn(
    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300",
    "relative",
    isActive
      ? "text-white"
      : "text-muted-foreground hover:text-card-foreground hover:bg-muted",
  )}
  style={
    isActive
      ? {
          backgroundColor: moduleColor,
          borderLeft: `4px solid ${moduleColor}`,
        }
      : undefined
  }
>
  {/* Add left border indicator */}
  {isActive && (
    <div
      className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-l-lg"
      style={{ width: "4px" }}
    />
  )}
  <Icon className="w-5 h-5" />
  <span>{item.name}</span>
</Link>
```

**Collapse/Expand Animation:**
```typescript
// Add to sidebar wrapper
const [isCollapsed, setIsCollapsed] = useState(false);

<nav
  className={cn(
    "glass-subtle border-r transition-all duration-300",
    isCollapsed ? "w-16" : "w-64"
  )}
>
  {/* content */}
</nav>
```

**Acceptance Criteria:**
- Active state clearly indicates current page (colored border + background)
- Each hub's color shows correctly in sidebar
- Collapse/expand animation smooth (300ms)
- Dark mode active states visible
- Mobile: sidebar becomes drawer with slide animation

---

#### FR-9: Loading Skeleton System

**Description:** Shimmer loading skeletons for all content types.

**Implementation Specification:**

**Skeleton Components (`components/ui/skeleton.tsx` - enhance existing):**
```typescript
// Add shimmer variant
const skeletonVariants = cva(
  "animate-pulse rounded bg-muted",
  {
    variants: {
      variant: {
        default: "",
        shimmer: "skeleton-shimmer",
      },
    },
  }
);

// Add specific skeleton components
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" variant="shimmer" />
      <Skeleton className="h-4 w-1/2" variant="shimmer" />
      <Skeleton className="h-32 w-full" variant="shimmer" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" variant="shimmer" />
          <Skeleton className="h-12 w-32" variant="shimmer" />
          <Skeleton className="h-12 w-24" variant="shimmer" />
        </div>
      ))}
    </div>
  );
}
```

**Shimmer CSS (`app/enhanced-design.css`):**
```css
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--muted-foreground) 50%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.dark .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(51, 65, 85, 1) 0%,
    rgba(71, 85, 105, 1) 50%,
    rgba(51, 65, 85, 1) 100%
  );
}
```

**Acceptance Criteria:**
- Loading skeletons match actual content shape
- Shimmer animation runs smoothly (60fps)
- Dark mode skeletons use appropriate muted colors
- All major views have loading skeleton variants
- Skeletons replace after data loads (no flash)

---

#### FR-10: Widget/KPI Enhancements

**Description:** Number count-up animations, chart animations.

**Implementation Specification:**

**Number Count-Up Hook (`hooks/use-count-up.ts`):**
```typescript
import { useEffect, useState } from "react";

export function useCountUp(
  target: number,
  duration = 2000,
  startOnMount = true
) {
  const [count, setCount] = useState(startOnMount ? 0 : target);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!startOnMount) return;
    
    setIsAnimating(true);
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= target) {
          setIsAnimating(false);
          return target;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, startOnMount]);

  return { count: Math.round(count), isAnimating };
}
```

**Recharts Animation Enable:**
```typescript
// In chart components
<LineChart
  data={data}
  // Enable animations
  animationDuration={500}
  // ... other props
>
  {/* chart config */}
</LineChart>
```

**Acceptance Criteria:**
- Numbers count up smoothly when data changes
- Charts animate on initial render (Recharts built-in)
- Tooltips appear with hover (200ms delay)
- Empty widgets show helpful placeholder
- Performance: animations don't block main thread

---

#### FR-11: Redesigned Login Page

**Description:** Modern, professional login page.

**Implementation Specification:**

**Login Page (`app/(auth)/sign-in/page.tsx`):**
```typescript
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md animate-lift-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form with FloatingLabelInput */}
          {/* Microsoft OAuth button with loading state */}
        </CardContent>
      </Card>
    </div>
  );
}
```

**Acceptance Criteria:**
- Login page feels premium and professional
- Form elements animate in sequentially (stagger)
- Error messages clear and helpful
- Loading states prevent double-submit
- Dark mode properly styled
- Mobile responsive (touch-friendly, no zoom on focus)
- Accessibility: screen reader friendly, keyboard navigable

---

#### FR-12: Landing/Welcome Page

**Description:** Professional landing page for unauthenticated users.

**Implementation Specification:**

**Landing Page (`app/page.tsx`):**
```typescript
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LandingPage() {
  const session = await auth.api.getSession();
  
  // Redirect authenticated users to practice-hub
  if (session) {
    redirect("/practice-hub");
  }

  return (
    <div className="min-h-screen">
      {/* Hero section with fadeIn */}
      {/* Features section with CardInteractive */}
      {/* Benefits section */}
      {/* Trust/credibility section */}
      {/* Footer */}
    </div>
  );
}
```

**Acceptance Criteria:**
- Landing page loads fast (<2s)
- Animations smooth on scroll (Intersection Observer)
- CTAs clear and prominent
- Mobile: cards stack, touch-friendly
- Dark mode supported
- Accessible: skip link, proper headings, alt text
- Authenticated users redirect to `/practice-hub`

---

### Non-Functional Requirements

#### NFR-1: Performance
- Animations run at 60fps (use `transform` and `opacity` only)
- Loading skeletons prevent layout shift (CLS < 0.1)
- No blocking JavaScript during animations
- Smooth scrolling with animations (no jank)

#### NFR-2: Accessibility
- All animations respect `prefers-reduced-motion`
- Keyboard navigation works flawlessly
- Focus states clear and visible (WCAG 2.1 AA)
- Screen reader friendly
- Minimum touch target sizes (44x44px)
- Color contrast meets WCAG AA (4.5:1 text, 3:1 UI)

#### NFR-3: Dark Mode
- All new styles fully support dark mode
- Shadows adjusted for dark backgrounds
- Focus rings visible in both modes
- Animations equally polished in dark mode
- No dark mode flicker on load

#### NFR-4: Responsive Design
- All enhancements work on mobile, tablet, desktop
- Touch interactions polished
- No zoom on input focus (mobile)
- Animations scale appropriately
- Cards stack properly on mobile

#### NFR-5: Browser Compatibility
- Target: Last 2 versions of modern browsers
- Desktop: Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- Mobile: iOS Safari 17+, Chrome Mobile 120+
- Graceful degradation for older browsers

---

### Multi-Tenant Considerations

#### MTR-1: Hub Color Isolation
- Each hub maintains its unique color identity
- Hub colors never leak across modules
- GlobalHeader `headerColor` prop overrides safely
- GlobalSidebar `moduleColor` prop scoped to module

#### MTR-2: No Security Impact
- UI changes are purely cosmetic
- No new API calls or data access
- No new authentication/authorization logic
- Animations don't expose sensitive data

---

## Technical Specifications

### File Structure

```
app/
  enhanced-design.css          # New: All design system enhancements
  (auth)/
    sign-in/
      page.tsx                 # Redesign login page
  page.tsx                     # New: Landing page (unauthenticated)

components/
  ui/
    card.tsx                   # Enhance: Add variant prop
    card-interactive.tsx       # New: Interactive card component
    button.tsx                 # Enhance: Add loading state
    input-floating.tsx         # New: Floating label input
    skeleton.tsx               # Enhance: Add shimmer variant
    table-empty.tsx            # New: Table empty state
    skeleton-card.tsx          # New: Skeleton components
    skeleton-table.tsx         # New
    skeleton-text.tsx          # New
    skeleton-avatar.tsx        # New
    skeleton-widget.tsx        # New

components/
  shared/
    GlobalSidebar.tsx          # Enhance: Active state polish, collapse animation

lib/
  utils/
    hub-colors.ts              # New: Hub color constants and gradients

hooks/
  use-count-up.ts              # New: Number count-up animation hook
```

### CSS Architecture

**Enhanced Design CSS (`app/enhanced-design.css`):**
- Shadow system classes
- Animation keyframes
- Animation utility classes
- Card enhancement classes
- Micro-interaction classes
- Loading skeleton classes
- Dark mode variants for all

**Import in `app/globals.css`:**
```css
@import "./enhanced-design.css";
```

### Component Interfaces

**CardInteractive:**
```typescript
interface CardInteractiveProps {
  children: ReactNode;
  moduleColor?: string;
  className?: string;
  onClick?: () => void;
  "aria-label"?: string;
}
```

**FloatingLabelInput:**
```typescript
interface FloatingLabelInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  success?: boolean;
}
```

**Hub Color Utilities:**
```typescript
export const HUB_COLORS: Record<string, string>;
export function getHubGradient(hubColor: string): string;
```

---

## Testing Strategy

### Unit Tests
**Coverage:** Component rendering and props  
**Components to Test:**
- CardInteractive (renders, applies gradient, hover works)
- FloatingLabelInput (label floats, validation states)
- Skeleton components (render correctly, match shapes)
- useCountUp hook (counts correctly, stops at target)

### Integration Tests
**Coverage:** Visual regression testing  
**Tools:** Cursor browser tools (screenshots before/after)

### UI Tests (CRITICAL)
**Tool:** Cursor browser tools (paramount!)  
**Scenarios:**
1. Test card hover effects in all hubs
2. Test modal/dialog animations
3. Test form input focus states and floating labels
4. Test sidebar collapse/expand
5. Test login page animations
6. Test landing page sections
7. Test dark mode in all scenarios
8. Test mobile responsive behavior
9. Test keyboard navigation

### Accessibility Tests
**Coverage:** WCAG 2.1 AA compliance  
**Scenarios:**
- Keyboard navigation through all interactive elements
- Screen reader testing (VoiceOver, NVDA)
- Color contrast checker (all text, all backgrounds)
- Focus visible in all states
- `prefers-reduced-motion` respected

### Performance Tests
**Coverage:** Animation performance  
**Scenarios:**
- Measure FPS during animations (target: 60fps)
- Test on mid-range devices
- Ensure animations don't block interaction
- Measure CLS (Cumulative Layout Shift) - target: < 0.1

### Cross-Browser Tests
**Browsers:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS, latest 2 versions)
- Chrome Mobile (Android, latest 2 versions)

---

## Acceptance Criteria (Detailed Scenarios)

### AC-1: Archive Patterns Extracted
**Given** the archive design system  
**When** extracting patterns  
**Then** shadow system, animations, card hover, typography adopted WITHOUT branding

**Test:** Visual comparison of archive patterns vs. implementation

---

### AC-2: Enhanced Design System Created
**Given** the new `enhanced-design.css` file  
**When** imported into `globals.css`  
**Then** all utility classes available and documented

**Test:** 
- File exists at `app/enhanced-design.css`
- Import statement in `globals.css` works
- Classes available in browser DevTools

---

### AC-3: Card Components Enhanced
**Given** CardInteractive component  
**When** used in dashboard with `moduleColor`  
**Then** hover lift works, gradient bar slides in, hub color applied

**Test:**
- Render CardInteractive with `moduleColor="#3b82f6"`
- Hover over card
- Verify translateY(-4px) applied
- Verify gradient bar slides in from left
- Verify gradient uses correct hub color

---

### AC-4: Hub Colors Preserved
**Given** all hub layouts (5 hubs)  
**When** viewing each hub  
**Then** correct color shows in header, sidebar, active states

**Test:**
- Navigate to Client Hub → verify blue (#3b82f6)
- Navigate to Admin Hub → verify orange (#f97316)
- Navigate to Employee Hub → verify emerald (#10b981)
- Navigate to Proposal Hub → verify pink (#ec4899)
- Navigate to Social Hub → verify purple (#8b5cf6)

---

### AC-5: Login Page Redesigned
**Given** the new login page  
**When** unauthenticated user visits  
**Then** page looks professional, animations smooth, form polished

**Test:**
- Visit `/sign-in` as unauthenticated user
- Verify card lifts in (animate-lift-in)
- Verify form elements stagger in
- Test Microsoft OAuth button with loading state
- Test error state handling
- Test dark mode

---

### AC-6: Landing Page Created
**Given** unauthenticated user visiting `/`  
**When** page loads  
**Then** hero, features, benefits sections render, animations work, CTAs clear  
**And** authenticated users redirect to `/practice-hub`

**Test:**
- Visit `/` as unauthenticated → verify landing page
- Visit `/` as authenticated → verify redirect to `/practice-hub`
- Verify hero fades in
- Verify sections lift on scroll
- Test CTAs work

---

### AC-7: All Hubs Polished
**Given** each hub layout  
**When** navigating through pages  
**Then** consistent polish (cards, tables, forms, modals)

**Test:**
- Navigate through each hub
- Verify cards have shadows and hover effects
- Verify tables have row hover polish
- Verify forms have focus states
- Verify modals animate smoothly

---

### AC-8: Dark Mode Fully Supported
**Given** user toggles dark mode  
**When** viewing any page  
**Then** all enhancements work equally well

**Test:**
- Toggle dark mode
- Verify all components render correctly
- Verify shadows visible against dark backgrounds
- Verify focus rings visible
- Verify animations equally polished

---

### AC-9: Mobile Responsive
**Given** mobile device  
**When** viewing any page  
**Then** layouts stack, touch targets adequate, animations smooth

**Test:**
- View on mobile viewport (375px width)
- Verify cards stack properly
- Verify touch targets are 44x44px minimum
- Verify animations smooth on mobile
- Verify no zoom on input focus

---

### AC-10: Accessibility Maintained
**Given** keyboard-only user  
**When** navigating the app  
**Then** all interactive elements accessible, focus visible

**Test:**
- Navigate entire app using only keyboard
- Verify focus visible on all interactive elements
- Verify tab order logical
- Test with screen reader (VoiceOver/NVDA)
- Verify `prefers-reduced-motion` respected

---

## Implementation Phases

### Phase 1: Foundation (2 days)
**Goal:** Create enhanced design system CSS file

**Tasks:**
1. Create `app/enhanced-design.css`
2. Add shadow system classes (soft, medium, strong, elevated)
3. Add animation keyframes (fadeIn, slideIn, liftIn, shimmer, spin)
4. Add animation utility classes
5. Add micro-interaction classes
6. Import into `globals.css`
7. Test in light + dark mode
8. Document all classes

**Acceptance:**
- All classes available in browser
- Dark mode variants work
- Documentation complete

---

### Phase 2: Core Components (3 days)
**Goal:** Enhance and create new components

**Tasks:**
1. Create `lib/utils/hub-colors.ts`
2. Enhance Card component (add variant prop)
3. Create CardInteractive component
4. Enhance Button (add loading state, micro-interactions)
5. Create FloatingLabelInput component
6. Create Skeleton components (Card, Table, Text, Avatar, Widget)
7. Enhance Table (row hover, empty state)
8. Test all components in isolation

**Acceptance:**
- All components render correctly
- Props work as expected
- Dark mode supported
- Accessibility verified

---

### Phase 3: Hub Layouts (3 days)
**Goal:** Polish all hub layouts

**Tasks:**
1. Polish Practice Hub dashboard
2. Polish Client Hub layouts
3. Polish Admin Hub layouts
4. Polish Employee Hub layouts (when created)
5. Polish Proposal Hub layouts
6. Polish Social Hub layouts
7. Polish Client Portal layouts
8. Test hub color consistency
9. Test dark mode in all hubs

**Acceptance:**
- All hubs polished consistently
- Hub colors correct in each
- Dark mode works in all hubs

---

### Phase 4: Login & Landing (1.5 days)
**Goal:** Redesign login and create landing page

**Tasks:**
1. Redesign login page (`app/(auth)/sign-in/page.tsx`)
2. Create landing page (`app/page.tsx`)
3. Implement authenticated redirect logic
4. Test on mobile
5. Test accessibility
6. Test dark mode

**Acceptance:**
- Login page professional and polished
- Landing page works for unauthenticated users
- Redirect works for authenticated users
- Mobile responsive
- Accessible

---

### Phase 5: Polish & Testing (2 days)
**Goal:** Final polish and comprehensive testing

**Tasks:**
1. Modal/dialog animations
2. Navigation enhancements (sidebar collapse)
3. Widget/KPI count-up animations
4. Cross-browser testing
5. Visual regression testing (Cursor browser tools)
6. Performance testing
7. Accessibility audit

**Acceptance:**
- All enhancements polished
- All tests pass
- Performance targets met
- Accessibility standards met

---

### Phase 6: Browser Testing & Iteration (1 day)
**Goal:** Final validation and fixes

**Tasks:**
1. Test on all target browsers
2. Test on all devices
3. Fix any issues found
4. Polish based on visual review
5. Final documentation

**Acceptance:**
- All browsers tested
- All devices tested
- Issues resolved
- Documentation complete

---

## Risks & Mitigations

### Risk 1: Animation Performance on Low-End Devices
**Impact:** High  
**Probability:** Medium  
**Mitigation:** 
- Use only `transform` and `opacity` (GPU-accelerated)
- Respect `prefers-reduced-motion`
- Test on mid-range devices early
- Provide fallback (no animations on very slow devices)

### Risk 2: Dark Mode Regression
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Test every component in dark mode immediately
- Use design tokens (no hardcoded colors)
- Automated visual regression tests
- Design system tokens prevent issues

### Risk 3: Hub Color Inconsistency
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Centralized `HUB_COLORS` constant
- TypeScript types for hub names
- Visual testing of each hub
- Code review for hardcoded colors

### Risk 4: Accessibility Degradation
**Impact:** High  
**Probability:** Low  
**Mitigation:**
- Follow WCAG 2.1 AA guidelines
- Automated accessibility testing (axe-core)
- Manual keyboard navigation testing
- Screen reader testing

### Risk 5: Employee Hub Dependency
**Impact:** Low  
**Probability:** Low  
**Mitigation:**
- Employee Hub creation is parallel Phase 1
- Can polish Employee Hub when it's created
- No blocking dependency

---

## Dependencies

### External Dependencies
- ✅ Current app codebase (Next.js 15, Tailwind v4, shadcn/ui)
- ✅ Archive design patterns (`.archive/practice-hub/crm-app/main/src/index.css`)
- ✅ Recharts library (for chart animations)

### Internal Dependencies
- ✅ Existing hub color infrastructure (`moduleColor`, `headerColor` props)
- ✅ Existing GlobalHeader and GlobalSidebar components
- ✅ Existing design token system (`globals.css`)
- ⚠️ Employee Hub creation (parallel Phase 1 - may need coordination)

---

## Success Metrics

### Quantitative
- Animation FPS: 60fps on target devices
- CLS (Cumulative Layout Shift): < 0.1
- WCAG 2.1 AA compliance: 100%
- Mobile page load: < 2s
- Zero lint errors related to new CSS
- Zero accessibility violations (axe-core)

### Qualitative
- User feedback: "App feels professional and polished"
- Visual comparison: "No longer looks like generic AI app"
- Consistent feedback: "Hub colors clear and consistent"
- Accessibility: "Keyboard navigation smooth"
- Dark mode: "Equally polished as light mode"

---

**PRD Status:** ✅ **COMPLETE AND VALIDATED**

**Ready for:** TDD Creation (Hermes `*design-tdd`)

---

📜 **Hermes's Note:** This PRD expands the Feature Brief into detailed, implementable specifications. All technical details are specified, component interfaces are defined, and testing scenarios are comprehensive. Ready for TDD design and subsequent implementation by Hephaestus.

**Next Command:** `*design-tdd` to create the Test-Driven Development Multi-Phase Plan.

