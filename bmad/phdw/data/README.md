# PH Dev Suite - Workflow State Management

This directory contains workflow state tracking files for active and completed feature quests.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Directory Structure

```
data/
├── workflow-state-{feature-id}.json    # Active feature workflows
├── archived/                           # Completed/replaced workflows
│   └── workflow-state-{feature-id}-{timestamp}.json
├── workflow-state-schema.yaml          # State structure definition
└── README.md                           # This file
```

## Workflow State Files

### Active Workflows

**Format:** `workflow-state-{feature-id}.json`

**Example:** `workflow-state-invoice-approval.json`

**Contains:**
- Feature metadata (id, name, branch)
- Current phase (planning, implementation, etc.)
- Current epic and story
- Quality gate statuses
- Epic/story structures with dependencies
- Pantheon activity tracking
- Blocked stories (due to pivots)
- Metrics (QA cycles, coverage, commits)

### Archived Workflows

**Location:** `archived/`

**When Archived:**
- Feature completes and merges to main
- User starts fresh quest with same feature ID
- Manual cleanup of old workflows

**Format:** `workflow-state-{feature-id}-{timestamp}.json`

## Auto-Save Checkpoints

Zeus automatically saves workflow state after:

1. **CHECKPOINT 1:** Athena completes requirements & audit
2. **CHECKPOINT 2:** Hermes completes documentation cascade (Brief → PRD → TDD)
3. **CHECKPOINT 3:** Prometheus completes epic & story planning
4. **CHECKPOINT:** After each story completion (Hephaestus → Apollo → Themis cycle)
5. **CHECKPOINT:** After each epic completion
6. **CHECKPOINT:** After feature merge to Olympus

## Resume Functionality

### Commands:

```bash
# Pause current quest
*pause-quest

# List all active quests
*list-active-quests

# Resume specific quest
*resume-quest invoice-approval
```

### Resume Logic:

When resuming, Zeus:
1. Loads workflow state file
2. Displays current position
3. Jumps to appropriate workflow step based on phase:
   - `planning` → Step 2 (Athena)
   - `documentation` → Step 3 (Hermes)
   - `epic-planning` → Step 4 (Prometheus)
   - `implementation` → Step 5 (Story loop)
   - `complete` → Step 7 (Summary)

### State Recovery After Crash:

If workflow crashes unexpectedly:
1. Summon Zeus: `@bmad/phdw/agents/zeus`
2. Zeus detects existing state file
3. Zeus asks: "Resume existing quest or start fresh?"
4. Choose resume
5. Workflow continues from last checkpoint

## Story Status Tracking

### Story Statuses:

- `pending` - Not started yet
- `in_progress` - Currently implementing
- `qa_failed` - Apollo found issues
- `qa_passed` - Apollo approved
- `done` - Complete (QA passed + docs synced)
- `ended_pivot` - Closed due to pivot
- `paused_dependency_pivot` - Blocked by pivoted dependency
- `revised_post_pivot` - Revised after dependency pivot

### Dependency Management:

- Dependencies tracked per story
- Before starting story, Zeus validates all dependencies = 'done'
- If dependency = 'ended_pivot', manual review required
- User can proceed/revise/pause dependent stories

## Pantheon Activity Tracking

State file tracks each god's contributions:

```yaml
pantheon_activity:
  athena:
    brainstorming_complete: boolean
    app_audit_complete: boolean
  hermes:
    brief_created: boolean
    prd_created: boolean
    tdd_created: boolean
  prometheus:
    epics_planned: boolean
    stories_created: boolean
  hephaestus:
    stories_forged: number
  apollo:
    qa_validations: number
    qa_passes: number
    qa_fails: number
  themis:
    doc_sync_operations: number
    drift_items_fixed: number
```

Used for:
- Quest completion summary
- Metrics and analytics
- Resume context (which gods have finished their work)

## Blocked Stories

When pivots affect dependencies:
- Dependent stories flagged with `needs_review`
- Added to `blocked_stories[]` array if paused
- Removed from array when reviewed and resumed
- Zeus skips blocked stories, continues with eligible ones

## Metrics Tracking

Workflow state includes metrics for analytics:

- `total_epics`: Number of epics
- `total_stories`: Number of stories
- `total_qa_cycles`: How many QA iterations
- `average_coverage`: Average test coverage across stories
- `git_commits`: Total commits made
- `time_saved_from_parallelization`: Estimated time savings %
- `pivot_count`: How many pivots occurred
- `dependency_blocks`: How many dependency-related pauses

## Best Practices

### Save State Frequency:

✅ **DO:** Save after completing major milestones
✅ **DO:** Save after each story completes
✅ **DO:** Save after validation gates

❌ **DON'T:** Save mid-implementation (too granular)
❌ **DON'T:** Save during user input (wait for action)

### Cleanup:

**Manual Cleanup:**
```bash
# Archive old completed workflows
mv bmad/phdw/data/workflow-state-old-feature.json \
   bmad/phdw/data/archived/workflow-state-old-feature-20251103.json
```

**Future:** Auto-archival after feature merge (Phase 3)

---

_Workflow state management for PH Dev Suite_

