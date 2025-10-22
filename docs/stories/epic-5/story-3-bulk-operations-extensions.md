# User Story: Bulk Operations Extensions

**Story ID:** STORY-5.3
**Epic:** Epic 5 - Bulk Operations & Data Import
**Feature:** FR29 - Bulk Operations Extensions
**Priority:** Medium
**Effort:** 3-4 days
**Status:** Ready for Development

---

## User Story

**As a** staff member
**I want** bulk operations for clients, invoices, documents, and users with bulk action bars
**So that** I can efficiently manage large datasets without individual actions

---

## Business Value

- **Efficiency:** Manage 100+ items with single action
- **Productivity:** Reduces repetitive tasks significantly
- **Consistency:** Bulk actions ensure consistent updates

---

## Acceptance Criteria

**Bulk Client Operations:**
**AC1:** Bulk action bar in client list
**AC2:** Actions: change status, assign manager, add tags, export, delete
**AC3:** tRPC: clients.bulkUpdateStatus, bulkAssignManager, bulkAddTags, bulkDelete
**AC4:** Checkbox selection with "Select all"
**AC5:** Confirmation modal showing count

**Bulk Invoice Operations:**
**AC6:** Bulk action bar in invoice list
**AC7:** Actions: change status, send emails, export, delete
**AC8:** tRPC: invoices.bulkUpdateStatus, bulkSendEmails, bulkDelete
**AC9:** Bulk email preview (first 3 recipients)
**AC10:** Progress indicator: "Sending 15 invoices... 8/15 sent"

**Bulk Document Operations:**
**AC11:** Bulk action bar in document list
**AC12:** Actions: move to folder, change category, download ZIP, delete
**AC13:** tRPC: documents.bulkMove, bulkChangeCategory, bulkDelete
**AC14:** Server-side ZIP creation for download

**Bulk User Operations:**
**AC15:** Bulk action bar in user list
**AC16:** Actions: activate/deactivate, change role, assign department, export
**AC17:** tRPC: users.bulkUpdateStatus, bulkChangeRole, bulkAssignDepartment
**AC18:** Admin protection: prevent bulk deactivation of own account

**General Requirements:**
**AC19:** Bulk action bars follow task bulk action pattern (BulkActionBar component)
**AC20:** Confirmation dialogs for destructive actions
**AC21:** Progress indicators for operations with >10 items
**AC22:** Audit logging for all bulk operations
**AC23:** Transaction safety: rollback on partial failure

---

## Technical Implementation

```typescript
// Bulk action pattern (reusable component)
export function BulkActionBar({
  selectedCount,
  onAction,
  actions,
}: {
  selectedCount: number;
  onAction: (action: string) => void;
  actions: Array<{ id: string; label: string; icon: React.ReactNode }>;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900">
      <span>{selectedCount} selected</span>
      {actions.map((action) => (
        <Button key={action.id} onClick={() => onAction(action.id)}>
          {action.icon} {action.label}
        </Button>
      ))}
    </div>
  );
}

// Bulk mutation pattern
export const bulkUpdateStatus = protectedProcedure
  .input(z.object({
    ids: z.array(z.string()),
    status: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    await db.transaction(async (tx) => {
      for (const id of input.ids) {
        await tx.update(clients)
          .set({ status: input.status })
          .where(and(
            eq(clients.id, id),
            eq(clients.tenantId, ctx.authContext.tenantId)
          ));
      }

      // Audit log
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(),
        tenantId: ctx.authContext.tenantId,
        userId: ctx.authContext.userId,
        action: "bulk_update_status",
        entityType: "clients",
        entityIds: input.ids,
        details: { status: input.status },
      });
    });

    return { success: true, count: input.ids.length };
  });
```

---

## Definition of Done

- [ ] Bulk action bars added to all list views
- [ ] All bulk operations functional
- [ ] Confirmation dialogs working
- [ ] Progress indicators for long operations
- [ ] Audit logging for bulk actions
- [ ] Transaction safety implemented
- [ ] Admin protections working
- [ ] Multi-tenant isolation verified
- [ ] Tests written
- [ ] Documentation updated

---

**Story Owner:** Development Team
**Created:** 2025-10-22
**Epic:** EPIC-5 - Bulk Operations
**Related PRD:** `/root/projects/practice-hub/docs/prd.md` (FR29)
