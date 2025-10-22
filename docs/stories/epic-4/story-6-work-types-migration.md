# User Story: Work Type Migration to Database

**Story ID:** STORY-4.6
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR25 - Work Type Management UI
**Priority:** Medium
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** work types migrated from enum to database table with admin configuration UI
**So that** I can customize work types per tenant and maintain historical data

---

## Business Value

- **Customization:** Per-tenant work type configuration
- **Flexibility:** Add/edit work types without code changes
- **Historical Integrity:** Preserve existing timesheet data

---

## Acceptance Criteria

**AC1:** workTypes table created (tenant_id, code, label, color_code, is_active, sort_order, is_billable)
**AC2:** Migrate existing workTypeEnum values to seed data
**AC3:** Admin interface at `/admin/settings/work-types`
**AC4:** Work type list view with color indicators
**AC5:** Create form: code (unique), label, color picker, billable checkbox
**AC6:** Edit form: update label, color, billable flag
**AC7:** Soft delete (is_active flag, preserve historical)
**AC8:** Sort order drag-and-drop reordering
**AC9:** Color picker component for badge colors
**AC10:** Update timeEntries.workType: enum → text FK (references workTypes.code)
**AC11:** Migration script: convert enum → workTypes records per tenant
**AC12:** Seed default work types: "Work", "Admin", "Training", "Meeting", "Holiday", "Sick"
**AC13:** Color-coded badges in timesheet
**AC14:** tRPC: workTypes.list, create, update, softDelete, reorder

---

## Technical Implementation

```typescript
// workTypes table
export const workTypes = pgTable("work_types", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  code: text("code").notNull(), // "WORK", "ADMIN", etc.
  label: text("label").notNull(), // "Work", "Admin"
  colorCode: text("color_code").notNull(), // "#3b82f6"
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isBillable: boolean("is_billable").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCode: unique().on(table.tenantId, table.code),
}));

// Update timeEntries schema
// Before: workType: workTypeEnum("work_type")
// After: workType: text("work_type").references(() => workTypes.code).notNull()

// Migration script
async function migrateWorkTypes() {
  const tenants = await db.select().from(tenants);

  for (const tenant of tenants) {
    // Create default work types for each tenant
    const defaultTypes = ["WORK", "ADMIN", "TRAINING", "MEETING", "HOLIDAY", "SICK"];
    for (const code of defaultTypes) {
      await db.insert(workTypes).values({
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        code,
        label: code.charAt(0) + code.slice(1).toLowerCase(),
        colorCode: getDefaultColor(code),
        isActive: true,
        isBillable: ["WORK", "ADMIN"].includes(code),
      });
    }
  }
}
```

---

## Definition of Done

- [ ] workTypes table created
- [ ] Admin UI at `/admin/settings/work-types`
- [ ] Work type CRUD functional
- [ ] timeEntries.workType migrated to FK
- [ ] Migration script tested
- [ ] Seed data updated
- [ ] Color badges in timesheet
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Migration guide documented

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR25)
