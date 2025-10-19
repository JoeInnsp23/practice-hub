---
name: brand-guidelines
description: Applies Practice Hub's design system, brand colors, and component patterns. Use when building UI components, enforcing design standards, or ensuring consistency across Practice Hub modules (Client Hub, Admin Panel, Practice Hub). Critical for maintaining solid backgrounds, glass-card patterns, and multi-tenant architecture.
license: Complete terms in LICENSE.txt
---

# Practice Hub Brand Guidelines

## Overview

This skill enforces Practice Hub's design system, ensuring consistency across all modules and maintaining the project's critical design standards.

**Keywords**: Practice Hub, design system, glass-card, multi-tenant, Better Auth, shadcn/ui, module colors, brand consistency, component patterns, UI standards

## Critical Design Standards

**IMPORTANT: These must be followed for ALL Practice Hub development:**

### 1. Card Styling
- **ALWAYS use `glass-card` class** for all cards
- The Card component from shadcn/ui applies this automatically
- **NEVER use inline `bg-card border` styles**
- Solid backgrounds only: `rgb(255, 255, 255)` light / `rgb(30, 41, 59)` dark

### 2. Table Styling
- **ALWAYS wrap Table components** with `<div className="glass-table">`
- Ensures consistent styling across all tables

### 3. Layout Backgrounds
All module layouts must use gradient backgrounds:
```tsx
className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-100 dark:from-slate-900 dark:to-slate-800"
```

### 4. Module Color Schemes
Maintain consistent colors across modules:
- **Client Hub**: `#3b82f6` (blue)
- **Admin Panel**: `#f97316` (orange)
- **Practice Hub**: Primary theme color (from Tailwind config)

Apply to GlobalHeader and GlobalSidebar:
```tsx
<GlobalHeader headerColor="#3b82f6" title="Client Hub" showBackToHome={true} />
<GlobalSidebar moduleColor="#3b82f6" />
```

### 5. NO Transparency/Glassmorphism
- **NEVER use rgba with opacity** for backgrounds
- Use solid RGB colors only:
  - Light: `rgb(255, 255, 255)`
  - Dark: `rgb(30, 41, 59)`
- **NO backdrop-filter or blur effects**
- All components must have solid, opaque backgrounds

### 6. Design System Classes
Reference these predefined classes from `app/globals.css`:

**`.glass-card`** - Primary content cards
- Light: `rgb(255, 255, 255)` with shadow
- Dark: `rgb(30, 41, 59)` with shadow
- Use for: Cards, dialogs, modals

**`.glass-subtle`** - Headers and sidebars
- Light: `rgb(255, 255, 255)` with subtle shadow
- Dark: `rgb(30, 41, 59)` with subtle shadow
- Use for: GlobalHeader, GlobalSidebar, nav elements

**`.glass-table`** - Table containers
- Light: `rgb(255, 255, 255)` with border-radius
- Dark: `rgb(30, 41, 59)` with border-radius
- Use for: Wrapping all Table components

### 7. Checklist Components
All checklist-type UI must follow this exact pattern:

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

**Requirements:**
- Icons: Always `h-6 w-6 flex-shrink-0`
- Completed: Green circle, green border, muted background, line-through text
- Uncompleted: Empty circle, standard border, clickable with hover

## Component Patterns

### Headers and Sidebars
Always use GlobalHeader and GlobalSidebar:
```tsx
<GlobalHeader
  title="Module Name"
  headerColor="#3b82f6" // Module-specific color
  showBackToHome={true} // For non-practice-hub modules
/>
<GlobalSidebar moduleColor="#3b82f6" />
```

### Typography
- Use system fonts with proper fallbacks
- Maintain readability with proper contrast
- Ensure dark mode compatibility

## Authentication Patterns (Better Auth)

Practice Hub uses Better Auth for authentication with multi-tenant support:

### Middleware Protection
```tsx
// middleware.ts
import { auth } from "@/lib/auth";

const publicPaths = ["/", "/sign-in", "/sign-up"];

export default async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}
```

### Module-Level Protection
```tsx
// Server-side layout protection
import { getAuthContext } from "@/lib/auth";

export default async function AdminLayout({ children }) {
  const authContext = await getAuthContext();
  if (!authContext || authContext.role !== "admin") {
    redirect("/");
  }
  return <>{children}</>;
}
```

### Session Access
- Server: Use `auth.api.getSession()` or `getAuthContext()`
- Client: Use `useSession()` hook from `@/lib/auth-client`

## Multi-Tenant Architecture

**CRITICAL: All database queries MUST be tenant-scoped:**

```tsx
// Server component with tenant isolation
const authContext = await getAuthContext();
if (!authContext) redirect("/sign-in");

const clients = await db
  .select()
  .from(clientsTable)
  .where(eq(clientsTable.tenantId, authContext.tenantId));
```

### tRPC Integration
```tsx
// Context automatically includes tenant
export const clientsRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, ctx.authContext.tenantId));
  }),
});
```

### Auth Context Interface
```tsx
interface AuthContext {
  userId: string;
  tenantId: string;
  organizationName?: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}
```

## Database Conventions

**IMPORTANT: Database is in development - NO MIGRATIONS:**
- Update schema directly in `lib/db/schema.ts`
- After schema changes, run `pnpm db:reset` (NOT individual commands)
- Always update `scripts/seed.ts` with new schema changes
- All tables must have `tenantId` for multi-tenant isolation

## Component Best Practices

### Always Use shadcn/ui First
Before creating custom components, check if shadcn/ui has a suitable component:
- Cards, Buttons, Forms, Tables, Dialogs, etc.
- All components in `components/ui/` directory

### Notifications
- **ALWAYS use react-hot-toast** for notifications
- Never use other toast/notification libraries

### Theme Consistency
- Ensure light/dark theme alignment across all modules
- Test both themes before finalizing components
- Use CSS variables from globals.css

## Style Guidelines

### Avoid "AI Slop"
- **NO excessive centered layouts**
- **NO purple gradients**
- **NO uniform rounded corners** (vary border-radius)
- **NO Inter font defaults**

### DO Use
- Varied layouts with proper alignment
- Module-specific accent colors (blue/orange/primary)
- Varied border-radius for visual interest
- System fonts with proper fallbacks

## Features

### Smart Font Application

- Applies Poppins font to headings (24pt and larger)
- Applies Lora font to body text
- Automatically falls back to Arial/Georgia if custom fonts unavailable
- Preserves readability across all systems

### Text Styling

- Headings (24pt+): Poppins font
- Body text: Lora font
- Smart color selection based on background
- Preserves text hierarchy and formatting

### Shape and Accent Colors

- Non-text shapes use accent colors
- Cycles through orange, blue, and green accents
- Maintains visual interest while staying on-brand

## Technical Details

### Font Management

- Uses system-installed Poppins and Lora fonts when available
- Provides automatic fallback to Arial (headings) and Georgia (body)
- No font installation required - works with existing system fonts
- For best results, pre-install Poppins and Lora fonts in your environment

### Color Application

- Uses RGB color values for precise brand matching
- Applied via python-pptx's RGBColor class
- Maintains color fidelity across different systems
