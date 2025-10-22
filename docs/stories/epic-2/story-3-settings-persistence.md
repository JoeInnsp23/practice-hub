# User Story: Settings Persistence & System Configuration

**Story ID:** STORY-2.3
**Epic:** Epic 2 - High-Impact Workflows
**Feature:** FR7 (Settings Persistence) + FR8 (System Settings Backend)
**Priority:** High
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** staff member and administrator
**I want** settings to save successfully and persist across sessions
**So that** I don't have to re-enter preferences every time and can customize system configuration

---

## Business Value

- **Reliability:** 0% → 100% save success rate (currently all settings hardcoded with local state)
- **Customization:** Enables per-tenant system configuration (company, currency, timezone)
- **User Experience:** Preferences persist across sessions and devices
- **Foundation:** Prerequisite for advanced features requiring system configuration

---

## Acceptance Criteria

### Functional Requirements - Settings Persistence (FR7)

**AC1: Wire Settings UI to Backend Router**
- **Given** the settings page is loaded
- **When** the page renders
- **Then** settings data is fetched via tRPC queries (not hardcoded)
- **And** existing settings router at settings.ts:19-167 is used

**AC2: User Settings Save**
- **Given** a user updates notification preferences
- **When** they click "Save Changes"
- **Then** settings.updateNotificationSettings mutation is called
- **And** settings are persisted to userSettings table
- **And** success toast is shown: "Settings saved successfully"

**AC3: Tenant Settings Save**
- **Given** an admin updates company settings
- **When** they click "Save Changes"
- **Then** settings.updateTenant mutation is called
- **And** settings are persisted to tenants.metadata JSONB field
- **And** success toast is shown: "Company settings saved"

**AC4: Loading States**
- **Given** settings are being saved
- **When** the mutation is in progress
- **Then** save button shows "Saving..." with loading spinner
- **And** form fields are disabled during save

**AC5: Error Handling**
- **Given** settings save fails (network error, validation error)
- **When** the error occurs
- **Then** error toast is shown with user-friendly message
- **And** form fields remain editable
- **And** user can retry save operation

**AC6: Optimistic Updates**
- **Given** a user updates settings
- **When** they click save
- **Then** UI immediately reflects changes (optimistic update)
- **And** if save fails, UI rolls back to previous values
- **And** error message is shown

**AC7: Real-time Save Indicators**
- **Given** settings save completes successfully
- **When** the response is received
- **Then** "Saved ✓" confirmation appears briefly
- **And** indicator fades after 2 seconds

**AC8: Settings Data Fetching**
- **Given** a user navigates to settings page
- **When** the page loads
- **Then** settings are fetched via tRPC queries
- **And** loading skeleton is shown while fetching
- **And** fetched values populate form fields (not hardcoded defaults)

### Functional Requirements - System Settings (FR8)

**AC9: Company Settings Fetch**
- **Given** an admin navigates to settings page
- **When** the page loads
- **Then** settings.getTenant query is called
- **And** company settings are fetched from tenants.metadata JSONB
- **And** form fields populate with: company name, email, phone, address

**AC10: Company Settings Save**
- **Given** an admin updates company settings
- **When** they click "Save Changes"
- **Then** settings.updateTenant mutation is called
- **And** settings are stored in tenants.metadata with structure:
  ```json
  {
    "company": { "name": "", "email": "", "phone": "", "address": { "street": "", "city": "", "postcode": "", "country": "" } },
    "regional": { "currency": "GBP", "dateFormat": "DD/MM/YYYY", "timezone": "Europe/London" },
    "fiscal": { "fiscalYearStart": "04-06" }
  }
  ```

**AC11: Regional Settings Fields**
- **Given** an admin is editing system settings
- **When** they view the regional settings section
- **Then** fields are available for:
  - Currency (dropdown: GBP, USD, EUR)
  - Date format (dropdown: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
  - Timezone (searchable dropdown: Europe/London, America/New_York, etc.)

**AC12: Fiscal Year Settings**
- **Given** an admin is editing system settings
- **When** they view the fiscal settings section
- **Then** field is available for fiscal year start date (month-day format: "04-06" for April 6)
- **And** dropdown shows common UK fiscal years (04-06, 01-01)

**AC13: Form Validation**
- **Given** an admin is editing system settings
- **When** they enter invalid data
- **Then** validation errors are shown:
  - Email: Must be valid email format
  - Phone: Must be valid phone format (UK or international)
  - Required fields: Company name, email, currency, timezone
- **And** save is blocked until validation passes

**AC14: Settings Preview**
- **Given** an admin changes date format or timezone
- **When** they select a new value
- **Then** preview is shown: "Dates will display as: 22/10/2025"
- **And** preview updates in real-time as settings change

### Integration Requirements

**AC15: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** settings are fetched or updated
- **Then** all queries filter by tenantId
- **And** tenants cannot see or modify other tenants' settings

**AC16: User Settings Scope**
- **Given** a user updates notification preferences
- **When** settings are saved
- **Then** settings apply only to that user (user-scoped)
- **And** other users' settings are unaffected

### Quality Requirements

**AC17: Performance**
- **Given** settings page is loaded
- **When** performance is measured
- **Then** settings fetch completes in <500ms
- **And** settings save completes in <1 second
- **And** page renders in <2 seconds

**AC18: Data Persistence Test**
- **Given** settings are saved successfully
- **When** the user logs out and logs back in
- **Then** all settings persist across sessions
- **And** fetched settings match last saved values

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// userSettings table
export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true),
  inAppNotifications: boolean("in_app_notifications").default(true),
  digestEmail: text("digest_email").default("daily"), // "daily" | "weekly" | "never"
  theme: text("theme").default("system"), // "light" | "dark" | "system"
  language: text("language").default("en"),
  timezone: text("timezone").default("Europe/London"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// No table changes for tenant settings - use existing tenants.metadata JSONB field
```

### File Structure

```
app/client-hub/settings/
  page.tsx                  # Extend with tRPC queries/mutations
lib/schemas/
  settings-schemas.ts       # Zod validation schemas for settings
lib/utils/
  settings-defaults.ts      # Default settings values
```

### Settings Zod Schemas

```typescript
// lib/schemas/settings-schemas.ts

import { z } from "zod";

export const companySettingsSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().default("United Kingdom"),
    }),
  }),
  regional: z.object({
    currency: z.enum(["GBP", "USD", "EUR"]).default("GBP"),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
    timezone: z.string().default("Europe/London"),
  }),
  fiscal: z.object({
    fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, "Format: MM-DD").default("04-06"),
  }),
});

export const userSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  digestEmail: z.enum(["daily", "weekly", "never"]).default("daily"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.enum(["en", "es", "fr", "de"]).default("en"),
  timezone: z.string().default("Europe/London"),
});

export type CompanySettings = z.infer<typeof companySettingsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
```

### tRPC Procedures (Already Exist - Just Wire UI)

```typescript
// app/server/routers/settings.ts (ALREADY EXISTS at settings.ts:19-167)

// Wire existing procedures to UI:
// - settings.getTenant - Fetch tenant settings from tenants.metadata
// - settings.updateTenant - Update tenant settings (admin only)
// - settings.getNotificationSettings - Fetch user notification preferences
// - settings.updateNotificationSettings - Update user preferences

// Add new procedures:
export const settingsRouter = router({
  // ... existing getTenant, updateTenant

  // Get user settings
  getUserSettings: protectedProcedure
    .query(async ({ ctx }) => {
      const userSetting = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, ctx.authContext.userId))
        .limit(1);

      // Return defaults if no settings exist
      if (userSetting.length === 0) {
        return {
          emailNotifications: true,
          inAppNotifications: true,
          digestEmail: "daily",
          theme: "system",
          language: "en",
          timezone: "Europe/London",
        };
      }

      return userSetting[0];
    }),

  // Update user settings
  updateUserSettings: protectedProcedure
    .input(userSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Upsert user settings
      await db
        .insert(userSettings)
        .values({
          id: crypto.randomUUID(),
          userId: ctx.authContext.userId,
          ...input,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: {
            ...input,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),
});
```

### Settings Page Implementation

```typescript
// app/client-hub/settings/page.tsx

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { companySettingsSchema, userSettingsSchema } from "@/lib/schemas/settings-schemas";

export default function SettingsPage() {
  // Fetch settings from backend (replace hardcoded state)
  const { data: tenantSettings, isLoading: tenantLoading } = trpc.settings.getTenant.useQuery();
  const { data: userSettings, isLoading: userLoading } = trpc.settings.getUserSettings.useQuery();

  const utils = trpc.useUtils();

  // Update tenant settings
  const updateTenant = trpc.settings.updateTenant.useMutation({
    onSuccess: () => {
      toast.success("Company settings saved successfully");
      utils.settings.getTenant.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update user settings
  const updateUserSettings = trpc.settings.updateUserSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      utils.settings.getUserSettings.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveCompanySettings = (data: CompanySettings) => {
    updateTenant.mutate(data);
  };

  const handleSaveUserSettings = (data: UserSettings) => {
    updateUserSettings.mutate(data);
  };

  if (tenantLoading || userLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Company Settings Section */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Company Settings</h2>
        {/* Form fields for company settings */}
        <Button
          onClick={() => handleSaveCompanySettings(/* form data */)}
          disabled={updateTenant.isPending}
        >
          {updateTenant.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* User Settings Section */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
        {/* Form fields for user settings */}
        <Button
          onClick={() => handleSaveUserSettings(/* form data */)}
          disabled={updateUserSettings.isPending}
        >
          {updateUserSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
```

### Technical Notes

- **Backend Already Exists:** Settings router exists at settings.ts:19-167 - this story is primarily wiring UI
- **JSONB Queries:** Use Drizzle JSONB syntax: `tenants.metadata->>'company'`
- **Optimistic Updates:** Use tRPC `onMutate` hook for optimistic updates with rollback
- **Validation:** Use Zod schemas for client-side and server-side validation
- **Defaults:** Provide sensible defaults if settings don't exist (first-time load)

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] userSettings table created with unique constraint on userId
- [ ] Settings page wired to existing settings tRPC router
- [ ] Hardcoded handleSave() at settings/page.tsx:84-86 replaced with real mutations
- [ ] Hardcoded useState at settings/page.tsx:40-86 replaced with tRPC queries
- [ ] Company settings fetch via settings.getTenant query
- [ ] Company settings save via settings.updateTenant mutation
- [ ] User settings fetch via settings.getUserSettings query
- [ ] User settings save via settings.updateUserSettings mutation
- [ ] Settings stored in tenants.metadata JSONB with correct structure
- [ ] Loading states during save ("Saving..." indicator)
- [ ] Error handling with user-friendly toast messages
- [ ] Optimistic updates with rollback on failure
- [ ] Real-time save indicators ("Saved ✓" confirmation)
- [ ] Form validation with Zod schemas
- [ ] Settings preview for date format and timezone
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Settings persist across sessions (100% persistence rate)
- [ ] Unit tests written for settings queries/mutations
- [ ] Integration tests for settings save/load cycle
- [ ] E2E tests for settings workflow
- [ ] Seed data updated with sample tenant/user settings
- [ ] Code reviewed with focus on validation and error handling
- [ ] Documentation updated: settings configuration guide
- [ ] Performance benchmarks met (<500ms fetch, <1s save)
- [ ] No regressions in existing functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- None (settings router already exists)

**Downstream:**
- Epic 3: Reports dashboard uses date format and currency from settings
- Epic 4: Staff management uses fiscal year start from settings

**External:**
- None

---

## Testing Strategy

### Unit Tests
- Test settings fetch returns defaults if no settings exist
- Test settings save creates new record on first save
- Test settings save updates existing record on subsequent saves
- Test validation rejects invalid email/phone formats
- Test multi-tenant isolation (settings filtered by tenantId)

### Integration Tests
- Test settings save/load cycle (100% persistence)
- Test optimistic updates rollback on failure
- Test JSONB query/update for tenant metadata
- Test user settings unique constraint (one per user)

### E2E Tests
- Test settings page loads with fetched data (not hardcoded)
- Test company settings save and persist across logout/login
- Test user settings save and persist across sessions
- Test validation error messages display correctly

---

## Risks & Mitigation

**Risk:** Settings migration from local state to backend breaks existing UI
**Mitigation:** No existing data to migrate (currently hardcoded defaults); extensive testing of save/load cycle
**Impact:** Low - no user data loss risk

**Risk:** JSONB schema changes break existing tenants
**Mitigation:** Validate JSONB structure on read/write; provide migration script if structure changes; backward-compatible schema
**Impact:** Low - graceful degradation to defaults if structure invalid

**Risk:** Performance degradation with JSONB queries
**Mitigation:** Index JSONB fields if needed; cache settings in memory on server; use proper Drizzle JSONB operators
**Impact:** Low - settings queries are infrequent

---

## Notes

- **Easiest Gap to Fix:** Settings backend already exists (settings.ts:19-167), just wire UI to backend
- **0% → 100% Save Rate:** Currently all settings hardcoded with local state, this story achieves 100% persistence
- **Foundation for Future:** System configuration (currency, timezone, fiscal year) required by reports, staff management
- **Zod Validation:** Use shared Zod schemas for client-side and server-side validation consistency
- **JSONB Storage:** Tenant settings stored in existing tenants.metadata JSONB field (no new table needed)
- **User Settings Table:** New userSettings table for user-scoped preferences (notifications, theme, language)
- **Settings Preview:** Real-time preview of date format and timezone helps users visualize changes

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-2 - High-Impact Workflows
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR7 + FR8)
