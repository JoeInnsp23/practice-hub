# User Story: Task Templates System

**Story ID:** STORY-3.1
**Epic:** Epic 3 - Advanced Automation Features
**Feature:** FR13 - Task Templates System
**Priority:** High
**Effort:** 5-6 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator
**I want** task template management with placeholder system and service-level assignment
**So that** I can standardize recurring tasks and enable automated task generation

---

## Business Value

- **Standardization:** Ensures consistent task naming and descriptions across the practice
- **Efficiency:** Prerequisite for automated task generation (eliminates manual task creation)
- **Flexibility:** Client-level overrides accommodate special requirements
- **Scalability:** Template once, generate hundreds of tasks automatically

---

## Acceptance Criteria

### Functional Requirements - Template Management

**AC1: Task Settings UI**
- **Given** an admin navigates to `/client-hub/settings/task-templates`
- **When** the page loads
- **Then** all task templates are displayed in a list
- **And** templates show: name pattern, service, task type, priority, due date offset

**AC2: Template List View**
- **Given** templates are displayed
- **When** the list renders
- **Then** search and filter controls are available
- **And** filters include: service, task type, active/inactive status
- **And** search matches template name or description
- **And** templates are sortable by name, service, priority

**AC3: Template Create Form**
- **Given** an admin clicks "Create Template" button
- **When** the form opens
- **Then** fields are available for:
  - Name pattern (with placeholder support)
  - Description pattern (with placeholder support)
  - Estimated hours
  - Priority (low/medium/high/urgent)
  - Task type
  - Due date offset (days and/or months)
  - Service component assignment
  - Recurring flag

**AC4: Placeholder System**
- **Given** a template is being created or edited
- **When** the admin enters placeholders in name/description
- **Then** supported placeholders are: `{client_name}`, `{service_name}`, `{period}`, `{tax_year}`, `{company_number}`
- **And** placeholder autocomplete suggests available placeholders
- **And** invalid placeholders are highlighted with error

**AC5: Placeholder Preview**
- **Given** a template has placeholders in name/description
- **When** the admin clicks "Preview" button
- **Then** preview modal shows example with sample data:
  - `{client_name}` → "Acme Ltd"
  - `{service_name}` → "Corporation Tax Return"
  - `{period}` → "Q1 2025"
  - `{tax_year}` → "2024/25"
  - `{company_number}` → "12345678"
- **And** preview shows: "Corporation Tax Return for Acme Ltd - Q1 2025"

**AC6: Due Date Offset Configuration**
- **Given** a template is being configured
- **When** the admin sets due date offset
- **Then** options include:
  - Days after service activation (e.g., "+30 days")
  - Months after service activation (e.g., "+3 months")
  - Fixed day of month (e.g., "15th of month after activation")
- **And** preview shows calculated due date with example activation date

**AC7: Template Preview Modal**
- **Given** an admin views a template
- **When** they click "Preview Generated Task" button
- **Then** modal shows full task preview with:
  - Task name (placeholders replaced)
  - Task description (placeholders replaced)
  - Estimated hours
  - Priority
  - Due date (calculated from today + offset)
  - Target date (default: due date - 7 days)

**AC8: Service-Level Template Assignment**
- **Given** a template is created
- **When** the admin assigns template to services
- **Then** multiple services can be selected (one template → many services)
- **And** service assignment is stored in taskTemplateServices table
- **And** template list shows "Assigned to 3 services"

**AC9: Client-Level Override Interface**
- **Given** a template is assigned to services
- **When** an admin views a client's service settings
- **Then** "Template Overrides" section is available
- **And** admin can disable specific templates for that client
- **And** admin can customize due date for that client
- **And** admin can customize priority for that client

**AC10: Template Soft Delete**
- **Given** a template is no longer needed
- **When** the admin clicks "Delete" button
- **Then** template is soft deleted (`is_active = false`)
- **And** template is hidden from active list
- **And** template data is preserved for audit trail
- **And** inactive templates can be viewed with "Show Inactive" filter

**AC11: Template Cloning**
- **Given** an admin views a template
- **When** they click "Duplicate" button
- **Then** new template is created with same settings
- **And** template name is suffixed with " (Copy)"
- **And** admin is redirected to edit form for new template

### Functional Requirements - Template Operations

**AC12: Template Edit**
- **Given** an admin clicks "Edit" on a template
- **When** the edit form opens
- **Then** all fields are populated with current values
- **And** saving updates the template
- **And** `updatedAt` timestamp is recorded

**AC13: Template Deletion Confirmation**
- **Given** an admin clicks "Delete" on a template
- **When** the confirmation modal opens
- **Then** warning is shown: "This template is assigned to 3 services. Tasks already generated will not be affected."
- **And** admin must confirm deletion
- **And** deletion proceeds only after confirmation

**AC14: Template Validation**
- **Given** a template is being saved
- **When** validation runs
- **Then** required fields are checked: name pattern, priority, task type
- **And** placeholder syntax is validated (must be `{valid_name}`)
- **And** due date offset must be positive integer
- **And** errors are displayed with field highlighting

### Integration Requirements

**AC15: Multi-tenant Isolation**
- **Given** multiple tenants in the system
- **When** templates are queried
- **Then** all queries filter by tenantId
- **And** templates are scoped to tenant (cannot share across tenants)

**AC16: Service Component Integration**
- **Given** a template is assigned to service component
- **When** service is activated
- **Then** template can trigger task generation (Epic 3 STORY-2)
- **And** service detail page shows assigned templates

### Quality Requirements

**AC17: Performance**
- **Given** 100+ templates exist
- **When** template list is loaded
- **Then** page loads in <2 seconds
- **And** search/filter is instant (<200ms)

**AC18: Placeholder Replacement Performance**
- **Given** 50+ tasks are generated from template
- **When** placeholder replacement runs
- **Then** all tasks are generated in <5 seconds

---

## Technical Implementation

### Database Schema Changes

```typescript
// lib/db/schema.ts

// taskTemplates table
export const taskTemplates = pgTable("task_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  namePattern: text("name_pattern").notNull(), // "Q{quarter} VAT Return for {client_name}"
  descriptionPattern: text("description_pattern"),
  estimatedHours: real("estimated_hours"),
  priority: text("priority").notNull(), // "low" | "medium" | "high" | "urgent"
  taskType: text("task_type").notNull(),
  dueDateOffsetDays: integer("due_date_offset_days").default(0),
  dueDateOffsetMonths: integer("due_date_offset_months").default(0),
  serviceComponentId: text("service_component_id").references(() => serviceComponents.id),
  isRecurring: boolean("is_recurring").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index("task_templates_tenant_id_idx").on(table.tenantId),
  serviceComponentIdx: index("task_templates_service_component_idx").on(table.serviceComponentId),
}));

// taskTemplateServices (many-to-many linkage)
export const taskTemplateServices = pgTable("task_template_services", {
  templateId: text("template_id").references(() => taskTemplates.id).notNull(),
  serviceId: text("service_id").references(() => services.id).notNull(),
}, (table) => ({
  pk: primaryKey(table.templateId, table.serviceId),
}));

// clientTaskTemplateOverrides
export const clientTaskTemplateOverrides = pgTable("client_task_template_overrides", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  clientId: text("client_id").references(() => clients.id).notNull(),
  templateId: text("template_id").references(() => taskTemplates.id).notNull(),
  customDueDate: date("custom_due_date"),
  customPriority: text("custom_priority"),
  isDisabled: boolean("is_disabled").default(false),
}, (table) => ({
  tenantIdIdx: index("client_task_template_overrides_tenant_id_idx").on(table.tenantId),
  clientTemplateUnique: unique().on(table.clientId, table.templateId),
}));
```

### File Structure

```
app/client-hub/settings/
  task-templates/
    page.tsx                    # Task templates list and management
    [id]/
      page.tsx                  # Template edit page
components/client-hub/
  task-template-form.tsx        # Template create/edit form
  task-template-preview.tsx     # Template preview modal
  placeholder-input.tsx         # Input with placeholder autocomplete
lib/services/
  template-placeholders.ts      # Placeholder replacement logic
```

### Placeholder Replacement Service

```typescript
// lib/services/template-placeholders.ts

import { format } from "date-fns";

export const SUPPORTED_PLACEHOLDERS = {
  client_name: "Client company name",
  service_name: "Service name",
  period: "Current period (e.g., Q1 2025)",
  tax_year: "Tax year (e.g., 2024/25)",
  company_number: "Companies House number",
  quarter: "Current quarter (1-4)",
  month: "Current month name",
  year: "Current year",
};

export interface PlaceholderData {
  clientName?: string;
  serviceName?: string;
  period?: string;
  taxYear?: string;
  companyNumber?: string;
  activationDate?: Date;
}

export function replacePlaceholders(
  text: string,
  data: PlaceholderData
): string {
  let result = text;

  // Replace client name
  if (data.clientName) {
    result = result.replace(/{client_name}/g, data.clientName);
  }

  // Replace service name
  if (data.serviceName) {
    result = result.replace(/{service_name}/g, data.serviceName);
  }

  // Replace period
  if (data.period) {
    result = result.replace(/{period}/g, data.period);
  }

  // Replace tax year
  if (data.taxYear) {
    result = result.replace(/{tax_year}/g, data.taxYear);
  }

  // Replace company number
  if (data.companyNumber) {
    result = result.replace(/{company_number}/g, data.companyNumber);
  }

  // Replace quarter (derived from activation date)
  if (data.activationDate) {
    const quarter = Math.ceil((data.activationDate.getMonth() + 1) / 3);
    result = result.replace(/{quarter}/g, quarter.toString());

    const month = format(data.activationDate, "MMMM");
    result = result.replace(/{month}/g, month);

    const year = format(data.activationDate, "yyyy");
    result = result.replace(/{year}/g, year);
  }

  return result;
}

export function validatePlaceholders(text: string): { valid: boolean; errors: string[] } {
  const placeholderRegex = /{([^}]+)}/g;
  const errors: string[] = [];
  const matches = text.matchAll(placeholderRegex);

  for (const match of matches) {
    const placeholderName = match[1];
    if (!SUPPORTED_PLACEHOLDERS.hasOwnProperty(placeholderName)) {
      errors.push(`Invalid placeholder: {${placeholderName}}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function calculateDueDate(
  activationDate: Date,
  offsetDays: number,
  offsetMonths: number
): Date {
  let dueDate = new Date(activationDate);

  if (offsetMonths > 0) {
    dueDate.setMonth(dueDate.getMonth() + offsetMonths);
  }

  if (offsetDays > 0) {
    dueDate.setDate(dueDate.getDate() + offsetDays);
  }

  return dueDate;
}
```

### tRPC Procedures

```typescript
// app/server/routers/taskTemplates.ts

export const taskTemplatesRouter = router({
  // List all templates
  list: protectedProcedure
    .input(z.object({
      serviceId: z.string().optional(),
      taskType: z.string().optional(),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [eq(taskTemplates.tenantId, ctx.authContext.tenantId)];

      if (!input.includeInactive) {
        conditions.push(eq(taskTemplates.isActive, true));
      }

      if (input.serviceId) {
        conditions.push(eq(taskTemplateServices.serviceId, input.serviceId));
      }

      if (input.taskType) {
        conditions.push(eq(taskTemplates.taskType, input.taskType));
      }

      const templates = await db
        .select()
        .from(taskTemplates)
        .where(and(...conditions))
        .orderBy(desc(taskTemplates.createdAt));

      return templates;
    }),

  // Create template
  create: protectedProcedure
    .input(z.object({
      namePattern: z.string().min(1),
      descriptionPattern: z.string().optional(),
      estimatedHours: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      taskType: z.string(),
      dueDateOffsetDays: z.number().default(0),
      dueDateOffsetMonths: z.number().default(0),
      serviceComponentId: z.string().optional(),
      isRecurring: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate placeholders
      const validation = validatePlaceholders(input.namePattern);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.errors.join(", "),
        });
      }

      const templateId = crypto.randomUUID();

      await db.insert(taskTemplates).values({
        id: templateId,
        tenantId: ctx.authContext.tenantId,
        ...input,
      });

      return { success: true, templateId };
    }),

  // Update template
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      namePattern: z.string().min(1),
      descriptionPattern: z.string().optional(),
      estimatedHours: z.number().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      taskType: z.string(),
      dueDateOffsetDays: z.number().default(0),
      dueDateOffsetMonths: z.number().default(0),
      serviceComponentId: z.string().optional(),
      isRecurring: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate placeholders
      const validation = validatePlaceholders(input.namePattern);
      if (!validation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.errors.join(", "),
        });
      }

      await db
        .update(taskTemplates)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId)
          )
        );

      return { success: true };
    }),

  // Delete (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(taskTemplates)
        .set({ isActive: false })
        .where(
          and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId)
          )
        );

      return { success: true };
    }),

  // Preview template
  preview: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      sampleClientName: z.string().default("Acme Ltd"),
      sampleServiceName: z.string().default("Corporation Tax Return"),
      samplePeriod: z.string().default("Q1 2025"),
    }))
    .query(async ({ ctx, input }) => {
      const template = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, input.templateId),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (template.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const placeholderData = {
        clientName: input.sampleClientName,
        serviceName: input.sampleServiceName,
        period: input.samplePeriod,
        taxYear: "2024/25",
        companyNumber: "12345678",
        activationDate: new Date(),
      };

      const taskName = replacePlaceholders(template[0].namePattern, placeholderData);
      const taskDescription = template[0].descriptionPattern
        ? replacePlaceholders(template[0].descriptionPattern, placeholderData)
        : undefined;

      const dueDate = calculateDueDate(
        new Date(),
        template[0].dueDateOffsetDays,
        template[0].dueDateOffsetMonths
      );

      return {
        taskName,
        taskDescription,
        estimatedHours: template[0].estimatedHours,
        priority: template[0].priority,
        taskType: template[0].taskType,
        dueDate: dueDate.toISOString(),
        targetDate: new Date(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }),

  // Assign template to service
  assignToService: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      serviceIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Remove existing assignments
      await db
        .delete(taskTemplateServices)
        .where(eq(taskTemplateServices.templateId, input.templateId));

      // Add new assignments
      for (const serviceId of input.serviceIds) {
        await db.insert(taskTemplateServices).values({
          templateId: input.templateId,
          serviceId,
        });
      }

      return { success: true };
    }),

  // Clone template
  clone: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const template = await db
        .select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, input.templateId),
            eq(taskTemplates.tenantId, ctx.authContext.tenantId)
          )
        )
        .limit(1);

      if (template.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newTemplateId = crypto.randomUUID();

      await db.insert(taskTemplates).values({
        ...template[0],
        id: newTemplateId,
        namePattern: `${template[0].namePattern} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, newTemplateId };
    }),
});
```

### Technical Notes

- **Reference Archived CRM:** TaskSettings.tsx has 500+ lines of template logic - reference for patterns
- **Date Calculations:** Use date-fns `addMonths` and `addDays` for reliable date calculations
- **Placeholder Validation:** Regex to validate placeholder syntax: `/\{([a-z_]+)\}/g`
- **Soft Delete:** Use `is_active` flag instead of hard delete for audit trail

---

## Definition of Done

- [ ] All acceptance criteria met and tested
- [ ] taskTemplates, taskTemplateServices, clientTaskTemplateOverrides tables created
- [ ] Task templates settings page created at `/client-hub/settings/task-templates`
- [ ] Template list view with search and filter functional
- [ ] Template create/edit form functional
- [ ] Placeholder system with supported placeholders (`{client_name}`, etc.)
- [ ] Placeholder validation with error highlighting
- [ ] Placeholder preview modal with sample data
- [ ] Due date offset configuration (days/months)
- [ ] Template preview modal showing generated task
- [ ] Service-level template assignment (many-to-many)
- [ ] Client-level override interface functional
- [ ] Template soft delete with `is_active` flag
- [ ] Template cloning functional
- [ ] Multi-tenant isolation verified (tenantId filtering)
- [ ] Unit tests written for placeholder replacement logic
- [ ] Integration tests for template CRUD operations
- [ ] E2E tests for template creation and preview
- [ ] Seed data updated with sample task templates
- [ ] Code reviewed with focus on placeholder validation
- [ ] Documentation updated: task template user guide
- [ ] Performance benchmarks met (<2s page load, <5s bulk generation)
- [ ] No regressions in existing functionality
- [ ] Feature deployed to staging and tested by QA

---

## Dependencies

**Upstream:**
- Epic 2 completed for task notes foundation (activity integration)

**Downstream:**
- Epic 3 STORY-2: Auto Task Generation requires task templates

**External:**
- date-fns library: `npm install date-fns`

---

## Testing Strategy

### Unit Tests
- Test placeholder replacement (all supported placeholders)
- Test placeholder validation (valid/invalid syntax)
- Test due date calculation (days/months offsets)
- Test multi-tenant isolation (templates filtered by tenantId)

### Integration Tests
- Test template creation with service assignment
- Test template cloning preserves all fields
- Test soft delete (template hidden, not removed)
- Test client override creation

### E2E Tests
- Test template creation workflow: create → assign to service → preview
- Test placeholder preview with sample data
- Test template edit and update

---

## Risks & Mitigation

**Risk:** Placeholder system complexity underestimated
**Mitigation:** Start with simple placeholders; reference archived CRM TaskSettings.tsx; use proven regex patterns
**Impact:** Low - placeholder logic is straightforward

**Risk:** Due date calculation edge cases (month boundaries, leap years)
**Mitigation:** Use battle-tested date-fns library; comprehensive testing with edge cases
**Impact:** Low - date-fns handles edge cases

**Risk:** Template proliferation (100+ templates)
**Mitigation:** Implement search/filter; pagination if needed; template organization by service
**Impact:** Low - UI performance tested with 100+ templates

---

## Notes

- **Archived CRM Reference:** TaskSettings.tsx (500+ lines) provides UI patterns for template management
- **Prerequisite for Automation:** Task templates are foundation for Epic 3 STORY-2 (auto task generation)
- **Placeholder Syntax:** Use curly braces `{placeholder_name}` matching common template syntax
- **Due Date Offsets:** Support both days and months for flexibility (e.g., "+3 months" or "+30 days")
- **Client Overrides:** Enable per-client customization without duplicating templates
- **Soft Delete:** Preserve templates for audit trail and tasks already generated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-3 - Advanced Automation Features
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR13)
