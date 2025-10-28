# My Tasks Filter Implementation Fix

**Status:** GAP CONFIRMED
**Severity:** HIGH
**Impact:** Users assigned as preparers or reviewers cannot filter to "My Tasks"

---

## Problem Description

The "My Tasks" filter implementation is incomplete. It only checks the `assignedToId` field but ignores tasks where the user is assigned as a preparer (`preparerId`) or reviewer (`reviewerId`).

### Evidence

**Current Implementation (INCOMPLETE):**
- File: `/root/projects/practice-hub/lib/db/queries/task-queries.ts:44-46`
- Current logic: Only filters by `assignedToId`
  ```typescript
  // Assignee filter (LINE 44-46)
  if (filters.assigneeId) {
    conditions.push(eq(taskDetailsView.assignedToId, filters.assigneeId));
  }
  ```

**Legacy Behavior (CORRECT):**
- File: `.archive/crm-app/src/hooks/useTasks.ts:76-79`
- Legacy logic: OR across three fields
  ```typescript
  .or(`preparer_id.eq.${userId},reviewer_id.eq.${userId},assigned_to.eq.${userId}`)
  ```

**Schema Analysis:**
- `tasks` table has THREE assignment fields:
  - `assignedToId` (line: schema.ts - for primary assignee)
  - `preparerId` (line: schema.ts - for preparer/assistant)
  - `reviewerId` (line: schema.ts - for reviewer)

- `taskDetailsView` is MISSING `preparerId`:
  - File: `/root/projects/practice-hub/lib/db/schema.ts:2788-2826`
  - Has: `assignedToId`, `reviewerId`
  - Missing: `preparerId` (BLOCKING ISSUE)

---

## Current vs Expected Behavior

### Current Behavior
```
User clicks "My Tasks" filter
→ Shows only tasks where user is assignedToId
❌ MISSING: Tasks where user is preparerId
❌ MISSING: Some tasks where user is reviewerId (unless already mapped in view)
```

### Expected Behavior
```
User clicks "My Tasks" filter
→ Shows tasks where user is:
   ✅ assignedToId (primary assignee)
   ✅ preparerId (preparer/assistant)
   ✅ reviewerId (reviewer)
```

---

## Code Change Proposal

### Step 1: Add `preparerId` to `taskDetailsView`

**File:** `/root/projects/practice-hub/lib/db/schema.ts` (around line 2788-2826)

**Change:** Add `preparerId` field to the view definition

```typescript
export const taskDetailsView = pgView("task_details_view", {
  // ... existing fields ...
  assignedToId: text("assigned_to_id"),
  preparerId: text("preparer_id"),              // ← ADD THIS LINE
  reviewerId: text("reviewer_id"),
  // ... rest of fields ...
}).existing();
```

### Step 2: Update Filter Logic to OR Across All Three Fields

**File:** `/root/projects/practice-hub/lib/db/queries/task-queries.ts` (lines 43-46)

**Before:**
```typescript
  // Assignee filter
  if (filters.assigneeId) {
    conditions.push(eq(taskDetailsView.assignedToId, filters.assigneeId));
  }
```

**After:**
```typescript
  // Assignee filter - check all three assignment fields with OR logic
  if (filters.assigneeId) {
    conditions.push(
      or(
        eq(taskDetailsView.assignedToId, filters.assigneeId),
        eq(taskDetailsView.preparerId, filters.assigneeId),
        eq(taskDetailsView.reviewerId, filters.assigneeId),
      ),
    );
  }
```

### Step 3: Database Reset

After both changes, reset the database:

```bash
pnpm db:reset
```

This command will:
1. Drop and recreate schema
2. Push schema updates
3. Run migrations (including SQL view recreation)
4. Seed database

---

## Test Cases

### Test Case 1: User as Assigned To
**Setup:** User A is assigned as `assignedToId` for Task X
**Expected:** Task X appears in User A's "My Tasks" filter
**Acceptance:** ✓ Pass

### Test Case 2: User as Preparer
**Setup:** User B is assigned as `preparerId` for Task Y
**Expected:** Task Y appears in User B's "My Tasks" filter
**Acceptance:** ✓ Pass (currently fails)

### Test Case 3: User as Reviewer
**Setup:** User C is assigned as `reviewerId` for Task Z
**Expected:** Task Z appears in User C's "My Tasks" filter
**Acceptance:** ✓ Pass (currently fails)

### Test Case 4: Multiple Roles
**Setup:** User D is assigned to Task M as both `assignedToId` and `reviewerId`
**Expected:** Task M appears exactly once in User D's "My Tasks" filter (not duplicated)
**Acceptance:** ✓ Pass (OR logic prevents duplicates)

### Test Case 5: No False Positives
**Setup:** User E is not assigned to Task N in any role
**Expected:** Task N does NOT appear in User E's "My Tasks" filter
**Acceptance:** ✓ Pass

---

## Acceptance Criteria

- [ ] `preparerId` field added to `taskDetailsView` in schema.ts
- [ ] Filter logic updated to use `or()` across all three assignment fields
- [ ] Database reset executed successfully
- [ ] All test cases pass
- [ ] No duplicate tasks shown when user has multiple roles
- [ ] SQL view properly includes `preparerId` column (verify post-reset)

---

## Verification Checklist

Before deployment:
1. Run filter tests with users in each role
2. Check database for duplicate rows (should be none)
3. Verify view includes `preparerId` column:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'task_details_view'
   ORDER BY column_name;
   ```
4. Manual smoke test: Create test task with different assignment roles
5. Check query performance (indices on all three fields exist in schema)

---

## Migration/Rollback Notes

**Forward Migration:**
- Requires database reset (via `pnpm db:reset`)
- Non-destructive: Only adds view column, no data changes
- No user downtime required

**Rollback Plan:**
- Revert code changes to tasks.ts and schema.ts
- Run `pnpm db:reset` to restore previous view definition
- Verify "My Tasks" filter shows only `assignedToId` results

---

## Related Files

- `/root/projects/practice-hub/app/server/routers/tasks.ts` - Uses getTasksList
- `/root/projects/practice-hub/lib/db/queries/task-queries.ts` - Filter implementation
- `/root/projects/practice-hub/lib/db/schema.ts` - Schema definition (tasks table, taskDetailsView)
- `.archive/crm-app/src/hooks/useTasks.ts` - Legacy implementation reference
