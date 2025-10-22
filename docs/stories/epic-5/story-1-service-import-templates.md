# User Story: Service CSV Import & Import Templates

**Story ID:** STORY-5.1
**Epic:** Epic 5 - Bulk Operations & Data Import
**Feature:** FR26 (Service CSV Import) + FR27 (Import Templates)
**Priority:** Medium
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** service CSV import with validation and downloadable CSV templates for all entity types
**So that** I can rapidly import services and provide users with import guidance

---

## Business Value

- **Efficiency:** Rapid service import (100+ services in <30s)
- **Guidance:** Templates with examples help users prepare imports correctly
- **Foundation:** Service import completes bulk import capabilities

---

## Acceptance Criteria

**AC1:** Service CSV import endpoint at `/api/import/services`
**AC2:** Template structure: name, category, billing_type, description, default_rate, estimated_hours, is_active
**AC3:** Validation: name required, category match existing, billing_type enum, rate/hours decimal
**AC4:** Category validation against database categories
**AC5:** Duplicate detection by (tenant_id, name)
**AC6:** Import preview (first 5 rows, dry-run)
**AC7:** Import summary: "42 services imported, 2 skipped, 1 error"
**AC8:** Template generation endpoint at `/api/import/templates/[type]`
**AC9:** Template types: clients, services, tasks, users
**AC10:** Template structure: Row 1 (headers), Row 2 (examples), Row 3 (comments)
**AC11:** Template download button in DataImportModal
**AC12:** File naming: {entity}_import_template_{date}.csv

---

## Technical Implementation

```typescript
// Service import validation schema
const serviceImportSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string(),
  billing_type: z.enum(["fixed", "hourly", "value"]),
  description: z.string().optional(),
  default_rate: z.number().min(0),
  estimated_hours: z.number().min(0),
  is_active: z.boolean().default(true),
});

// Template generation
function generateTemplate(type: string) {
  const schemas = {
    services: serviceImportSchema,
    clients: clientImportSchema,
    tasks: taskImportSchema,
  };

  const headers = Object.keys(schemas[type].shape).join(",");
  const examples = "Example Service,Tax,hourly,Tax return service,150.00,8.5,true";
  const comments = "Required,Existing category,fixed|hourly|value,Optional,Decimal,Decimal,true/false";

  return `${headers}\n${examples}\n${comments}`;
}
```

---

## Definition of Done

- [ ] Service import endpoint functional
- [ ] Service validation rules working
- [ ] Template generation endpoint created
- [ ] Templates downloadable for all entity types
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-5 - Bulk Operations
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR26 + FR27)
