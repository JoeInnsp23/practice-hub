---
title: "Design System & UI Patterns"
category: "architecture"
subcategory: "frontend"
purpose: "Understand Practice Hub's glass-card design system and UI component patterns"
audience: ["ai-agent", "developer", "designer"]
prerequisites: []
related: ["../guides/development/adding-ui-component.md", "../development/coding-standards.md"]
last_updated: "2025-10-21"
version: "1.0"
status: "current"
owner: "design-team"
tags: ["design-system", "ui", "tailwind", "shadcn", "components"]
---

# Design System & UI Patterns

**Quick Summary**: Practice Hub uses a custom glass-card design system built on shadcn/ui components with Tailwind CSS v4, enforcing solid backgrounds, consistent module colors, and gradient layouts.

**Last Updated**: 2025-10-21 | **Version**: 1.0 | **Status**: Current

---

## What This Document Covers

- Glass-card design system principles
- shadcn/ui component usage
- Module color scheme
- Layout patterns
- Typography and spacing
- Component styling rules

---

## Prerequisites

Before reading this document, you should:
- [x] Understand React and Tailwind CSS basics
- [x] Understand shadcn/ui component library

---

## Quick Start / TL;DR

For AI agents and experienced developers who just need the core patterns:

**Design System Classes**:
```css
.glass-card       /* Primary content cards */
.glass-subtle     /* Headers and sidebars */
.glass-table      /* Table containers */
```

**Critical Rules**:
```typescript
// ❌ WRONG - Inline styles
<Card className="bg-card border">

// ✅ CORRECT - Use design system
<Card className="glass-card">

// ❌ WRONG - Transparency
background: rgba(255, 255, 255, 0.8)

// ✅ CORRECT - Solid backgrounds
background: rgb(255, 255, 255)

// ❌ WRONG - Custom components
<CustomCard>

// ✅ CORRECT - shadcn/ui first
<Card>
```

**Module Colors**:
```typescript
Client Hub: #3b82f6 (blue)
Admin Panel: #f97316 (orange)
Practice Hub: Primary theme color
```

---

## Detailed Guide

### Design Philosophy

**Principles**:
1. **Consistency** - Same visual language across all modules
2. **Clarity** - Solid backgrounds, no transparency effects
3. **Reusability** - Use shadcn/ui components, avoid custom components
4. **Accessibility** - WCAG 2.1 Level AA compliance
5. **Dark Mode** - Full dark mode support

**Why Glass-Card System**:
- Distinct visual identity
- Better readability than glassmorphism
- Consistent styling across modules
- Easy to maintain

---

### Core Design System Classes

#### .glass-card (Primary Content Cards)

**Purpose**: Main content containers, data displays, forms

**Visual Style**:
- Solid white background (light mode) / solid dark background (dark mode)
- Subtle border
- Rounded corners
- Consistent padding
- Box shadow for depth

**Implementation** (globals.css):
```css
.glass-card {
  @apply bg-white dark:bg-slate-900 border border-border rounded-lg shadow-sm;
}
```

**Usage**:
```tsx
// ✅ CORRECT - Card component applies .glass-card automatically
<Card>
  <CardHeader>
    <CardTitle>Client Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// ❌ WRONG - Don't use inline styles
<Card className="bg-card border">
```

---

#### .glass-subtle (Headers & Sidebars)

**Purpose**: Navigation headers, sidebars, secondary containers

**Visual Style**:
- Muted background (lighter than glass-card)
- Minimal border
- Subtle styling to differentiate from main content

**Implementation** (globals.css):
```css
.glass-subtle {
  @apply bg-slate-50 dark:bg-slate-800/50 border-b border-border;
}
```

**Usage**:
```tsx
// GlobalHeader component uses .glass-subtle
<header className="glass-subtle">
  <div className="container mx-auto px-4 py-3">
    {/* Header content */}
  </div>
</header>

// GlobalSidebar component uses .glass-subtle
<aside className="glass-subtle">
  {/* Sidebar navigation */}
</aside>
```

---

#### .glass-table (Table Containers)

**Purpose**: Wrap all Table components for consistent styling

**Visual Style**:
- Consistent table borders
- Hover effects
- Responsive styling

**Implementation** (globals.css):
```css
.glass-table {
  @apply rounded-lg border border-border overflow-hidden;
}

.glass-table table {
  @apply w-full;
}
```

**Usage**:
```tsx
// ✅ CORRECT - Wrap Table with .glass-table
<div className="glass-table">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* Rows */}
    </TableBody>
  </Table>
</div>

// ❌ WRONG - Table without wrapper
<Table>
  {/* ... */}
</Table>
```

---

### Component Library

**Primary**: shadcn/ui (Radix UI primitives)

**Rule**: ALWAYS use shadcn/ui components first, only create custom components when absolutely necessary

**Available Components** (`components/ui/`):
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>` - Content containers
- `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableCell>` - Data tables
- `<Button>` - All button variants
- `<Input>`, `<Textarea>`, `<Select>`, `<Checkbox>`, `<Switch>` - Form controls
- `<Dialog>`, `<Sheet>`, `<Popover>`, `<DropdownMenu>` - Overlays
- `<Badge>`, `<Avatar>`, `<Skeleton>` - UI elements
- `<Tabs>`, `<Accordion>`, `<Collapsible>` - Navigation/layout

**Installation**:
```bash
npx shadcn@latest add <component-name>
```

**Example**:
```tsx
// ✅ CORRECT - Use shadcn/ui Button
import { Button } from "@/components/ui/button";

<Button variant="default">Save</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>

// ❌ WRONG - Custom button component
<CustomButton>Save</CustomButton>
```

---

### Module Layout Patterns

#### Standard Module Layout

**Pattern**: All modules use the same layout structure

```tsx
// app/[module]/layout.tsx
export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleTitle="Client Hub"
        headerColor="#3b82f6"
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar moduleColor="#3b82f6" />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**Key Elements**:
1. **Gradient Background** - `bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800`
2. **GlobalHeader** - Module-specific header with color
3. **GlobalSidebar** - Module-specific navigation
4. **Main Content** - `flex-1 p-6` for consistent spacing

---

#### Module Colors

**Rule**: Each module has a consistent accent color

| Module | Color | Hex Code |
|--------|-------|----------|
| Client Hub | Blue | `#3b82f6` |
| Admin Panel | Orange | `#f97316` |
| Proposal Hub | Primary | (theme color) |
| Practice Hub | Primary | (theme color) |
| Client Portal | Primary | (theme color) |

**Usage**:
```tsx
// GlobalHeader with module color
<GlobalHeader
  moduleTitle="Client Hub"
  headerColor="#3b82f6"  // Blue for Client Hub
  showBackToHome={true}
/>

// GlobalSidebar with matching color
<GlobalSidebar moduleColor="#3b82f6" />
```

---

### Critical Design Rules

#### Rule 1: No Transparency/Glassmorphism

**Why**: Improves readability, consistent with glass-card name (ironic but intentional)

**❌ WRONG**:
```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
```

**✅ CORRECT**:
```css
background: rgb(255, 255, 255);
background: rgb(30, 41, 59);
```

---

#### Rule 2: Always Use Design System Classes

**❌ WRONG**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4">
```

**✅ CORRECT**:
```tsx
<Card>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

---

#### Rule 3: Use shadcn/ui First

**Process**:
1. Check if shadcn/ui has the component
2. If yes, use it
3. If no, check if you can compose existing components
4. Only create custom component if absolutely necessary

**❌ WRONG**:
```tsx
// Creating custom component without checking shadcn/ui
export function CustomSelect() { /* ... */ }
```

**✅ CORRECT**:
```tsx
// Use shadcn/ui Select
import { Select } from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

---

#### Rule 4: GlobalHeader & GlobalSidebar Required

**❌ WRONG**:
```tsx
// Custom header/sidebar
<header className="bg-white p-4">
  <h1>Client Hub</h1>
</header>
```

**✅ CORRECT**:
```tsx
// Use GlobalHeader and GlobalSidebar
<GlobalHeader
  moduleTitle="Client Hub"
  headerColor="#3b82f6"
  showBackToHome={true}
/>
<GlobalSidebar moduleColor="#3b82f6" />
```

---

### Typography

**Font Family**: System font stack (built into Tailwind)

**Headings**:
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section Title</h2>
<h3 className="text-xl font-semibold">Subsection Title</h3>
```

**Body Text**:
```tsx
<p className="text-base text-muted-foreground">Body text</p>
<p className="text-sm text-muted-foreground">Small text</p>
```

**Text Colors**:
- Primary: `text-foreground` (default)
- Secondary: `text-muted-foreground`
- Success: `text-green-600 dark:text-green-400`
- Error: `text-red-600 dark:text-red-400`
- Warning: `text-yellow-600 dark:text-yellow-400`

---

### Spacing & Layout

**Container**:
```tsx
<div className="container mx-auto px-4">
  {/* Content */}
</div>
```

**Standard Spacing**:
- Page padding: `p-6`
- Section margin: `mb-6`
- Card padding: `p-4`
- Grid gap: `gap-4`

**Grid Layouts**:
```tsx
// 2-column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 3-column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive layout
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-8">{/* Main content */}</div>
  <div className="lg:col-span-4">{/* Sidebar */}</div>
</div>
```

---

### Notifications

**Library**: react-hot-toast

**❌ WRONG**:
```tsx
import { toast } from "sonner";
toast("Message");
```

**✅ CORRECT**:
```tsx
import { toast } from "react-hot-toast";

toast.success("Operation successful!");
toast.error("Operation failed!");
toast.loading("Processing...");
toast("Info message");
```

---

### Dark Mode

**Implementation**: Tailwind dark mode (class-based)

**Usage**:
```tsx
// Automatically supported via design system classes
<div className="bg-white dark:bg-slate-900">

// Text colors
<p className="text-gray-900 dark:text-gray-100">

// Borders
<div className="border-gray-200 dark:border-gray-800">
```

**Theme Toggle**: Built into GlobalHeader component

---

## Examples

### Example 1: Standard Page Layout

```tsx
// app/client-hub/clients/page.tsx
import { GlobalHeader } from "@/components/global-header";
import { GlobalSidebar } from "@/components/global-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <GlobalHeader
        moduleTitle="Client Hub"
        headerColor="#3b82f6"
        showBackToHome={true}
      />
      <div className="flex">
        <GlobalSidebar moduleColor="#3b82f6" />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Clients</h1>
            <Button>Add Client</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Table or list */}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
```

---

### Example 2: Data Table with Glass-Table

```tsx
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export function ClientsTable({ clients }) {
  return (
    <Card>
      <div className="glass-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <Badge>{client.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
```

---

### Example 3: Form with shadcn/ui Components

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateClientForm({ onSubmit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name</Label>
            <Input id="name" required />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Create Client</Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Common Patterns

**Pattern 1: Page with Header and Action**
```tsx
<div className="mb-6 flex items-center justify-between">
  <h1 className="text-3xl font-bold">Page Title</h1>
  <Button>Primary Action</Button>
</div>
```

**Pattern 2: Stat Cards**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card>
    <CardContent className="pt-6">
      <div className="text-2xl font-bold">125</div>
      <p className="text-sm text-muted-foreground">Total Clients</p>
    </CardContent>
  </Card>
</div>
```

**Pattern 3: Two-Column Layout**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-8">
    <Card>{/* Main content */}</Card>
  </div>
  <div className="lg:col-span-4">
    <Card>{/* Sidebar */}</Card>
  </div>
</div>
```

---

## Related Documentation

- [Coding Standards](../development/coding-standards.md) - Complete coding guidelines
- [Adding UI Component](../guides/development/adding-ui-component.md) - Step-by-step guide
- [shadcn/ui Docs](https://ui.shadcn.com) - Official component documentation

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial AI-optimized version | Design Team |
