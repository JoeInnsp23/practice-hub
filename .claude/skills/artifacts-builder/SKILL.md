---
name: artifacts-builder
description: Suite of tools for creating Practice Hub UI components and artifacts using the project's design system (React, Tailwind CSS, shadcn/ui, glass-card patterns). Use for building UI components that match Practice Hub's established design patterns and conventions.
license: Complete terms in LICENSE.txt
---

# Practice Hub Artifacts Builder

To build powerful frontend components for Practice Hub, follow these steps:
1. Initialize the frontend repo using `scripts/init-artifact.sh`
2. Develop your artifact following Practice Hub design system
3. Bundle all code into a single HTML file using `scripts/bundle-artifact.sh`
4. Display artifact to user
5. (Optional) Test the artifact

**Stack**: React 18 + TypeScript + Vite + Parcel (bundling) + Tailwind CSS v4 + shadcn/ui

## Practice Hub Design System

**CRITICAL: ALL components MUST follow these design standards:**

### 1. Card Styling
- **ALWAYS use `glass-card` class** for all cards
- The Card component from shadcn/ui applies this automatically
- **NEVER use inline `bg-card border` styles**
- Solid backgrounds only: `rgb(255, 255, 255)` light / `rgb(30, 41, 59)` dark

### 2. Table Styling
- **ALWAYS wrap Table components** with `<div className="glass-table">`
- Example:
```tsx
<div className="glass-table">
  <Table>...</Table>
</div>
```

### 3. Layout Backgrounds
- All module layouts must use gradient background:
```tsx
className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
```

### 4. Module Color Schemes
- **Client Hub**: `#3b82f6` (blue)
- **Admin Panel**: `#f97316` (orange)
- **Practice Hub**: Primary theme color

### 5. NO Transparency/Glassmorphism
- **NEVER use rgba with opacity** for backgrounds
- Use solid colors: `rgb(255, 255, 255)` or `rgb(30, 41, 59)`
- **NO backdrop-filter or blur effects**

### 6. Design System Classes
Reference these predefined classes from globals.css:
- `.glass-card` - Primary content cards (solid white/dark slate with shadows)
- `.glass-subtle` - Headers and sidebars
- `.glass-table` - Table containers

### 7. Checklist Components
All checklist-type UI must follow this pattern:

**Completed items:**
```tsx
<div className="bg-muted/50 border-green-200 dark:border-green-900 border rounded-lg p-4">
  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
  <span className="line-through text-muted-foreground">Task name</span>
</div>
```

**Uncompleted items:**
```tsx
<div className="border-border border rounded-lg p-4">
  <Circle className="h-6 w-6 text-muted-foreground hover:text-primary flex-shrink-0 transition-colors" />
  <span>Task name</span>
</div>
```

### 8. Headers and Sidebars
Always use GlobalHeader and GlobalSidebar components:
```tsx
<GlobalHeader
  title="Module Name"
  headerColor="#3b82f6" // Module-specific color
  showBackToHome={true} // For non-practice-hub modules
/>
<GlobalSidebar moduleColor="#3b82f6" />
```

### 9. General Style Guidelines
- **NEVER use excessive centered layouts**
- **NEVER use purple gradients**
- **Avoid uniform rounded corners** (use varied border-radius)
- Use react-hot-toast for all notifications
- Always use shadcn/ui components first before creating custom components

## Quick Start

### Step 1: Initialize Project

Run the initialization script to create a new React project:
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

This creates a fully configured project with:
- ✅ React + TypeScript (via Vite)
- ✅ Tailwind CSS 3.4.1 with shadcn/ui theming system
- ✅ Path aliases (`@/`) configured
- ✅ 40+ shadcn/ui components pre-installed
- ✅ All Radix UI dependencies included
- ✅ Parcel configured for bundling (via .parcelrc)
- ✅ Node 18+ compatibility (auto-detects and pins Vite version)

### Step 2: Develop Your Artifact

To build the artifact, edit the generated files. See **Common Development Tasks** below for guidance.

### Step 3: Bundle to Single HTML File

To bundle the React app into a single HTML artifact:
```bash
bash scripts/bundle-artifact.sh
```

This creates `bundle.html` - a self-contained artifact with all JavaScript, CSS, and dependencies inlined. This file can be directly shared in Claude conversations as an artifact.

**Requirements**: Your project must have an `index.html` in the root directory.

**What the script does**:
- Installs bundling dependencies (parcel, @parcel/config-default, parcel-resolver-tspaths, html-inline)
- Creates `.parcelrc` config with path alias support
- Builds with Parcel (no source maps)
- Inlines all assets into single HTML using html-inline

### Step 4: Share Artifact with User

Finally, share the bundled HTML file in conversation with the user so they can view it as an artifact.

### Step 5: Testing/Visualizing the Artifact (Optional)

Note: This is a completely optional step. Only perform if necessary or requested.

To test/visualize the artifact, use available tools (including other Skills or built-in tools like Playwright or Puppeteer). In general, avoid testing the artifact upfront as it adds latency between the request and when the finished artifact can be seen. Test later, after presenting the artifact, if requested or if issues arise.

## Reference

- **shadcn/ui components**: https://ui.shadcn.com/docs/components