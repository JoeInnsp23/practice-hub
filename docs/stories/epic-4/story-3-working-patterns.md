# User Story: Working Patterns & Flexible Arrangements

**Story ID:** STORY-4.3
**Epic:** Epic 4 - Staff Management & Operations
**Feature:** FR21 - Working Patterns Management
**Priority:** Medium
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** working patterns management with day-by-day hour tracking
**So that** I can support flexible working arrangements and accurate capacity calculations

---

## Business Value

- **Flexibility:** Supports part-time, compressed hours, job shares
- **Accuracy:** Accurate capacity from day-level hour patterns
- **Modern Work:** Enables flexible working arrangements

---

## Acceptance Criteria

**AC1:** workingPatterns table created with day-by-day hours (monday_hours, tuesday_hours, etc.)
**AC2:** Working patterns interface at `/admin/staff/working-patterns`
**AC3:** Pattern entry form: user, pattern type, day hours inputs
**AC4:** Pattern type options: full_time, part_time, compressed_hours, job_share, custom
**AC5:** Pattern templates: predefined for common patterns (e.g., "Standard Full-Time: Mon-Fri 7.5h")
**AC6:** Pattern history view per staff
**AC7:** Pattern-aware capacity calculations (use contracted_hours)
**AC8:** Integration with time tracking validation
**AC9:** Summary: "John: Mon-Thu 9h, Fri off (36h/week)"
**AC10:** tRPC: workingPatterns.list, create, update, getByUser, getActive

---

## Technical Implementation

```typescript
// workingPatterns table
export const workingPatterns = pgTable("working_patterns", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  patternType: text("pattern_type").notNull(),
  contractedHours: real("contracted_hours").notNull(),
  mondayHours: real("monday_hours").default(0).notNull(),
  tuesdayHours: real("tuesday_hours").default(0).notNull(),
  wednesdayHours: real("wednesday_hours").default(0).notNull(),
  thursdayHours: real("thursday_hours").default(0).notNull(),
  fridayHours: real("friday_hours").default(0).notNull(),
  saturdayHours: real("saturday_hours").default(0).notNull(),
  sundayHours: real("sunday_hours").default(0).notNull(),
  effectiveFrom: date("effective_from").notNull(),
  notes: text("notes"),
});

// Validation: SUM(day_hours) = contracted_hours
```

**Seed Patterns:** "Standard Full-Time (37.5h)", "Part-Time 20h", "Compressed 4-day (36h)"

---

## Definition of Done

- [ ] workingPatterns table created
- [ ] Working patterns UI functional
- [ ] Pattern templates created
- [ ] Capacity integration working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Seed data updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-4 - Staff Management
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR21)
