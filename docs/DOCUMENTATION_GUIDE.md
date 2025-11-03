# Documentation Organization Guide for AI Agents

**Purpose:** Clear rules on where to save different types of documentation  
**Audience:** AI agents, developers creating documentation  
**Last Updated:** 2025-01-03  

---

## 🚨 CRITICAL RULES

1. **DO NOT create files in `docs/` root** unless it's a core system document
2. **DO NOT duplicate information** - check if documentation already exists
3. **DO NOT create stub files** - if you don't have content, don't create the file
4. **ALWAYS verify** against this guide before creating documentation

---

## 📁 Where to Save Different Document Types

### ✅ Core System Documentation (Root Level)

**Location:** `docs/` (root only)  
**Current Files:** 7 files (DO NOT EXCEED)

**What Goes Here:**
- `bmm-brownfield-architecture.md` - **THE master system reference** (DO NOT DUPLICATE)
- `README.md` - Main navigation (DO NOT CREATE ALTERNATIVES)
- `SITEMAP.md` - Documentation index
- `bmm-index.md` - BMad method entry point
- `coding-standards.md` - Development standards
- `known-issues.md` - Known issues and troubleshooting
- `realtime-architecture.md` - Special architecture (SSE)

**Rules:**
- ❌ **NEVER** create new architecture documents in root
- ❌ **NEVER** create alternative navigation files
- ✅ **UPDATE** existing files instead of creating new ones
- ✅ **ASK** before adding any new root-level file

---

### 📦 Phase/Project Reports (NOT IN ROOT!)

**Location:** `docs/90-completed/{phase-name}/`

**What Goes Here:**
- Phase completion reports
- Implementation summaries  
- Sprint retrospectives

**Directory Structure:**
```
docs/90-completed/
├─ phase-0/
│  ├─ PHASE_0_COMPLETE.md
│  └─ AUDIT_SUMMARY.md
├─ phase-1/
│  └─ EMPLOYEE_HUB_COMPLETE.md
├─ phase-2/
│  └─ UI_POLISH_COMPLETE.md
└─ sprint-X/
   └─ SPRINT_X_RETROSPECTIVE.md
```

**Rules:**
- ❌ **NEVER** put completion reports in docs/ root
- ❌ **NEVER** put in .archive/ (that's for old CRM app in project root!)
- ✅ **ALWAYS** save to `90-completed/{phase-name}/`
- ✅ **CREATE** phase subdirectory (phase-0, phase-1, etc.)
- ✅ **NUMBER PREFIX** 90- shows these are completed (sorts last)

---

### 📋 Planning Documents (Active Work)

**Location:** `docs/60-active-planning/{category}/`

**What Goes Here:**
- Phase plans
- Launch plans
- Agent assignments
- Sprint plans

**Directory Structure:**
```
docs/60-active-planning/
├─ phases/
│  ├─ PHASE_0_DOC_AUDIT.md
│  ├─ PHASE_1_EMPLOYEE_HUB.md
│  └─ PHASE_2_UI_POLISH.md
├─ launch/
│  ├─ LAUNCH_PLAN_REVISED.md
│  └─ MASTER_LAUNCH_PLAN.md
├─ agents/
│  └─ AGENT_ASSIGNMENTS.md
└─ sprints/
   └─ SPRINT_1_PLAN.md
```

**Rules:**
- ❌ **NEVER** keep planning docs in root
- ❌ **NEVER** put in .archive/ (that's for old CRM app!)
- ✅ **STORE** in `60-active-planning/{category}/`
- ✅ **USE SUBCATEGORIES** (phases, launch, agents, sprints)
- ✅ **MOVE TO** `90-completed/` when done
- ✅ **NUMBER PREFIX** 60- shows these are active (sorts before completed)

---

### 🔌 Integration Guides

**Location:** `docs/guides/integrations/`

**What Goes Here:**
- Integration setup guides (one file per integration)
- OAuth configuration
- API client setup
- Webhook configuration

**Naming Convention:** `{service-name}.md` (lowercase, hyphenated)

**Examples:**
- `microsoft-oauth.md`
- `xero.md`
- `docuseal.md`
- `stripe.md` (if adding)

**Rules:**
- ✅ **ONE FILE per integration**
- ❌ **DO NOT** create subdirectories for single integration
- ✅ **UPDATE** existing guide instead of creating new version
- ✅ **INCLUDE** setup steps, configuration, code examples

---

### 📖 Reference Documentation

**Location:** `docs/reference/{category}/`

**Categories:**
- `api/` - API documentation (routers, endpoints)
- `database/` - Database schema and scripts
- `configuration/` - Environment variables, settings
- `security/` - Security implementations

**What Goes Here:**
- API reference (tRPC routers)
- Database schema documentation
- Configuration documentation
- Error code catalogs

**Rules:**
- ✅ **USE SUBDIRECTORIES** for categories (api, database, configuration, security)
- ❌ **DO NOT** put business logic here
- ❌ **DO NOT** create reference docs for things in bmm-brownfield-architecture.md
- ✅ **ONLY CREATE** if reference is too large for master doc (e.g., database schema is 13,060 words)

---

### 🛠️ Development Guides

**Location:** `docs/guides/`

**What Goes Here:**
- Testing guides
- Security guides (secrets handling, SQL safety)
- Development workflow guides

**Rules:**
- ❌ **DO NOT** create basic dev guides (covered in coding-standards.md)
- ✅ **ONLY CREATE** for complex/specialized topics (bulk operations testing, security checklists)
- ❌ **DO NOT** create subdirectory for single guide

---

### 🚀 Operations Documentation

**Location:** `docs/operations/`

**Current Files:** 2 files (deployment.md, runbooks.md)

**What Goes Here:**
- Deployment procedures
- Operational runbooks (backup, monitoring, production checklist)
- Incident response
- Disaster recovery

**Rules:**
- ✅ **CONSOLIDATE** similar operational docs into runbooks.md
- ❌ **DO NOT** create separate files for backup, monitoring, etc. (merge into runbooks.md)
- ✅ **ONLY 2-3 FILES MAX** in this directory

---

### 💰 Research Documentation

**Location:** `docs/pricing/` (or docs/{research-topic}/)

**What Goes Here:**
- Market research
- Competitive analysis
- Pricing strategy
- Service catalogs
- Research data and snapshots

**Rules:**
- ✅ **RESEARCH IS DIFFERENT** from documentation
- ✅ **KEEP DETAILED** research in separate directory
- ✅ **USE NUMBERED FILES** for sequential research (00-exec-brief.md through 70-rollout-plan.md)
- ✅ **SUBDIRECTORIES OK** for data (data/market/, data/research/)

---

## ❌ Where NOT to Save Documentation

### DO NOT Save in docs/ Root

**Common Mistakes:**
- ❌ Phase completion reports → Use `90-completed/{phase-name}/`
- ❌ Implementation summaries → Use `90-completed/{phase-name}/`
- ❌ Architecture subdocs → Everything goes in `bmm-brownfield-architecture.md`
- ❌ Module READMEs → Covered in `bmm-brownfield-architecture.md`
- ❌ Getting started guides → Covered in `README.md` and `bmm-index.md`
- ❌ Testing guides → Covered in `coding-standards.md`
- ❌ ADR templates → Don't create unless actually using ADRs

### DO NOT Create Subdirectories

**Avoid:**
- ❌ `docs/architecture/` - Use root `bmm-brownfield-architecture.md`
- ❌ `docs/modules/` - Covered in master doc
- ❌ `docs/testing/` - Covered in coding-standards.md
- ❌ `docs/development/` - Covered in coding-standards.md
- ❌ `docs/getting-started/` - Covered in README.md

**Exceptions (Allowed Subdirectories):**
- ✅ `docs/guides/integrations/` - Multiple integration guides
- ✅ `docs/reference/{api,database,configuration,security}/` - Organized reference
- ✅ `docs/pricing/` - Research project
- ✅ `docs/operations/` - Operational procedures

---

## 📊 Documentation Decision Tree

```
┌─ Creating Documentation? ─┐
│                            │
├─ Is it a completion report?
│  └─ YES → 90-completed/{phase-name}/
│  └─ NO  → Continue...
│
├─ Is it core system architecture?
│  └─ YES → Update bmm-brownfield-architecture.md (DO NOT create new file!)
│  └─ NO  → Continue...
│
├─ Is it an integration setup guide?
│  └─ YES → guides/integrations/{service-name}.md
│  └─ NO  → Continue...
│
├─ Is it research/market analysis?
│  └─ YES → pricing/ or {research-topic}/ directory
│  └─ NO  → Continue...
│
├─ Is it API/database reference?
│  └─ YES → reference/{api|database|configuration|security}/
│  └─ NO  → Continue...
│
├─ Is it operational procedures?
│  └─ YES → operations/runbooks.md or operations/deployment.md
│  └─ NO  → Continue...
│
├─ Is it development guidance?
│  └─ YES → Update coding-standards.md (DO NOT create new file!)
│  └─ NO  → Continue...
│
└─ Still unsure?
   └─ ASK USER before creating any documentation
```

---

## 🎯 Examples: What Agent Should Do

### Example 1: Phase Completion Report

**❌ WRONG:**
```
docs/EMPLOYEE_HUB_COMPLETE.md  ❌ WRONG LOCATION!
```

**✅ CORRECT:**
```bash
mkdir -p docs/90-completed/phase-1
# Create file at:
docs/90-completed/phase-1/EMPLOYEE_HUB_COMPLETE.md  ✅ CORRECT

# NEVER use .archive/ - that's for old CRM app in project root!
```

---

### Example 2: New Integration Setup Guide ✅ CORRECT

**Agent creates:**
```
docs/guides/integrations/stripe.md  ✅ CORRECT
```

**Content includes:**
- OAuth setup
- API configuration
- Code examples
- Testing instructions

---

### Example 3: Architecture Addition ❌ WRONG

**Agent wants to document new feature architecture:**

**WRONG:**
```
docs/architecture/payment-processing.md  ❌ DO NOT CREATE!
```

**CORRECT:**
```
Update existing file:
docs/bmm-brownfield-architecture.md

Add section:
## Payment Processing Architecture
[New content here]
```

---

### Example 4: Testing Guide ❌ WRONG

**Agent creates:**
```
docs/testing/integration-testing.md  ❌ DO NOT CREATE!
```

**CORRECT:**
```
Update existing file:
docs/coding-standards.md

Find section:
## Testing Patterns

Add content there.
```

---

## 📝 Update Guidelines

### When to UPDATE Existing Doc vs CREATE New

**UPDATE Existing When:**
- Adding architecture information → bmm-brownfield-architecture.md
- Adding development patterns → coding-standards.md
- Adding known issue → known-issues.md
- Adding operational procedure → operations/runbooks.md
- Adding error code → reference/error-codes.md

**CREATE New When:**
- New integration → guides/integrations/{name}.md
- New research project → {research-topic}/ directory
- Phase/project report → 90-completed/{phase-name}/

**ASK USER When:**
- Unsure if content fits existing docs
- Content is >5,000 words (might need separate file)
- Creating entirely new category

---

## 🗂️ Special Directories

### ⚠️ `.archive/` - OLD CRM APP (PROJECT ROOT ONLY!)

**Location:** `/root/projects/practice-hub/.archive/` (PROJECT ROOT, NOT docs/)  
**Purpose:** Reference material from archived CRM application  
**Contents:** Old app code (practice-hub, accounts-app), migration docs, screenshots  

**CRITICAL RULES:**
- ❌ **NEVER** add new documentation here
- ❌ **NEVER** move current docs here  
- ❌ **NEVER** delete or modify (it's old app reference!)
- ❌ **NEVER** create docs/.archive/ (I wrongly did this, now deleted!)
- ✅ **ONLY** reference when comparing old vs new implementation
- ✅ **LOCATION:** Project root only, never in docs/

---

### ✅ `90-completed/` - Completed Work

**Location:** `docs/90-completed/{phase-name}/`  
**Number Prefix:** 90- (sorts last, shows completed status)

**Directory Structure:**
```
docs/90-completed/
├─ phase-0/
│  └─ PHASE_0_COMPLETE.md
├─ phase-1/
│  └─ EMPLOYEE_HUB_COMPLETE.md
└─ sprint-X/
   └─ SPRINT_X_RETROSPECTIVE.md
```

**Rules:**
- ✅ Organized by phase/sprint subdirectories
- ✅ Clear what's completed (90- prefix)
- ❌ Never in root, never in .archive/

---

### ✅ `60-active-planning/` - Active Planning

**Location:** `docs/60-active-planning/{category}/`  
**Number Prefix:** 60- (sorts before completed, shows active status)

**Directory Structure:**
```
docs/60-active-planning/
├─ phases/          Phase plans (PHASE_X_*.md)
├─ launch/          Launch plans  
├─ agents/          Agent assignments
└─ sprints/         Sprint plans
```

**Rules:**
- ✅ Organized by category subdirectories
- ✅ Clear what's active (60- prefix)
- ✅ Move to 90-completed/ when done
- ❌ Never in root, never in .archive/

---

## 📊 Numbered Taxonomy (AI-Optimized)

**Complete Structure:**
```
00-ai-index/          AI entry point (MANDATORY first read)
10-system/            System architecture & core docs
20-dev-standards/     Coding standards & documentation guide
30-reference/         API, database, config, security
40-guides/            Integration guides & specialized docs
50-operations/        Deployment & operational procedures
60-active-planning/   Active phases, launch plans, sprints
70-research/          Research projects (pricing, market analysis)
90-completed/         Completed phases, historical reports
```

**Rationale:** 
- Numbered prefixes ensure proper sorting (00→10→20→...→90)
- Clear separation of active (60-) vs completed (90-) work
- AI agents load in sequential order (00-first, then 10, 20, etc.)
- Excludes research (70-) from default context to reduce noise

**Quick Reference:**
- **For AI agents:** Start with `00-ai-index/README.md`
- **For system docs:** Use `10-system/`
- **For dev standards:** Use `20-dev-standards/`
- **For active work:** Use `60-active-planning/{category}/`
- **For completed work:** Use `90-completed/{phase-name}/`

---

## ✅ File Count Targets

**Current:** 45 files (excluding archive and audit)

**Target Breakdown:**
- Core: 7 files (DO NOT EXCEED without approval)
- Pricing: 20 files (research - OK)
- Integrations: 6-10 files (one per integration)
- Reference: 7-10 files (API, DB, config)
- Guides: 3-5 files (specialized only)
- Operations: 2-3 files (consolidated)

**Maximum Target:** ~50 files total

**Red Flag:** If count exceeds 50, audit for duplicates or unnecessary files

---

## 🎯 Quick Reference for Common Scenarios

### "I need to document a new feature"
→ Update `bmm-brownfield-architecture.md`, add section for feature

### "I completed a phase/sprint"  
→ Create completion report in `90-completed/{phase-name}/`

### "I'm adding a new integration"
→ Create `guides/integrations/{service-name}.md`

### "I need to document testing patterns"
→ Update `coding-standards.md` in Testing Patterns section

### "I have operational procedures"
→ Add to `operations/runbooks.md` (or deployment.md if deployment-specific)

### "I found a bug/issue"
→ Add to `known-issues.md`

### "I'm doing market research"
→ Create directory `docs/{research-topic}/` with numbered files

### "I'm documenting database schema"
→ **ONLY IF** too large for bmm-brownfield-architecture.md, use `reference/database/schema.md`

### "I have API documentation"
→ Add to `reference/api/routers.md` (or update bmm-brownfield-architecture.md)

---

## 🚫 Anti-Patterns (DO NOT DO THIS!)

### ❌ Creating Subdirectories for Everything
```
docs/
├─ architecture/      ❌ NO! Use bmm-brownfield-architecture.md
├─ modules/           ❌ NO! Covered in master doc
├─ testing/           ❌ NO! Use coding-standards.md
├─ development/       ❌ NO! Use coding-standards.md
└─ getting-started/   ❌ NO! Use README.md
```

### ❌ Creating Multiple Navigation Files
```
docs/architecture/README.md     ❌ NO!
docs/guides/README.md           ❌ NO!
docs/reference/README.md        ❌ NO!
```

**Rule:** Only `docs/README.md` and `docs/SITEMAP.md` for navigation

### ❌ Creating Stub/Placeholder Files
```
docs/future-feature.md          ❌ NO! Don't create until you have content
```

### ❌ Duplicating Master Doc Content
```
docs/multi-tenancy-guide.md     ❌ NO! Already in bmm-brownfield-architecture.md
docs/auth-system.md             ❌ NO! Already in bmm-brownfield-architecture.md
```

---

## 🔍 Pre-Creation Checklist

Before creating ANY documentation file, ask yourself:

- [ ] Does this information already exist in bmm-brownfield-architecture.md?
- [ ] Does this information already exist in coding-standards.md?
- [ ] Is this a completion report? (→ 90-completed/{phase-name}/)
- [ ] Is this a planning document? (→ .archive/planning-docs/)
- [ ] Am I creating a stub file with <500 words? (→ DON'T CREATE, use existing doc)
- [ ] Am I creating a subdirectory with only 1-2 files? (→ DON'T CREATE subdirectory)
- [ ] Does this fit the documentation guide categories above?

**If you answered NO to all questions → ASK USER before creating!**

---

## 📊 Documentation Maintenance

### When to Update vs Create

**UPDATE existing documentation when:**
- Adding new router patterns → coding-standards.md
- Adding new architecture component → bmm-brownfield-architecture.md
- Adding new known issue → known-issues.md
- Adding new error code → reference/error-codes.md
- Adding to existing integration → guides/integrations/{existing}.md

**CREATE new documentation only when:**
- New integration (doesn't exist yet) → guides/integrations/{new-service}.md
- New research project → {research-topic}/ directory
- Specialized guide (>3,000 words, distinct topic) → guides/{topic}.md
- Project/phase report → 90-completed/{phase-name}/{report}.md

---

## 🎯 Current Documentation State

**Total Active Files:** 45

**Breakdown:**
```
Core (root):           7 files  ← DO NOT EXCEED
Pricing research:     20 files  ← Research, not docs
Integration guides:    6 files  ← One per integration
Reference:            7 files  ← API, DB, config, security
Dev guides:           3 files  ← Specialized only
Operations:           2 files  ← Consolidated
```

**Archive:**
```
.archive/planning-docs/         ← Active planning (retrieve as needed)
90-completed/{phase-name}/       ← Completion reports
.archive/user-guides-moved/     ← End-user training
.archive/audit-2025-01-03/      ← Historical docs
```

---

## ✅ Example: Completion Report (FIXED)

**Problem:** EMPLOYEE_HUB_COMPLETE.md was in docs/ root  
**Was:** `docs/EMPLOYEE_HUB_COMPLETE.md` ❌  
**Now:** `docs/_completed/EMPLOYEE_HUB_COMPLETE.md` ✅

**Lesson:** Completion reports go in `_completed/`, NOT root, NOT .archive/

---

## 📋 Summary for AI Agents

**Simple Rule:** 
- **ONE master doc** for system architecture (bmm-brownfield-architecture.md)
- **ONE file per integration** (guides/integrations/)
- **Completion reports** → 90-completed/{phase-name}/
- **Planning docs** → .archive/planning-docs/
- **When in doubt** → ASK USER or update existing doc

**File Limit:** Keep total under 50 files (excluding research projects)

**Verification:** Before saving, check this guide!

---

**Last Updated:** 2025-01-03  
**Maintained By:** Development Team  
**Version:** 1.0

