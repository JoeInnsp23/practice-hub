# User Story: Department Management & Staff Organization

**Story ID:** STORY-4.1
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR19 - Department Management
**Priority:** Medium
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** department organizational structure with manager and staff assignments
**So that** I can organize staff and enable department-level reporting

---

## Business Value

- **Organization:** Hierarchical structure for staff management
- **Reporting:** Department-level metrics and aggregations
- **Accountability:** Clear manager assignments per department

---

## Acceptance Criteria

**AC1:** departments table created with tenant_id, name, description, manager_id, is_active
**AC2:** Admin interface at `/admin/departments` with list, create, edit, delete
**AC3:** Department manager selection from users with manager/admin role
**AC4:** Add departmentId field to users table (FK to departments.id)
**AC5:** User edit form includes department assignment dropdown
**AC6:** Department soft delete (is_active = false)
**AC7:** Department filtering in staff lists and reports
**AC8:** Department card shows name, manager, staff count, description
**AC9:** tRPC: departments.list, create, update, delete, getById, getStaffByDepartment

---

## Technical Implementation

```typescript
// departments table
export const departments = pgTable("departments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: text("manager_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add to users table
departmentId: text("department_id").references(() => departments.id),
```

**Seed Data:** "Tax", "Audit", "Advisory", "Admin"

---

## Definition of Done

- [ ] departments table created
- [ ] Admin UI at `/admin/departments`
- [ ] Department CRUD functional
- [ ] departmentId added to users table
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Seed data updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR19)
