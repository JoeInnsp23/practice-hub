# PH Dev Suite - Git Branching Strategy 🌳

**Strategy:** Epic Sub-Branches for Parallel Isolation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Overview

PH Dev Suite uses a **three-tier branching strategy** to enable safe parallel epic execution:

```
main (production)
  ↑
  └─── feature/{feature-id} (feature branch)
        ↑              ↑              ↑
        │              │              │
    Sequential     Parallel       Parallel
    Epic 1.0       Epic 2.1       Epic 2.2
    (no sub)       (sub-branch)   (sub-branch)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Branching Rules

### **Rule 1: Sequential Epics (X.0) Use Feature Branch**

```
Epic 1.0, 2.0, 3.0 (sequential epics)
  → Stories commit directly to feature/{feature-id}
  → No epic sub-branch created
  → No merge needed (already on feature branch)
```

**Example:**
```bash
# Epic 1.0: Database Schema Changes
git checkout feature/invoice-approval
# Story 1.0.1 commits to feature/invoice-approval
# Story 1.0.2 commits to feature/invoice-approval
# Story 1.0.3 commits to feature/invoice-approval
# Epic 1.0 complete (no merge, already on branch)
```

---

### **Rule 2: Parallel Epics (X.Y) Get Sub-Branches**

```
Epic 1.1, 1.2, 1.3 (parallel epics)
  → Zeus creates epic/{epic-id} branch from feature branch
  → Stories commit to epic/{epic-id}
  → When epic complete: Merge epic/{epic-id} → feature/{feature-id}
  → Delete epic branch (optional)
```

**Example:**
```bash
# Epic 2.1: Backend API (parallel)
git checkout feature/invoice-approval
git checkout -b epic/2.1
# Story 2.1.1 commits to epic/2.1
# Story 2.1.2 commits to epic/2.1
# Story 2.1.3 commits to epic/2.1
# Epic 2.1 complete → Merge epic/2.1 → feature/invoice-approval

# Epic 2.2: Frontend UI (parallel with 2.1)
git checkout feature/invoice-approval
git checkout -b epic/2.2
# Story 2.2.1 commits to epic/2.2
# Story 2.2.2 commits to epic/2.2
# Epic 2.2 complete → Merge epic/2.2 → feature/invoice-approval
```

---

### **Rule 3: Feature Branch Merges to Main**

```
When all epics complete:
  → All epic sub-branches merged to feature branch
  → Sequential epic commits on feature branch
  → Merge feature/{feature-id} → main
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Complete Example

### Feature: Invoice Approval Workflow

**Epic Structure from Prometheus:**
```
Epic 1.0: Database Foundation (sequential)
Epic 2.1: Backend API (parallel)
Epic 2.2: Frontend UI (parallel with 2.1)
Epic 3.0: Integration & Polish (sequential)
```

**Branching Flow:**

```
# Zeus creates feature branch
git checkout main
git checkout -b feature/invoice-approval

# ─────────────────────────────────────────
# Epic 1.0: Database Foundation (sequential)
# ─────────────────────────────────────────
# Works directly on feature/invoice-approval

git checkout feature/invoice-approval
# Story 1.0.1: Create approval_status enum → commit
# Story 1.0.2: Add columns to invoices → commit
# Story 1.0.3: Update seeds → commit
# Epic 1.0 complete ✅

# ─────────────────────────────────────────
# Epic 2.1: Backend API (parallel)
# ─────────────────────────────────────────
# Zeus creates epic sub-branch

git checkout feature/invoice-approval
git checkout -b epic/2.1

# Story 2.1.1: Create validation schema → commit to epic/2.1
# Story 2.1.2: Create updateApprovalStatus → commit to epic/2.1
# Story 2.1.3: Create batchApproveInvoices → commit to epic/2.1
# Epic 2.1 complete

# Zeus merges epic to feature
git checkout feature/invoice-approval
git merge epic/2.1 --no-ff
git branch -d epic/2.1
# Epic 2.1 merged ✅

# ─────────────────────────────────────────
# Epic 2.2: Frontend UI (parallel with 2.1)
# ─────────────────────────────────────────
# Zeus creates epic sub-branch

git checkout feature/invoice-approval
git checkout -b epic/2.2

# Story 2.2.1: Create ApprovalBadge → commit to epic/2.2
# Story 2.2.2: Create ApprovalButton → commit to epic/2.2
# Story 2.2.3: Integrate with list → commit to epic/2.2
# Epic 2.2 complete

# Zeus merges epic to feature
git checkout feature/invoice-approval
git merge epic/2.2 --no-ff
git branch -d epic/2.2
# Epic 2.2 merged ✅

# ─────────────────────────────────────────
# Epic 3.0: Integration (sequential)
# ─────────────────────────────────────────
# Works directly on feature/invoice-approval

git checkout feature/invoice-approval
# Story 3.0.1: Integration tests → commit
# Story 3.0.2: Polish UI → commit
# Epic 3.0 complete ✅

# ─────────────────────────────────────────
# All Epics Complete
# ─────────────────────────────────────────
# Zeus merges to main

git checkout main
git merge feature/invoice-approval --no-ff
git branch -d feature/invoice-approval
# Feature complete! 🎉
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Why This Strategy Works

### **Parallel Epic Isolation** 🔒

```
Epic 2.1 (Backend):
  Branch: epic/2.1
  Files: app/server/routers/invoices.ts
  
Epic 2.2 (Frontend):
  Branch: epic/2.2
  Files: app/components/invoices/*.tsx

No file overlap (Prometheus verified!)
  → Both can work simultaneously
  → No merge conflicts
  → Safe to merge sequentially to feature branch
```

### **Clean Merges** ✅

```
feature/invoice-approval
  ├─ Epic 1.0 commits (sequential)
  ├─ Merge from epic/2.1 (1 merge commit)
  ├─ Merge from epic/2.2 (1 merge commit)
  └─ Epic 3.0 commits (sequential)

Each epic merge is a single commit in feature branch
Easy to see epic boundaries in git history
```

### **Rollback Capability** 🔄

```
If Epic 2.1 needs to be redone:
  → Delete epic/2.1 branch
  → Don't merge to feature branch
  → Recreate epic/2.1 with new approach
  → No impact on feature branch until merge
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Commit Message Patterns

### **Story Commits** (to epic branch or feature branch)

```bash
[PHDW] Hephaestus: Forge story 2.1.1 - Create approval validation schema

- Added approvalStatusEnum to validation
- Created Zod schema for approval input
- Added validation tests

Coverage: 94%
Tests: 8 tests passing
```

### **Epic Merge Commits** (epic → feature)

```bash
[PHDW] Zeus: Merge Epic 2.1 (Backend API) to feature branch

Epic 2.1 Complete:
- Story 2.1.1: Validation schema
- Story 2.1.2: updateApprovalStatus procedure
- Story 2.1.3: batchApproveInvoices procedure

Total: 3 stories, 12 tests, 94% average coverage
```

### **Feature Merge Commits** (feature → main)

```bash
[PHDW] Zeus: Merge Feature 'Invoice Approval' to Olympus (main)

Feature Complete:
- Epic 1.0: Database Foundation (3 stories)
- Epic 2.1: Backend API (3 stories)
- Epic 2.2: Frontend UI (3 stories)
- Epic 3.0: Integration (2 stories)

Total: 11 stories, 47 tests, 93% average coverage
QA Cycles: 14 (13 passes, 1 fail + fix)
Parallelization: 40% time savings (Epic 2.1 + 2.2)

Quality verified by Apollo ☀️
Documentation synchronized by Themis ⚖️

By decree of Zeus, quality was not compromised! ⚡
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Branch Lifecycle

### **Feature Branch:**
- Created: Zeus in Step 1 (`*embark-on-quest`)
- Lives: Entire feature duration
- Deleted: After merge to main (optional)

### **Epic Sub-Branches (Parallel Only):**
- Created: Zeus when starting parallel epic (X.Y)
- Lives: Epic duration only
- Merged: To feature branch when epic complete
- Deleted: After merge (optional, default yes)

### **Sequential Epics (X.0):**
- No sub-branch created
- Work directly on feature branch
- Simpler flow for non-parallel work

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## File-Touch Safety

**Prometheus ensures parallel epics don't conflict:**

```
Before marking epics as parallel (X.Y):
  → Analyze files Epic A will modify
  → Analyze files Epic B will modify
  → If overlap detected → Make sequential (X.0, Y.0)
  → If no overlap → Safe for parallel (X.1, X.2)

This guarantees:
  → Epic sub-branches can merge cleanly
  → No merge conflicts
  → Safe parallel execution
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Zeus's Branch Management

**Zeus handles all branching automatically:**

1. **Creates feature branch** - Step 1 (*embark-on-quest)
2. **Creates epic sub-branches** - Step 5 (when starting parallel epic)
3. **Switches to correct branch** - Before each story
4. **Merges epic to feature** - When epic completes
5. **Merges feature to main** - When all epics complete

**You don't manually manage branches** - Zeus does it all!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_Git branching strategy for PH Dev Suite_

