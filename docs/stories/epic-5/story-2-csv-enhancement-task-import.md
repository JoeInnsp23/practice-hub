# User Story: CSV Parsing Enhancement & Task Import

**Story ID:** STORY-5.2
**Epic:** Epic 5 - Bulk Operations & Data Import
**Feature:** FR28 (CSV Parsing Enhancement) + Task CSV Import
**Priority:** Medium
**Effort:** 2-3 days
**Status:** Ready for Development

---

## User Story

**As a** system developer
**I want** enhanced CSV parser with multi-delimiter, date parsing, BOM handling, plus task CSV import
**So that** the system handles real-world CSV variations and supports complete bulk import capabilities

---

## Business Value

- **Robustness:** Handles various CSV formats from different sources
- **Completeness:** Task import completes bulk import suite
- **Compatibility:** Supports Excel, Numbers, Google Sheets exports

---

## Acceptance Criteria

**AC1:** Multi-delimiter support: comma, semicolon, tab
**AC2:** Delimiter auto-detection from first row
**AC3:** Date format parsing: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY
**AC4:** Date format auto-detection (try formats until success)
**AC5:** BOM handling: strip UTF-8 BOM (\uFEFF) if present
**AC6:** Quote handling: handle quoted fields with delimiters ("Main St, Suite 5")
**AC7:** Line ending handling: \n, \r\n, \r
**AC8:** Value transformation utilities: parseDate, parseNumber, parseBoolean
**AC9:** Task CSV import endpoint at `/api/import/tasks`
**AC10:** Task template: title, description, task_type, priority, status, client_code, service_name, assigned_to_email, due_date, estimated_hours
**AC11:** Client lookup by client_code
**AC12:** User lookup by email for assignment
**AC13:** Duplicate detection by title for client
**AC14:** Import preview and summary

---

## Technical Implementation

```typescript
// Enhanced CSV parser
export interface CSVParserConfig {
  delimiter?: string; // auto-detect if not specified
  dateFormats?: string[]; // try in order
  encoding?: string;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
}

export function parseDate(value: string, formats: string[]): Date | null {
  for (const format of formats) {
    try {
      const parsed = parse(value, format, new Date());
      if (isValid(parsed)) return parsed;
    } catch {}
  }
  return null;
}

export function detectDelimiter(firstRow: string): string {
  const delimiters = [",", ";", "\t"];
  const counts = delimiters.map((d) => firstRow.split(d).length);
  const maxIndex = counts.indexOf(Math.max(...counts));
  return delimiters[maxIndex];
}

// Task import validation
const taskImportSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  task_type: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.string(),
  client_code: z.string(),
  assigned_to_email: z.string().email().optional(),
  due_date: z.string(), // will be parsed to Date
  estimated_hours: z.number().optional(),
});
```

---

## Definition of Done

- [ ] CSV parser enhanced with all features
- [ ] Task import endpoint functional
- [ ] Multi-delimiter support working
- [ ] Date parsing with auto-detection
- [ ] BOM handling implemented
- [ ] Client/user lookups working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-5 - Bulk Operations
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR28)
