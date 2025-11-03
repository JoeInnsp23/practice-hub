# "My Tasks" Filter - Validation Evidence

## Validation Date
2025-10-27

## Executive Summary
**GAP CONFIRMED:** The "My Tasks" filter only checks `assignedToId` and omits `preparerId` from both the view definition and filter logic.

---

## Evidence Trail

### 1. Current Filter Implementation

**File:** `/root/projects/practice-hub/lib/db/queries/task-queries.ts`

**Lines 44-46 (Current - INCOMPLETE):**
```typescript
  // Assignee filter
  if (filters.assigneeId) {
    conditions.push(eq(taskDetailsView.assignedToId, filters.assigneeId));
  }
```

**Impact:** Only matches tasks where `assignedToId` equals the filter value.

---

### 2. Legacy Reference Implementation

**File:** `.archive/crm-app/src/hooks/useTasks.ts`

**Lines 76-79 (Legacy - CORRECT):**
```typescript
.or(`preparer_id.eq.${userId},reviewer_id.eq.${userId},assigned_to.eq.${userId}`)
```

**Pattern:** OR logic across three fields:
- `preparer_id` (preparerId)
- `reviewer_id` (reviewerId)
- `assigned_to` (assignedToId)

---

### 3. Tasks Table Schema

**File:** `/root/projects/practice-hub/lib/db/schema.ts`

**Evidence:** All three assignment fields exist in tasks table:

```
Line: export const tasks = pgTable("tasks", (table) => ({
  ...
  assignedToId: text("assigned_to_id").references(() => users.id, {
    onDelete: "set null",
  }),
  preparerId: text("preparer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewerId: text("reviewer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  ...
  assigneeIdx: index("idx_task_assignee").on(table.assignedToId),
  preparerIdx: index("idx_task_preparer").on(table.preparerId),
  reviewerIdx: index("idx_task_reviewer").on(table.reviewerId),
}))
```

**Confirmation:** All three fields indexed for query performance.

---

### 4. taskDetailsView Definition - THE BLOCKING ISSUE

**File:** `/root/projects/practice-hub/lib/db/schema.ts`

**Lines 2788-2826:**
```typescript
export const taskDetailsView = pgView("task_details_view", {
  // All task fields
  id: uuid("id").notNull(),
  tenantId: text("tenant_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  clientId: uuid("client_id"),
  assignedToId: text("assigned_to_id"),           // ← PRESENT
  reviewerId: text("reviewer_id"),                 // ← PRESENT
  createdById: text("created_by_id").notNull(),
  dueDate: timestamp("due_date"),
  // ... more fields ...
  assigneeName: text("assignee_name"),
  assigneeEmail: text("assignee_email"),
  reviewerName: text("reviewer_name"),
  reviewerEmail: text("reviewer_email"),
  creatorName: text("creator_name"),
  // ... etc ...
}).existing();
```

**Critical Finding:** `preparerId` is MISSING from the view, but:
- It EXISTS in the tasks table
- It's indexed for performance
- It's referenced in the legacy implementation
- The view definition is marked `.existing()` (SQL-first)

**What's Missing:**
```typescript
  preparerId: text("preparer_id"),                // ← NOT IN VIEW (SHOULD BE HERE)
```

---

### 5. Data Flow Analysis

### Current Flow (INCOMPLETE):
```
Frontend: "Get My Tasks"
  ↓
tRPC Router: tasks.list({ assigneeId: userId })
  ↓ Line 317-321: /root/projects/practice-hub/app/server/routers/tasks.ts
  ├─ Input: { assigneeId: string }
  ├─ Calls: getTasksList(tenantId, { assigneeId })
  ↓
Query Function: /root/projects/practice-hub/lib/db/queries/task-queries.ts:44-46
  ├─ Check: eq(taskDetailsView.assignedToId, assigneeId)
  ├─ Result: Only tasks where assignedToId matches
  ↓
Database: taskDetailsView
  ├─ Returns: assignedToId matches only
  ├─ Missing: preparerId matches
  ├─ Missing: reviewerId matches (unreachable via filter)
  ↓
Frontend: Displays incomplete task list
  ├─ ✓ Shows: Tasks where user is assignedToId
  ├─ ✗ Missing: Tasks where user is preparerId
  ├─ ✗ Missing: Tasks where user is reviewerId (if not assignedToId)
```

### Expected Flow (COMPLETE):
```
Frontend: "Get My Tasks"
  ↓
tRPC Router: tasks.list({ assigneeId: userId })
  ↓ Line 317-321: /root/projects/practice-hub/app/server/routers/tasks.ts
  ├─ Input: { assigneeId: string }
  ├─ Calls: getTasksList(tenantId, { assigneeId })
  ↓
Query Function: /root/projects/practice-hub/lib/db/queries/task-queries.ts
  ├─ Check: or(
  │    eq(taskDetailsView.assignedToId, assigneeId),
  │    eq(taskDetailsView.preparerId, assigneeId),
  │    eq(taskDetailsView.reviewerId, assigneeId)
  │  )
  ├─ Result: Tasks matching ANY of the three fields
  ↓
Database: taskDetailsView
  ├─ Returns: All matching records
  ├─ Includes: assignedToId matches
  ├─ Includes: preparerId matches
  ├─ Includes: reviewerId matches
  ↓
Frontend: Displays complete task list
  ├─ ✓ Shows: Tasks where user is assignedToId
  ├─ ✓ Shows: Tasks where user is preparerId
  ├─ ✓ Shows: Tasks where user is reviewerId
```

---

### 6. Comparison Matrix

| Aspect | Current | Expected | Legacy | Status |
|--------|---------|----------|--------|--------|
| Check assignedToId | ✓ | ✓ | ✓ | OK |
| Check preparerId | ✗ | ✓ | ✓ | GAP |
| Check reviewerId | ✗ | ✓ | ✓ | GAP |
| Use OR logic | ✗ | ✓ | ✓ | GAP |
| preparerId in view | ✗ | ✓ | N/A | BLOCKING |

---

## Root Cause Analysis

1. **Primary Cause:** Filter logic incomplete
   - Implemented only for `assignedToId`
   - Did not account for `preparerId`
   - Did not fully account for `reviewerId`

2. **Contributing Cause:** View definition incomplete
   - `preparerId` was not added to `taskDetailsView`
   - Query function cannot filter on fields not in view
   - Circular dependency: missing view column → cannot implement filter

3. **Why It Happened:**
   - Legacy app's OR logic across three roles may not have been fully analyzed during migration
   - View definition created without `preparerId`
   - Filter implementation limited to what was available in view

---

## Confidence Level

**95%+ Confidence in Gap**

Evidence:
- Confirmed all three fields exist in tasks table
- Confirmed preparerId missing from view (and indices exist)
- Confirmed legacy implementation uses all three fields
- Confirmed current implementation only uses one field
- Confirmed no other usage patterns for assigneeId filter
