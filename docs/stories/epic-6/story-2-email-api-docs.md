# User Story: Email Automation & API Documentation

**Story ID:** STORY-6.2
**Epic:** Epic 6 - Polish & Enhancements
**Feature:** FR32 (Email Automation) + FR33 (API Documentation)
**Priority:** Low
**Effort:** 4-5 days
**Status:** Ready for Development

---

## User Story

**As a** practice administrator and developer
**I want** workflow-triggered email automation with templates and internal API documentation
**So that** I can automate communications and provide developer reference

---

## Business Value

- **Automation:** Workflow-triggered emails reduce manual communication
- **Consistency:** Email templates ensure consistent messaging
- **Developer Experience:** API docs improve internal development efficiency

---

## Acceptance Criteria

**Email Automation (FR32):**
**AC1:** emailTemplates table created (tenant_id, template_name, template_type, subject, body_html, body_text, variables[], is_active)
**AC2:** Template types: workflow_stage_complete, task_assigned, task_due_soon, task_overdue, client_created, client_status_changed
**AC3:** workflowEmailRules table (workflow_id, stage_id, email_template_id, recipient_type, send_delay_hours)
**AC4:** Recipient types: client, assigned_staff, client_manager, custom_email
**AC5:** Variables: {client_name}, {task_name}, {due_date}, {staff_name}, {company_name}, {workflow_name}, {stage_name}
**AC6:** Variable substitution at send time
**AC7:** Email scheduling with optional delay
**AC8:** Email queue with retry logic (emailQueue table)
**AC9:** Template editor UI at `/admin/settings/email-templates`
**AC10:** Template preview with sample data
**AC11:** tRPC: emailTemplates.list, create, update, preview, sendTest

**API Documentation (FR33):**
**AC12:** API docs page at `/admin/api-docs`
**AC13:** tRPC endpoint listing: all routers and procedures
**AC14:** Endpoint documentation: name, description, request/response schemas, examples, auth requirements
**AC15:** External API section: Companies House, HMRC, DocuSeal endpoints
**AC16:** Database schema documentation: tables, relationships, field descriptions
**AC17:** Search functionality: filter endpoints
**AC18:** Copy button for JSON examples
**AC19:** Syntax highlighting for JSON

---

## Technical Implementation

```typescript
// emailTemplates table
export const emailTemplates = pgTable("email_templates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  templateName: text("template_name").notNull(),
  templateType: text("template_type").notNull(),
  subject: text("subject").notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  variables: text("variables").array(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Variable substitution
function renderTemplate(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

// Workflow trigger
async function onWorkflowStageComplete(workflowId: string, stageId: string) {
  const rules = await db.select()
    .from(workflowEmailRules)
    .where(and(
      eq(workflowEmailRules.workflowId, workflowId),
      eq(workflowEmailRules.stageId, stageId)
    ));

  for (const rule of rules) {
    await queueEmail(rule);
  }
}
```

---

## Definition of Done

- [ ] emailTemplates, workflowEmailRules, emailQueue tables created
- [ ] Template editor UI functional
- [ ] Variable substitution working
- [ ] Workflow triggers sending emails
- [ ] Email queue processing
- [ ] API documentation page created
- [ ] tRPC endpoints documented
- [ ] External APIs documented
- [ ] Search and copy features working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-6 - Polish & Enhancements
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR32 + FR33)
