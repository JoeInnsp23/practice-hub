# Enhanced Design System Documentation
**Created:** 2025-01-03  
**Source:** Story 1.1 - Enhanced Design CSS File  
**Location:** `app/enhanced-design.css`  

---

## Overview

The Enhanced Design System provides professional visual depth, smooth animations, and micro-interactions extracted from archive patterns. All patterns respect accessibility (`prefers-reduced-motion`) and work seamlessly in both light and dark modes.

**Key Features:**
- Multi-layer shadow system for visual depth
- Smooth entrance animations
- Micro-interaction utilities
- Loading skeleton shimmer effects
- Full dark mode support
- Accessibility-first design

---

## Shadow System

The shadow system provides four levels of depth using multi-layer shadows. Each shadow has separate light and dark mode variants.

### Shadow Classes

#### `.shadow-soft`
**Use Case:** Subtle depth for minimal UI elements  
**When to Use:** Small badges, subtle separators, light emphasis  
**Visual Impact:** Minimal - creates gentle separation from background

**Example:**
```tsx
<div className="shadow-soft rounded-lg p-4">
  <p>Subtle card with soft shadow</p>
</div>
```

**Light Mode:**
- Two-layer shadow: `0 1px 3px rgba(0, 0, 0, 0.05)` + `0 1px 2px rgba(0, 0, 0, 0.1)`

**Dark Mode:**
- Two-layer shadow: `0 1px 3px rgba(0, 0, 0, 0.3)` + `0 1px 2px rgba(0, 0, 0, 0.4)`

---

#### `.shadow-medium`
**Use Case:** Standard card depth (most common)  
**When to Use:** Dashboard cards, content cards, standard UI containers  
**Visual Impact:** Moderate - creates clear elevation from background

**Example:**
```tsx
<Card className="shadow-medium">
  <CardHeader>
    <CardTitle>Dashboard Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content with medium shadow depth</p>
  </CardContent>
</Card>
```

**Light Mode:**
- Two-layer shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` + `0 2px 4px -1px rgba(0, 0, 0, 0.06)`

**Dark Mode:**
- Two-layer shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.4)` + `0 2px 4px -1px rgba(0, 0, 0, 0.3)`

---

#### `.shadow-strong`
**Use Case:** Elevated cards that need emphasis  
**When to Use:** Hover states, important cards, highlighted content  
**Visual Impact:** Strong - creates significant elevation

**Example:**
```tsx
<div className="shadow-strong rounded-xl p-6 hover:shadow-elevated transition-shadow">
  <h3>Important Card</h3>
  <p>Elevated card with strong shadow</p>
</div>
```

**Light Mode:**
- Two-layer shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1)` + `0 4px 6px -2px rgba(0, 0, 0, 0.05)`

**Dark Mode:**
- Two-layer shadow: `0 10px 15px -3px rgba(0, 0, 0, 0.5)` + `0 4px 6px -2px rgba(0, 0, 0, 0.4)`

---

#### `.shadow-elevated`
**Use Case:** Modals, overlays, dropdowns, popovers  
**When to Use:** UI elements that appear above page content  
**Visual Impact:** Maximum - creates clear separation from all content

**Example:**
```tsx
<Dialog>
  <DialogContent className="shadow-elevated">
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <DialogDescription>
      Modal content with elevated shadow
    </DialogDescription>
  </DialogContent>
</Dialog>
```

**Light Mode:**
- Two-layer shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.1)` + `0 10px 10px -5px rgba(0, 0, 0, 0.04)`

**Dark Mode:**
- Two-layer shadow: `0 20px 25px -5px rgba(0, 0, 0, 0.6)` + `0 10px 10px -5px rgba(0, 0, 0, 0.5)`

---

### Shadow Usage Guidelines

**Hierarchy:**
1. **No shadow** - Base elements (text, inline elements)
2. **`.shadow-soft`** - Minimal emphasis (badges, subtle cards)
3. **`.shadow-medium`** - Standard cards (most common)
4. **`.shadow-strong`** - Elevated cards (hover states, important content)
5. **`.shadow-elevated`** - Overlays (modals, dropdowns, popovers)

**Best Practices:**
- Use `.shadow-medium` for most cards
- Increase shadow on hover: `.shadow-medium hover:shadow-strong`
- Use `.shadow-elevated` only for overlays/modals
- Avoid mixing shadow classes (choose one per element)

---

## Animation Keyframes

Five animation keyframes provide smooth, professional motion. All animations respect `prefers-reduced-motion` and are disabled when motion is reduced.

### `@keyframes fadeIn`
**Use Case:** Page content, sections, general content  
**Motion:** Fades in with upward motion (20px translateY)  
**Duration:** 0.5s (recommended)  
**When to Use:** Main content areas, page sections, general fade-in needs

**Example:**
```tsx
<div className="animate-fade-in">
  <h1>Page Title</h1>
  <p>Content that fades in smoothly</p>
</div>
```

**Animation Details:**
- Starts: `opacity: 0, translateY(20px)`
- Ends: `opacity: 1, translateY(0)`
- Easing: `ease`
- Respects reduced motion: ✅

---

### `@keyframes slideIn`
**Use Case:** Modals, drawers, side panels  
**Motion:** Slides in from left (translateX -100% → 0%)  
**Duration:** 0.3s (recommended)  
**When to Use:** Sidebars, modals, drawer panels, slide-out menus

**Example:**
```tsx
<Dialog>
  <DialogContent className="animate-slide-in">
    <DialogHeader>
      <DialogTitle>Slide-in Modal</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

**Animation Details:**
- Starts: `translateX(-100%)`
- Ends: `translateX(0)`
- Easing: `ease`
- Respects reduced motion: ✅

---

### `@keyframes liftIn`
**Use Case:** Cards, dashboard widgets, grid items  
**Motion:** Lifts in with fade (10px translateY + opacity)  
**Duration:** 0.4s (recommended)  
**When to Use:** Card grids, dashboard widgets, list items, card collections

**Example:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {cards.map((card, index) => (
    <Card 
      key={card.id}
      className="animate-lift-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardContent>{card.title}</CardContent>
    </Card>
  ))}
</div>
```

**Animation Details:**
- Starts: `opacity: 0, translateY(10px)`
- Ends: `opacity: 1, translateY(0)`
- Easing: `ease`
- Respects reduced motion: ✅

**Stagger Pattern:**
For card grids, use `animation-delay` for sequential animation:
```tsx
style={{ animationDelay: `${index * 0.1}s` }}
```

---

### `@keyframes shimmer`
**Use Case:** Loading skeletons, placeholder content  
**Motion:** Shimmer effect across background gradient  
**Duration:** 2s (infinite loop)  
**When to Use:** Skeleton loaders, loading placeholders, shimmer effects

**Example:**
```tsx
<div className="skeleton-shimmer rounded-lg h-32 w-full" />
```

**Animation Details:**
- Background gradient animates position
- Starts: `background-position: -200% 0`
- Ends: `background-position: 200% 0`
- Loop: Infinite
- Respects reduced motion: ✅ (animation disabled)

**Usage:**
Apply `.skeleton-shimmer` class to skeleton elements. The class handles the gradient and animation automatically.

---

### `@keyframes spin`
**Use Case:** Loading spinners, rotation indicators  
**Motion:** 360-degree rotation  
**Duration:** 1s (infinite loop, typical)  
**When to Use:** Loading spinners, rotation indicators, processing states

**Example:**
```tsx
<Loader2 className="h-4 w-4 animate-spin" />
```

**Animation Details:**
- Starts: `rotate(0deg)`
- Ends: `rotate(360deg)`
- Loop: Infinite (typically)
- Respects reduced motion: ✅ (handled by Tailwind's `animate-spin`)

**Note:** This keyframe is available, but Tailwind's built-in `animate-spin` utility is typically used for spinners.

---

## Animation Utility Classes

Utility classes provide easy application of animations without writing custom CSS.

### `.animate-fade-in`
**Use Case:** General content fade-in  
**Animation:** `fadeIn` keyframe  
**Duration:** 0.5s  
**Easing:** `ease`

**Example:**
```tsx
<section className="animate-fade-in">
  <h2>Section Title</h2>
  <p>Content that fades in</p>
</section>
```

---

### `.animate-slide-in`
**Use Case:** Side panels, modals, drawers  
**Animation:** `slideIn` keyframe  
**Duration:** 0.3s  
**Easing:** `ease`

**Example:**
```tsx
<aside className="animate-slide-in">
  <SidebarContent />
</aside>
```

---

### `.animate-lift-in`
**Use Case:** Cards, widgets, grid items  
**Animation:** `liftIn` keyframe  
**Duration:** 0.4s  
**Easing:** `ease`

**Example:**
```tsx
<Card className="animate-lift-in">
  <CardContent>Card content</CardContent>
</Card>
```

**With Stagger:**
```tsx
{items.map((item, index) => (
  <Card 
    key={item.id}
    className="animate-lift-in"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    {item.content}
  </Card>
))}
```

---

### `.hover-lift`
**Use Case:** Interactive cards, hover effects  
**Effect:** Lifts element on hover (translateY -4px)  
**Transition:** 0.3s ease for transform and box-shadow

**Example:**
```tsx
<div className="hover-lift shadow-medium rounded-lg p-4 cursor-pointer">
  <h3>Hoverable Card</h3>
  <p>Lifts up on hover</p>
</div>
```

**Behavior:**
- Hover: `translateY(-4px)`
- Shadow increases on hover (apply `.shadow-strong` on hover)
- Respects reduced motion: ✅ (transform disabled)

---

### `.button-feedback`
**Use Case:** All buttons, interactive elements  
**Effect:** Micro-interactions on hover/active  
**Hover:** Scale 1.02 (2% larger)  
**Active:** Scale 0.98 (2% smaller)  
**Transition:** 0.2s ease

**Example:**
```tsx
<Button className="button-feedback">
  Click Me
</Button>
```

**Behavior:**
- Hover: `scale(1.02)` - slight growth
- Active: `scale(0.98)` - slight shrink (tactile feedback)
- Focus: Custom outline ring (uses `--module-color` if available)
- Respects reduced motion: ✅ (transforms disabled)

**Note:** This class is typically applied via button variants in `components/ui/button.tsx`. Individual buttons don't need to add this class manually.

---

## Component Styles

Specialized component styles for enhanced UI elements.

### `.card-interactive`
**Use Case:** Interactive cards with hover lift and gradient accent bar  
**Features:**
- Hover lift (translateY -4px)
- Gradient accent bar slides in from left on hover
- Shadow increases on hover
- Border color changes to hub color on hover

**Example:**
```tsx
<div
  className="card-interactive"
  style={{
    "--module-color": "#3b82f6",
    "--module-gradient": "linear-gradient(90deg, #3b82f6, #2563eb)",
  }}
  onClick={() => handleClick()}
>
  <h3>Interactive Card</h3>
  <p>Card with hover effects</p>
</div>
```

**CSS Variables:**
- `--module-color`: Hub color for border on hover
- `--module-gradient`: Gradient for accent bar (default: blue gradient)

**Behavior:**
- Default: Standard shadow, transparent border
- Hover: Lifts up, shadow increases, border shows hub color, gradient bar slides in
- Dark mode: Enhanced shadows for visibility
- Respects reduced motion: ✅ (transforms disabled)

---

### `.table-row` and `.table-row-actions`
**Use Case:** Table row hover effects and action button visibility  
**Features:**
- Row background changes on hover
- Action buttons fade in on row hover

**Example:**
```tsx
<tbody>
  {rows.map((row) => (
    <tr key={row.id} className="table-row">
      <td>{row.name}</td>
      <td>{row.status}</td>
      <td>
        <div className="table-row-actions">
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="ghost" size="sm">Delete</Button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
```

**Behavior:**
- Row hover: Background color changes (light mode: subtle gray, dark mode: subtle white)
- Actions: Hidden by default (`opacity: 0`), visible on row hover (`opacity: 1`)
- Transitions: Smooth 0.2s ease
- Respects reduced motion: ✅ (transitions disabled, actions always visible)

---

### `.skeleton-shimmer`
**Use Case:** Loading skeleton placeholders  
**Features:**
- Shimmer animation across gradient background
- Uses CSS variables for colors (adapts to theme)
- Works in light and dark mode

**Example:**
```tsx
<div className="skeleton-shimmer rounded-lg h-32 w-full" />
```

**Usage Patterns:**
- Card skeletons: `skeleton-shimmer rounded-lg h-48 w-full`
- Text skeletons: `skeleton-shimmer rounded h-4 w-3/4`
- Avatar skeletons: `skeleton-shimmer rounded-full h-12 w-12`

**Behavior:**
- Continuous shimmer animation (2s infinite loop)
- Gradient uses `--muted` and `--muted-foreground` variables
- Respects reduced motion: ✅ (animation disabled)

---

## Dark Mode Considerations

All classes have full dark mode support. Dark mode variants are automatically applied when the `.dark` class is present on a parent element (typically the `<html>` or `<body>` tag).

### Shadow System in Dark Mode

**Principle:** Dark mode shadows use higher opacity black to maintain visibility against dark backgrounds.

**Examples:**
- Light mode `.shadow-medium`: `rgba(0, 0, 0, 0.1)` and `rgba(0, 0, 0, 0.06)`
- Dark mode `.shadow-medium`: `rgba(0, 0, 0, 0.4)` and `rgba(0, 0, 0, 0.3)`

**Best Practice:** No manual dark mode classes needed - all shadows automatically adapt.

---

### Animation System in Dark Mode

**Principle:** Animations work identically in light and dark mode. No special considerations needed.

**Note:** All animations respect `prefers-reduced-motion` regardless of theme.

---

### Component Styles in Dark Mode

**Card Interactive:**
- Shadows use higher opacity for visibility
- Border colors adapt to dark backgrounds
- Gradient accent bars remain visible

**Table Row:**
- Light mode hover: `rgba(0, 0, 0, 0.03)` (subtle black)
- Dark mode hover: `rgba(255, 255, 255, 0.05)` (subtle white)

**Skeleton Shimmer:**
- Uses CSS variables (`--muted`, `--muted-foreground`)
- Automatically adapts to theme

---

## Accessibility

### Prefers-Reduced-Motion

**All animations respect `prefers-reduced-motion`.**

When `prefers-reduced-motion: reduce` is set:
- ✅ All entrance animations disabled (`.animate-fade-in`, `.animate-slide-in`, `.animate-lift-in`)
- ✅ All hover transforms disabled (`.hover-lift`, `.card-interactive:hover`)
- ✅ All button feedback transforms disabled (`.button-feedback:hover`, `.button-feedback:active`)
- ✅ All skeleton shimmer animations disabled (`.skeleton-shimmer`)
- ✅ All table transitions disabled (`.table-row`, `.table-row-actions`)
- ✅ Table row actions always visible (no opacity transition)

**Implementation:**
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-in,
  .animate-lift-in {
    animation: none;
  }
  /* ... all other animations disabled */
}
```

**Testing:**
1. Open browser DevTools
2. Toggle `prefers-reduced-motion` in accessibility settings
3. Verify all animations are disabled

---

### Focus States

**Button Feedback:**
- Focus ring uses `--module-color` if available, falls back to `--ring`
- Outline offset provides clear visibility
- 2px solid outline for accessibility

**Example:**
```css
.button-feedback:focus-visible {
  outline: 2px solid var(--module-color, var(--ring));
  outline-offset: 2px;
}
```

---

## Code Examples

### Complete Card Example with Shadow and Animation

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function AnimatedCard() {
  return (
    <Card className="shadow-medium animate-lift-in hover:shadow-strong transition-shadow">
      <CardHeader>
        <CardTitle>Animated Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Card with entrance animation and hover shadow enhancement</p>
      </CardContent>
    </Card>
  );
}
```

---

### Staggered Card Grid

```tsx
export function StaggeredCardGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item, index) => (
        <Card
          key={item.id}
          className="animate-lift-in shadow-medium hover:shadow-strong transition-shadow"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent>{item.title}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

### Interactive Card with Hub Color

```tsx
import { getHubGradient } from "@/lib/utils/hub-colors";

export function HubCard({ moduleColor = "#3b82f6" }: { moduleColor?: string }) {
  const gradient = getHubGradient(moduleColor);
  
  return (
    <div
      className="card-interactive cursor-pointer"
      style={{
        "--module-color": moduleColor,
        "--module-gradient": gradient,
      } as React.CSSProperties}
      onClick={() => console.log("Card clicked")}
    >
      <h3>Hub Card</h3>
      <p>Card with hub-specific gradient accent</p>
    </div>
  );
}
```

---

### Table with Hover Effects

```tsx
export function EnhancedTable({ rows }: { rows: Row[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="table-row">
            <td>{row.name}</td>
            <td>{row.status}</td>
            <td>
              <div className="table-row-actions flex gap-2">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm">Delete</Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### Loading Skeleton

```tsx
export function CardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton-shimmer rounded-lg h-8 w-3/4" />
      <div className="skeleton-shimmer rounded-lg h-4 w-full" />
      <div className="skeleton-shimmer rounded-lg h-4 w-5/6" />
    </div>
  );
}
```

---

### Modal with Slide Animation

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AnimatedModal({ open, onOpenChange }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="animate-slide-in shadow-elevated">
        <DialogHeader>
          <DialogTitle>Animated Modal</DialogTitle>
        </DialogHeader>
        <p>Modal content with slide-in animation</p>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Best Practices

### When to Use Each Shadow

1. **`.shadow-soft`** - Minimal UI elements, subtle emphasis
2. **`.shadow-medium`** - Standard cards (most common choice)
3. **`.shadow-strong`** - Hover states, important content
4. **`.shadow-elevated`** - Modals, overlays, popovers only

### Animation Guidelines

1. **Don't over-animate** - Use animations purposefully, not everywhere
2. **Stagger cards** - Use `animation-delay` for card grids (0.1s increments)
3. **Respect reduced motion** - All animations automatically respect user preferences
4. **Performance** - Use `transform` and `opacity` (GPU-accelerated)

### Accessibility Checklist

- ✅ All animations respect `prefers-reduced-motion`
- ✅ Focus states visible (button-feedback includes focus ring)
- ✅ Dark mode fully supported
- ✅ No motion-only information (animations are enhancements, not requirements)

---

## Migration from Old Patterns

### Replacing Old Shadow Classes

**Old:**
```tsx
<div className="shadow-lg">Content</div>
```

**New:**
```tsx
<div className="shadow-medium">Content</div>
```

### Replacing Old Animation Classes

**Old:**
```tsx
<div className="animate-pulse">Loading...</div>
```

**New:**
```tsx
<div className="skeleton-shimmer rounded-lg h-4 w-full">Loading...</div>
```

---

## File Location

**CSS File:** `app/enhanced-design.css`  
**Import:** Automatically imported in `app/globals.css`  
**Usage:** Classes available globally after import

---

## Version History

- **2025-01-03:** Initial enhanced design system created (Story 1.1)
- **2025-01-03:** Documentation created (Story 1.2)

---

**For questions or additions, consult the design system maintainer or refer to the PRD: `docs/60-active-planning/launch/ui-ux-polish-prd.md`**

