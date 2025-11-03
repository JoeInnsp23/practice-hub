# PH Dev Suite 🏛️⚡

**Practice Hub Development Workflow Module**

A practice-hub-specific development workflow module that replaces generic BMAD BMM with a validated, quality-gated process optimized for Next.js 15, Drizzle, Better Auth, and multi-tenant architecture.

---

## Overview

The Greek pantheon enforces divine quality in every feature:

- **Zeus** ⚡ - Workflow Orchestrator, commands the quest
- **Athena** 🦉 - Requirements Analyst, wisdom and strategy
- **Hermes** 📜 - Documentation Architect, crafts artifacts
- **Prometheus** 🔥 - Epic Planner, foresees parallelization
- **Hephaestus** 🔨 - Dev Agent, forges with precision
- **Apollo** ☀️ - QA Agent, tests with divine light
- **Themis** ⚖️ - Documentation Guardian, maintains order

---

## Key Features

✅ **90% Test Coverage** - Mandatory, enforced by Hephaestus & Apollo  
✅ **Cursor Browser Tools** - Paramount front-end validation  
✅ **User Acceptance Testing** - Apollo starts pnpm dev, navigates with browser tools, hands off to user (NEW!)  
✅ **Multi-Tenant Security** - Validated on every QA pass  
✅ **Documentation Drift Detection** - Auto-fix by Themis  
✅ **Epic Parallelization** - Smart numbering (1.1, 1.2 parallel vs 1.0, 2.0 sequential)  
✅ **Epic Sub-Branches** - Parallel epics isolated on separate branches (NEW!)  
✅ **Pause/Resume** - Save workflow state, resume after interruptions (NEW!)  
✅ **Dependency Blocking** - Automatic detection when dependency pivots (NEW!)  
✅ **Workflow Locks** - Quality gates cannot be bypassed  
✅ **Git-First Workflow** - Commits at every checkpoint  

---

## Installation

```bash
# Module will be installed via BMAD installer
# During installation, you'll configure:
# - Output paths for artifacts and QA reports
# - Quality gate enforcement level
# - Front-end testing tool preference
# - Epic parallelization settings
```

---

## Quick Start

### Start a New Feature Quest

```
# Summon Zeus to begin
agent Zeus

Zeus > *embark-on-quest

# Zeus will orchestrate the entire workflow:
# 1. Athena analyzes requirements
# 2. Hermes crafts Brief → PRD → TDD
# 3. Prometheus plans epics with parallelization
# 4. For each story:
#    - Hephaestus forges implementation
#    - Apollo validates with QA
#    - Themis syncs documentation
# 5. Merge to Olympus (main branch)
```

### Check Workflow Status

```
Zeus > *divine-status

# Shows:
# - Current feature and branch
# - Active epic and story
# - Quality gate states
# - Gods currently working
```

### Summon Individual Gods

```
Zeus > *summon Athena
# Athena analyzes the quest

Zeus > *summon Hephaestus
# Hephaestus forges a story

Zeus > *summon Apollo
# Apollo tests with light
```

---

## Module Structure

```
phdw/
├── agents/                           # The 7 Greek god agents
│   ├── zeus.md                      # ⚡ Workflow Orchestrator
│   ├── athena.md                    # 🦉 Requirements Analyst
│   ├── hermes.md                    # 📜 Documentation Architect
│   ├── prometheus.md                # 🔥 Epic Planner
│   ├── hephaestus.md                # 🔨 Practice Hub Dev Agent
│   ├── apollo.md                    # ☀️ Practice Hub QA Agent
│   └── themis.md                    # ⚖️ Documentation Guardian
│
├── workflows/                        # 14 specialized workflows
│   ├── phdw-master/                 # Main orchestrator (Zeus)
│   ├── feature-brainstorm/          # Brainstorming (Athena)
│   ├── app-audit/                   # Codebase audit (Athena)
│   ├── create-feature-brief/        # Brief creation (Zeus/Hermes)
│   ├── brief-to-prd/                # PRD generation (Hermes)
│   ├── prd-to-tdd/                  # TDD planning (Hermes)
│   ├── tdd-to-epics/                # Epic planning (Prometheus)
│   ├── epics-to-stories/            # Story creation (Prometheus)
│   ├── pre-story-quality-gate/      # Pre-implementation checks (Hephaestus)
│   ├── dev-story/                   # Implementation (Hephaestus)
│   ├── qa-story/                    # QA validation (Apollo)
│   ├── doc-sync/                    # Documentation sync (Themis)
│   ├── pivot-mini-workflow/         # Pivot handling (Zeus)
│   └── feature-complete/            # Final merge (Zeus)
│
├── _module-installer/
│   ├── install-config.yaml          # Installation configuration (12 settings)
│   └── assets/                      # Installation assets
│
├── data/                            # Workflow state tracking
├── templates/                       # Future shared templates
├── tasks/                           # Future utility tasks
├── config.yaml                      # Module config (generated at install)
└── README.md                        # This file
```

---

## Development Phases

### Phase 1: MVP ✅ COMPLETE
- ✅ 3 core agents (Zeus, Hephaestus, Apollo)
- ✅ 6 essential workflows
- ✅ Basic quality gates
- ✅ Cursor browser tools integration

### Phase 2: Enhancement ✅ COMPLETE
- ✅ 4 additional agents (Athena, Hermes, Prometheus, Themis)
- ✅ 8 additional workflows
- ✅ Epic parallelization with file-touch analysis
- ✅ Documentation drift detection and auto-sync
- ✅ Complete documentation cascade (Brief → PRD → TDD → Epics → Stories)
- ✅ Pivot mini-workflow for major changes

### Phase 3: Polish (Future - After 10+ features)
- ⏳ AI-powered parallelization optimizer
- ⏳ Self-improving QA with knowledge base
- ⏳ Real-time documentation sync (currently post-QA)
- ⏳ Emergency hotfix workflows

---

## Quality Standards

**Code Quality:**
- 90% minimum Vitest test coverage
- Zero lint errors (`pnpm lint` passes)
- Zero format issues (`pnpm format` passes)
- Zero type errors (`pnpm typecheck` passes)

**Security:**
- Multi-tenant isolation validated on every QA pass
- Staff/client access separation verified
- Dependency vulnerabilities scanned

**Performance:**
- Loading times validated (no regressions)
- Query efficiency checked (N+1 detection)

**Documentation:**
- Schema changes reflected in DB docs
- Route changes reflected in API docs
- Integration changes reflected in integration docs

---

## Workflow Locks (Divine Law)

Zeus enforces these gates - **even he cannot override them:**

- ✋ Cannot proceed to PRD until Brief validated
- ✋ Cannot proceed to TDD until PRD validated
- ✋ Cannot proceed to Epics until TDD validated
- ✋ Cannot start story until pre-quest validation passes
- ✋ Cannot proceed to next story until QA gate = PASS
- ✋ Cannot merge to main until all epics DONE

---

## Module Commands

### Zeus (Workflow Orchestrator)
- `*embark-on-quest` - Start new feature workflow
- `*divine-status` - View workflow state
- `*summon [god]` - Invoke specific agent
- `*lock-gates` / `*unlock-gates` - Manual gate control
- `*pivot-quest` - Handle major pivot

### Hephaestus (Dev Agent)
- `*forge-story` - Implement story
- `*craft-tests` - Write comprehensive tests
- `*update-schema` - Modify database schema
- `*pre-quest-validation` - Run quality gates

### Apollo (QA Agent)
- `*test-with-light` - Run comprehensive QA
- `*validate-security` - Multi-tenant security audit
- `*check-performance` - Performance validation
- `*generate-qa-report` - Create detailed findings

---

## Greek God Lore

**The Story of PH Dev Suite:**

Long ago, the practice-hub realm suffered from chaos. Features were forged without tests, security flaws slipped through, documentation drifted into discord. The mortal developers cried out for divine intervention.

Zeus assembled a pantheon of specialized deities to restore order. Together, they enforce divine law: Quality is non-negotiable, security is paramount, documentation must not drift, and git commits preserve all history.

The gods are humble - they know perfection is elusive, so they validate constantly and consult each other. When doubt arises, the workflow pauses for divine counsel.

---

## Configuration

Module configured via `bmad/phdw/config.yaml` (generated during installation).

Key settings:
- Feature artifact output path
- QA reports location
- Project status document path
- Quality gate enforcement level
- Front-end testing tool preference
- Epic parallelization settings
- Documentation drift detection sensitivity

---

## Support & Contribution

This module is maintained as part of the practice-hub project.

**Extending the Module:**
- Use `create-agent` workflow to add new gods
- Use `create-workflow` workflow to add new quests
- Follow Greek mythology theme for naming and personality

---

## Author

Created by Joe on 2025-11-03 using the BMAD Method.

Based on comprehensive brainstorming session and module brief:
- `docs/brainstorming-session-results-2025-11-03.md`
- `docs/module-brief-phdw-2025-11-03.md`

---

**Module Version:** 2.1.0  
**Module Phase:** Phase 2 + Critical Enhancements  
**Status:** ✅ Production Ready - Enhanced with UAT, Pause/Resume, Dependency Blocking

---

_"By decree of Zeus, quality shall not be compromised!"_ ⚡

