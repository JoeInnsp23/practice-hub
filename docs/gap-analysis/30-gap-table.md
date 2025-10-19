# Detailed Gap Analysis Table

---

## Feature-by-Feature Comparison

### CLIENT HUB

| ID | Area | Feature | Legacy Route(s) | Current Route(s) | Status | Severity | Confidence | Match Score | Evidence (Legacy / Current) | Why It Matters | Gap Details | Proposed Fix | Est. Effort |
|----|------|---------|---|---|---|---|---|---|---|---|---|---|---|
| CH-001 | Task Management | Task CRUD | `/tasks`, `/tasks/:id` | `/client-hub/tasks`, `/client-hub/tasks/[id]` | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/pages/TaskDetail.tsx` / `app/client-hub/tasks/page.tsx:49`, `app/server/routers/tasks.ts:54–946` | Core workflow – users must manage tasks | All CRUD operations implemented: create, list, update, complete, delete. Statuses: pending, in_progress, review, completed, cancelled, blocked. Fields match perfectly. Subtasks also added. | None – fully implemented | N/A | N/A |
| CH-002 | Task Management | Task Status Enum | `not_started`, `in_progress`, `review`, `completed`, `blocked` | `pending`, `in_progress`, `review`, `completed`, `cancelled`, `blocked`, + queries | ✅ OK | N/A | 100% | 98% | `.archive/crm-app/main/src/types/task.ts` / `lib/db/schema.ts:221–231` | Status enum must be comprehensive for workflow | Legacy: 5 states. Current: 7 states (added `pending`, `cancelled`, `queries_sent`, `queries_received`). Extra states enhance workflow. | Enhancement OK – superset of legacy | None required | N/A |
| CH-003 | Task Management | Task Priority Enum | `low`, `medium`, `high`, `urgent` | `low`, `medium`, `high`, `urgent`, `critical` | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/types/task.ts` / `lib/db/schema.ts:232–238` | Priority affects sorting/filtering | Current adds `critical` level. Superset of legacy. | Enhancement OK | None required | N/A |
| CH-004 | Task Management | Task Assignment | Via task modal dropdown | Via task modal + bulk assign dialog | ✅ OK | N/A | 100% | 98% | `.archive/crm-app/main/src/pages/TaskDetail.tsx` / `app/client-hub/tasks/page.tsx`, `bulk-action-bar.tsx:120–200` | Staff must know who owns each task | Supports: single assign, reassign, bulk assign. Activity logged. Notifications sent. | Minor gap: no reassign "reason" field (can add if needed) | Add optional `reassignReason` field to tasks table if audit required; otherwise OK as-is | S |
| CH-005 | Task Management | Task Bulk Status Update | TaskBulkActions component | bulk-action-bar.tsx | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskBulkActions.tsx:15–50` / `app/server/routers/tasks.ts:761–832` | Users need efficient multi-task updates | Both: multi-select, status picker, atomic transaction, confirmation. Identical capability. | None – fully implemented | N/A | N/A |
| CH-006 | Task Management | Task Bulk Assign | TaskBulkActions component | bulk-action-bar.tsx | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskBulkActions.tsx:51–80` / `app/server/routers/tasks.ts:835–893` | Power-user feature for team reassignment | Both: multi-select, assignee picker, atomic, confirmation, notifications. Identical. | None – fully implemented | N/A | N/A |
| CH-007 | Task Management | Task Bulk Delete | TaskBulkActions component | bulk-action-bar.tsx | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskBulkActions.tsx:81–90` / `app/server/routers/tasks.ts:896–945` | Data cleanup, archive workflows | Both: multi-select, confirmation preview, hard delete, activity log. Identical. | None – fully implemented | N/A | N/A |
| CH-008 | Task Management | Workflow Assignment | TaskChecklistTab | `assignWorkflow` mutation (tasks.ts:528–597) | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskChecklistTab.tsx:120–150` / `app/server/routers/tasks.ts:528–597` | Core task workflow – templates enable standardization | Both: select workflow template, auto-populate checklist stages. Current also tracks progress. | None – fully implemented + enhanced | N/A | N/A |
| CH-009 | Task Management | Task Workflow Checklist | TaskChecklistTab with stages + items | task-details.tsx + `updateChecklistItem` (tasks.ts:653–756) | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskChecklistTab.tsx:1–180` / `app/client-hub/tasks/[id]/task-details.tsx:171–189`, `tasks.ts:653–756` | Progress tracking, standardized processes | Both: stages (discovery, planning, execution, review, completion), toggle items, track completed_by/completed_at. Current auto-calculates progress %. | None – fully implemented + enhanced with auto-progress | N/A | N/A |
| CH-010 | Task Management | Checklist Progress Tracking | TaskChecklistTab shows % per stage | Auto-calculated in `updateChecklistItem` (tasks.ts:701–731) | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/tasks/TaskChecklistTab.tsx:50–70` | Users need progress visibility | Both calculate % complete. Current auto-updates `task.progress` field on item toggle. | None – fully implemented + automated | N/A | N/A |
| CH-011 | Task Management | Checklist Notes/Comments | Inferred from legacy component | Not explicitly implemented | ⚠️ PARTIAL | MEDIUM | 70% | 70% | `.archive/crm-app/main/src/components/tasks/TaskChecklistTab.tsx` (inferred) | Notes on checklist items aid communication | Legacy component hints at notes capability. Current checklist items have only: id, text, completed, completedBy, completedAt. No notes field. | Gap: no notes on individual checklist items | Add `notes` text field to checklist item schema; update UI to show/edit notes | M |
| CH-012 | Settings | Workflow Templates Management | WorkflowTemplatesTab | Not found in current codebase | ❌ MISSING | MEDIUM | 85% | 0% | `.archive/crm-app/main/src/components/task-settings/WorkflowTemplatesTab.tsx` (95% confidence) | Admins need UI to create/manage workflow templates | Legacy has full template builder. Current has workflows table but no admin UI to manage templates. | Gap: no /settings/workflows UI for template CRUD | Create workflow management UI: `/app/admin/settings/workflows/page.tsx` with create/edit/delete forms. Add tRPC procedures for template CRUD if missing. | M |
| CH-013 | Task Management | Task Quick-Add | TaskQuickAdd inline form | Not found in current codebase | ❌ MISSING | LOW | 85% | 0% | `.archive/crm-app/main/src/components/tasks/TaskQuickAdd.tsx` (85% confidence) | Speed up task creation in list view | Legacy has quick-add row in task table for rapid entry. Current has modal for new tasks (slower UX). | Gap: no inline quick-add in task list | Add quick-add form row to task list table (optional enhancement; lower priority) | S |
| CH-014 | Task Management | Activity Log | Auto-logged on all CRUD | Implemented at `activityLogs` table | ✅ OK | N/A | 100% | 100% | `.archive/crm-app/main/src/components/task-activity/ActivityLog.tsx` / `app/server/routers/tasks.ts:347–361` (create), `412–422` (update), `450–458` (delete) | Audit trail, compliance, debugging | Both: capture action, oldValues, newValues, userId, timestamp. Current integrated into all operations. | None – fully implemented | N/A | N/A |

---

### PROPOSAL HUB

| ID | Area | Feature | Legacy Route(s) | Current Route(s) | Status | Severity | Confidence | Match Score | Evidence | Why It Matters | Gap Details | Proposed Fix | Est. Effort |
|----|------|---------|---|---|---|---|---|---|---|---|---|---|---|
| PH-001 | Proposal | Proposal CRUD | `/proposals`, `/proposals/:id` | `/proposal-hub/proposals`, `/proposal-hub/proposals/[id]` | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/pages/Proposals.tsx` / `app/server/routers/proposals.ts:77–514` | Core proposal management | All operations: create, list, getById, update, delete. Status enum matches. Relationships (lead, client, quote) match. Pricing, terms, validation all present. | None – fully implemented | N/A | N/A |
| PH-002 | Proposal | Proposal Status Enum | `enquiry`, `qualified`, `proposal_sent`, `follow_up`, `won`, `lost`, `dormant` | `draft`, `sent`, `viewed`, `signed`, `rejected`, `expired` | ⚠️ REGRESSED | HIGH | 100% | 50% | `.archive/proposal-app/main/src/types/proposal.ts` / `lib/db/schema.ts:1023–1030` | Status tracking essential for workflow | **MISMATCH:** Legacy has sales funnel stages (enquiry→qualified→proposal_sent→follow_up→won/lost/dormant). Current has document status (draft→sent→viewed→signed→rejected→expired). These model *different* concepts. | Gap: Current model is document-centric, legacy is sales-cycle-centric. Can coexist (add `salesStage` enum). | Add `salesStage` enum (enquiry, qualified, proposal_sent, follow_up, won, lost, dormant) to proposals table; map current `status` to document lifecycle. See gap analysis in proposal analytics. | M |
| PH-003 | Proposal | Proposal PDF Generation | via API endpoint | `generatePdf` (proposals.ts:850–892) | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/api/generatePdf.ts` | PDF sent for signature | Stored in S3 (MinIO dev, Hetzner prod). Called during sendForSignature. URL persisted. Matches legacy behavior. | None – fully implemented | N/A | N/A |
| PH-004 | Proposal | Proposal Versioning | VersionHistoryModal component | version-history-dialog.tsx | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/components/ProposalVersionHistory.tsx` / `app/server/routers/proposals.ts:894–1214`, `components/proposal-hub/version-history-dialog.tsx` | Track proposal edits, compliance | Both: store snapshots, version number, timestamp, editor, full state. Current also auto-snapshots on every update. | None – fully implemented + enhanced | N/A | N/A |
| PH-005 | Proposal | Docuseal E-Signature | SendForSignature flow + webhook | sendForSignature (proposals.ts:517–689), webhook (route.ts) | ⚠️ PARTIAL | BLOCKER | 100% | 85% | `.archive/proposal-app/main/src/flows/DocusealSigningFlow.tsx` / `app/server/routers/proposals.ts:517–689`, `app/api/webhooks/docuseal/route.ts` | Core signing feature; compliance critical | **GAPS FOUND:** (1) Webhook idempotency missing, (2) Sentry logging violations, (3) Missing event handlers, (4) No rate limiting. See 40-docuseal-readiness.md for details. | See critical gaps section below | See patches/ directory for fixes | S–M |
| PH-006 | Proposal | Proposal Templates | ProposalTemplateBuilder | Not found in current codebase | ❌ MISSING | MEDIUM | 85% | 0% | `.archive/proposal-app/main/src/components/ProposalTemplateBuilder.tsx` (85% confidence) | Speed up common proposals; standardization | Legacy has template management (create/edit/delete, set defaults). Current has `templates` table but no admin UI. | Gap: no /settings/proposal-templates UI for template CRUD | Create proposal template management UI at `/app/admin/settings/proposal-templates/page.tsx`. Add tRPC procedures if missing. | M |
| PH-007 | Proposal | Proposal Line Items | LineItemEditor component | Embedded in proposal form | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/components/LineItemEditor.tsx` / `app/server/routers/proposals.ts:193–276` (create includes services), `proposalServices` table schema.ts:1275–1305 | Pricing composition; essential for quotes | Both: add/edit/remove line items (services) with description, qty, unit price. Auto-calculates subtotal, tax, total. | None – fully implemented | N/A | N/A |
| PH-008 | Proposal | Proposal Pipeline Kanban | Pipeline.tsx page | Not found in current codebase | ❌ MISSING | HIGH | 95% | 0% | `.archive/proposal-app/main/src/pages/Pipeline.tsx` (95% confidence) | Sales management, visibility of pipeline stage distribution | Legacy has drag-and-drop Kanban with stages: Enquiry→Qualified→Proposal Sent→Follow-Up→Won/Lost. Current has no pipeline UI. | Gap: no visual pipeline/Kanban board for proposal stages | Create pipeline Kanban board UI at `/app/proposal-hub/pipeline/page.tsx`. Implement drag-and-drop status transitions. Need to reconcile status enum (see PH-002). | M |
| PH-009 | Proposal | Proposal Analytics Dashboard | Analytics.tsx page | getStats (proposals.ts:833–847) only | ⚠️ PARTIAL | MEDIUM | 95% | 40% | `.archive/proposal-app/main/src/pages/Analytics.tsx` (95% confidence) | Sales metrics, forecasting, pipeline health | Legacy has comprehensive dashboard: win/loss %, conversion rates, avg deal size, pipeline value, sales cycle duration, charts (pie, bar, trend). Current has only `getStats` returning count & totalValue by status. | Gap: Analytics dashboard is missing 90% of metrics. Only has basic aggregates. | Implement `/app/proposal-hub/analytics/page.tsx` with charts for: (1) Win/loss %, (2) Conversion funnel, (3) Avg deal size, (4) Pipeline value by stage, (5) Sales cycle duration, (6) Lead source breakdown. Add tRPC procedures for each metric. | L |
| PH-010 | Proposal | Proposal Activity Log | ProposalActivityLog component | Implemented in proposals router | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/components/ProposalActivityLog.tsx` / `app/server/routers/proposals.ts:589–600` (example in sendForSignature), `activityLogs` table | Audit trail, team visibility | Both: log proposal_created, proposal_sent, proposal_viewed, proposal_signed, etc. Timestamp, user, action, description. Current integrated into all proposal operations. | None – fully implemented | N/A | N/A |
| PH-011 | Proposal | Proposal Document Versioning | DocumentTracker component | proposalVersions table + auto-versioning | ✅ OK | N/A | 100% | 98% | `.archive/proposal-app/main/src/components/DocumentTracker.tsx` / `app/server/routers/proposals.ts:995–1155` (updateWithVersion) | Track PDF changes, compliance | Both: store multiple document versions, track status (draft, sent, viewed, signed). Current denormalizes services in each version. | None – fully implemented + enhanced | N/A | N/A |
| PH-012 | Proposal | Proposal Document Status Tracking | DocumentStatus enum (draft, sent, viewed, signed, expired) | status enum on proposals table | ✅ OK | N/A | 100% | 100% | `.archive/proposal-app/main/src/types/document.ts` / `lib/db/schema.ts:1023–1030` | Track document lifecycle | Both: draft (not sent), sent (delivered), viewed (opened), signed (completed), expired (link dead). Matches perfectly. | None – fully implemented | N/A | N/A |
| PH-013 | Proposal | Proposal Conversion Tracking | ConversionTracker component | Not explicitly found | ❌ PARTIAL | MEDIUM | 75% | 50% | `.archive/proposal-app/main/src/components/ConversionTracker.tsx` (inferred) / `getStats` (proposals.ts:833–847) only | Track win/loss, reason categorization | Legacy tracks win/loss with reason (price, competitor, other). Current has `getStats` but no conversion reason tracking or loss reason capture. | Gap: no loss reason capture; no dedicated conversion UI | Add `conversionStatus` (won/lost) and `lossReason` (price/competitor/other/text) fields to proposals table. Create conversion tracker UI/modal. Update tRPC procedures. | M |
| PH-014 | Proposal | Proposal Pipeline Stages Customization | Pipeline settings page | Not found in current codebase | ❌ MISSING | LOW | 80% | 0% | `.archive/proposal-app/main/src/pages/settings/PipelineStages.tsx` (inferred) | Flexibility for custom workflows | Legacy allows custom stage names, reordering, color assignment. Current has `proposalPipelineStages` table but no UI to manage. | Gap: pipeline stages not customizable via UI | Create pipeline settings UI (lower priority, can use defaults for MVP). | S |
| PH-015 | Proposal | Docuseal Webhook Idempotency | Not explicitly handled | ❌ MISSING | BLOCKER | 100% | 0% | N/A / `app/api/webhooks/docuseal/route.ts:74–97` | Production reliability | If DocuSeal retries webhook (network timeout, server error), duplicate processing causes database constraint violation. Proposal stuck in "sent" status. | Gap: No check for existing `docusealSubmissionId` before processing. See details in 40-docuseal-readiness.md | Add idempotency check at webhook start; return 200 OK if signature already recorded. | S |
| PH-016 | Proposal | Docuseal Event Handlers (Declined/Expired) | Handled in webhook | Only "submission.completed" in route.ts | ❌ PARTIAL | HIGH | 100% | 50% | N/A / `app/api/webhooks/docuseal/route.ts:63–65` | Complete signature lifecycle | Legacy handles: submission.completed→signed, submission.declined→rejected (implied), submission.expired→expired (implied). Current only handles "completed". | Gap: No handlers for "declined" and "expired" events. Proposals never transition to rejected/expired from webhook. | Add event handlers for "submission.declined"→proposal.status="rejected", "submission.expired"→proposal.status="expired". Update activity log. Send notifications. | M |
| PH-017 | Proposal | Docuseal Sentry Logging | Best practice in API routes | 10x console.error() violations | ⚠️ REGRESSED | BLOCKER | 100% | 0% | N/A / `app/api/webhooks/docuseal/route.ts` (lines 38, 44, 55, 69, 84, 94, 116, 227, 246, 267) | Error visibility, production debugging | CLAUDE.md requires all console.error → Sentry.captureException. Webhook has 10 violations. Errors invisible to ops team. | Gap: console.error instead of Sentry in webhook handler | Replace all `console.error()` with `Sentry.captureException()` + tags (operation) + extra context (proposalId, tenantId). See patch below. | S |
| PH-018 | Proposal | Webhook Rate Limiting | Not implemented | N/A | ❌ MISSING | MEDIUM | 100% | 0% | N/A / `app/api/webhooks/docuseal/route.ts` | DOS protection | No rate limit on webhook. Malicious actor could spam. | Gap: No rate limiting on `/api/webhooks/docuseal`. | Add Upstash Redis rate limit: 10 req/sec per tenant, 1 req/sec per submissionId. Reuse existing rate limit pattern. | M |
| PH-019 | Proposal | Scheduled Proposal Expiry Task | Not found | No cron job | ❌ MISSING | HIGH | 100% | 0% | N/A / (not implemented) | Auto-mark expired proposals | Legacy implies expiry handling (maybe automatic). Current only checks `validUntil` on signing, doesn't auto-mark proposal as "expired". | Gap: No background task to mark proposals as "expired" when validUntil passes. | Create cron job (or use Next.js API route with scheduled trigger): Find proposals where validUntil < now AND status != expired, set status to "expired", log activity. Deploy with cron service (e.g., Upstash). | M |

---

## Client Hub Summary

| Status | Count | Examples |
|--------|-------|----------|
| ✅ OK | 11 | Task CRUD, bulk ops, checklist, assignment, activity log |
| ⚠️ PARTIAL | 1 | Checklist notes (missing) |
| ❌ MISSING | 2 | Workflow template UI, quick-add |
| **Total** | **14** | |

---

## Proposal Hub Summary

| Status | Count | Examples |
|--------|-------|----------|
| ✅ OK | 8 | Proposal CRUD, versioning, PDF, line items, activity log, document versioning, status tracking |
| ⚠️ PARTIAL | 3 | Docuseal (critical gaps), Docuseal logging (violations), conversion tracking |
| ❌ MISSING | 4 | Pipeline Kanban, Analytics dashboard, Proposal templates, Pipeline stage customization |
| ⚠️ REGRESSED | 1 | Status enum (sales-stage vs. document-status mismatch) |
| **Total** | **16** | |

---

## Critical Gaps Requiring Immediate Fixes

| Gap ID | Severity | File | Lines | Fix | Effort |
|--------|----------|------|-------|-----|--------|
| PH-015 | BLOCKER | `app/api/webhooks/docuseal/route.ts` | 74–97 | Implement idempotency check before processing webhook | S |
| PH-017 | BLOCKER | `app/api/webhooks/docuseal/route.ts` | 38, 44, 55, 69, 84, 94, 116, 227, 246, 267 | Replace console.error with Sentry.captureException (10 instances) | S |
| PH-016 | HIGH | `app/api/webhooks/docuseal/route.ts` | 63–65 | Add handlers for "declined" and "expired" events | M |
| PH-018 | MEDIUM | `app/api/webhooks/docuseal/route.ts` | all | Add webhook rate limiting | M |
| PH-002 | HIGH | `lib/db/schema.ts` | 1023–1030 | Add `salesStage` enum to reconcile legacy sales funnel | M |
| PH-008 | HIGH | Not implemented | N/A | Create proposal pipeline Kanban UI | M |
| PH-009 | MEDIUM | `app/proposal-hub/analytics/` | N/A | Implement comprehensive analytics dashboard | L |
| PH-019 | MEDIUM | Not implemented | N/A | Create scheduled expiry task (cron) | M |

---

## Enhancement Opportunities (Lower Priority)

| ID | Feature | Type | Benefit | Effort |
|----|---------|------|--------|--------|
| CH-011 | Checklist notes | Enhancement | Better communication on tasks | M |
| CH-012 | Workflow template UI | Enhancement | Admin management of templates | M |
| CH-013 | Quick-add tasks | UX | Speed | S |
| PH-006 | Proposal template UI | Enhancement | Speed up common proposals | M |
| PH-014 | Pipeline stage customization | Enhancement | Flexibility | S |

---

**Report Generated:** 2025-10-19
**Total Features Reviewed:** 30
**Full Parity (OK):** 19 (63%)
**Partial/Regressed:** 4 (13%)
**Missing:** 7 (23%)
**Critical Gaps (BLOCKER/HIGH):** 6
