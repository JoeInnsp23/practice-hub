# Complete Documentation Consolidation Plan

**Total Documentation Found**: 62 files (917K)
**Current Status**: Scattered across root + docs/
**Target**: AI-optimized structure with zero redundancy

---

## Current Inventory

### Root Folder (21 files - 637K)

| File | Size | Status | Destination |
|------|------|--------|-------------|
| **README.md** | 16K | ✅ KEEP | ➡️ Root (project overview) |
| **CLAUDE.md** | 29K | ✅ KEEP | ➡️ Root (AI rules - critical) |
| **SECURITY.md** | 17K | ✅ KEEP | ➡️ Root (GitHub convention) |
| **CONTRIBUTING.md** | 20K | ✅ KEEP | ➡️ Root (GitHub convention) |
| **CHANGELOG.md** | 15K | ✅ KEEP | ➡️ Root (version history) |
| DEVELOPER_ONBOARDING.md | 31K | 📦 MERGE | ➡️ docs/getting-started/ |
| CODE_STYLE_GUIDE.md | 24K | 📦 MERGE | ➡️ docs/development/coding-standards.md |
| TROUBLESHOOTING_DEV.md | 21K | 📦 MERGE | ➡️ docs/troubleshooting/common-errors.md |
| INTEGRATIONS_REFERENCE.md | 19K | 📦 MERGE | ➡️ docs/reference/integrations.md |
| ERROR_CODES.md | 22K | 📦 MERGE | ➡️ docs/reference/error-codes.md |
| DATABASE_SCRIPTS.md | 1.3K | 📦 MERGE | ➡️ docs/reference/database/scripts.md |
| PRODUCTION_READINESS.md | 18K | 📦 MERGE | ➡️ docs/operations/production-checklist.md |
| TESTING_SUMMARY.md | 9.1K | 🗄️ ARCHIVE | ➡️ docs/.archive/testing-2025.md |
| PERFORMANCE_AUDIT.md | 17K | 🗄️ ARCHIVE | ➡️ docs/.archive/audits/performance.md |
| SECURITY_AUDIT.md | 20K | 🗄️ ARCHIVE | ➡️ docs/.archive/audits/security.md |
| AGENTS.md | 218K | 🔍 REVIEW | ➡️ TBD (needs investigation) |
| PR.md | 66K | 🗄️ ARCHIVE | ➡️ docs/.archive/prs/pr-001.md |
| HANDOFF.md | 17K | 🗄️ ARCHIVE | ➡️ docs/.archive/handovers/ |
| IMPLEMENTATION_PRIORITY.md | 33K | 🗄️ ARCHIVE | ➡️ docs/.archive/planning/ |
| WORKFLOW_VERSIONING_CONTINUATION.md | 47K | 🗄️ ARCHIVE | ➡️ docs/.archive/wip/ |
| GEMINI.md | 3.4K | 🗄️ ARCHIVE | ➡️ docs/.archive/notes/ |

### docs/ Folder (41 files - 280K)

| File | Size | Status | Destination |
|------|------|--------|-------------|
| **BROWNFIELD_ARCHITECTURE.md** | 56K | ✅ KEEP | ➡️ docs/architecture/system-overview.md |
| **DATABASE_SCHEMA.md** | 66K | ✅ KEEP | ➡️ docs/reference/database/schema.md |
| **API_REFERENCE.md** | 14K | ✅ KEEP | ➡️ docs/reference/api/routers.md |
| **PRE_PRODUCTION_ISSUES.md** | 17K | ✅ KEEP | ➡️ docs/development/technical-debt.md |
| MICROSOFT_OAUTH_SETUP.md | 14K | ✅ KEEP | ➡️ docs/guides/integrations/microsoft-oauth.md |
| SENTRY_SETUP.md | 10K | ✅ KEEP | ➡️ docs/guides/integrations/sentry.md |
| XERO_INTEGRATION_SETUP.md | 7.8K | ✅ KEEP | ➡️ docs/guides/integrations/xero.md |
| kyc/LEMVERIFY_INTEGRATION.md | - | ✅ KEEP | ➡️ docs/guides/integrations/lemverify.md |
| DEPLOYMENT_CHECKLIST.md | 21K | ✅ KEEP | ➡️ docs/operations/deployment.md |
| ENVIRONMENT_VARIABLES.md | 17K | ✅ KEEP | ➡️ docs/reference/configuration/env.md |
| operations/BACKUP_RECOVERY.md | - | ✅ KEEP | ➡️ docs/operations/backup-recovery.md |
| operations/MONITORING.md | - | ✅ KEEP | ➡️ docs/operations/monitoring.md |
| operations/RUNBOOKS.md | - | ✅ KEEP | ➡️ docs/operations/runbooks.md |
| security/CSRF_PROTECTION.md | - | ✅ KEEP | ➡️ docs/reference/security/csrf.md |
| proposal-reference/ (5 files) | - | ✅ KEEP | ➡️ docs/reference/business-logic/proposals/ |
| user-guides/ (4 files) | - | ✅ KEEP | ➡️ docs/user-guides/ (as-is) |
| SYSTEM_ARCHITECTURE.md | 24K | ❌ DELETE | Superseded by BROWNFIELD |
| AUTHENTICATION_OVERVIEW.md | 9.9K | ❌ DELETE | Covered in BROWNFIELD |
| MICROSOFT_OAUTH_SUMMARY.md | 11K | ❌ DELETE | Redundant with SETUP |
| HANDOVER_2025-10-08.md | 27K | 🗄️ ARCHIVE | ➡️ docs/.archive/handovers/ |
| proposal-hub/PHASE_*.md (3 files) | - | 🗄️ ARCHIVE | ➡️ docs/.archive/phases/ |
| proposal-hub/IMPLEMENTATION_CHECKLIST.md | - | 🗄️ ARCHIVE | ➡️ docs/.archive/phases/ |
| audit/client-and-proposal-hubs.md | - | 🗄️ ARCHIVE | ➡️ docs/.archive/audits/ |
| gap-analysis/ (8 files) | - | 🗄️ ARCHIVE | ➡️ docs/.archive/gap-analysis/ |

---

## Legend

- ✅ **KEEP** = Critical, move to new AI-optimized structure
- 📦 **MERGE** = Consolidate with other docs in new structure
- ❌ **DELETE** = Redundant, superseded, or outdated
- 🗄️ **ARCHIVE** = Historical value, move to `.archive/`
- 🔍 **REVIEW** = Needs investigation before decision

---

## Summary Statistics

| Action | Count | Size | % of Total |
|--------|-------|------|------------|
| ✅ Keep in Root | 5 | 97K | 11% |
| ✅ Keep (Move to docs/) | 28 | 280K | 31% |
| 📦 Merge/Consolidate | 8 | 151K | 16% |
| ❌ Delete | 4 | 73K | 8% |
| 🗄️ Archive | 16 | 316K | 34% |
| 🔍 Review | 1 | 218K | - |
| **TOTAL** | **62** | **917K** | **100%** |

---

## New AI-Optimized Structure

```
practice-hub/
├── README.md                          # ✅ Project overview (stays in root)
├── CLAUDE.md                          # ✅ AI rules (stays in root)
├── SECURITY.md                        # ✅ Security policy (stays in root)
├── CONTRIBUTING.md                    # ✅ Contributing guide (stays in root)
├── CHANGELOG.md                       # ✅ Version history (stays in root)
│
└── docs/
    ├── README.md                      # 🆕 Master index with AI metadata
    │
    ├── getting-started/               # 🆕 Quick start guides
    │   ├── README.md
    │   ├── quickstart-developer.md    # 📦 Consolidate DEVELOPER_ONBOARDING
    │   ├── quickstart-ai-agent.md     # 🆕 AI agent context guide
    │   ├── codebase-tour.md           # 🆕 High-level walkthrough
    │   └── common-tasks.md            # 🆕 Top 20 tasks
    │
    ├── architecture/                  # ♻️ Reorganized
    │   ├── README.md
    │   ├── system-overview.md         # ✅ BROWNFIELD_ARCHITECTURE.md
    │   ├── database-design.md         # 🆕 Extract from schema docs
    │   ├── multi-tenancy.md           # 🆕 Extract from BROWNFIELD
    │   ├── authentication.md          # 🆕 Extract from BROWNFIELD
    │   ├── api-design.md              # 🆕 tRPC patterns
    │   └── design-system.md           # 🆕 Extract from CLAUDE.md
    │
    ├── guides/                        # 🆕 Task-oriented how-tos
    │   ├── README.md
    │   ├── development/
    │   │   ├── environment-setup.md
    │   │   ├── database-workflow.md
    │   │   ├── creating-trpc-router.md
    │   │   ├── adding-ui-component.md
    │   │   └── testing.md
    │   └── integrations/
    │       ├── microsoft-oauth.md     # ✅ MICROSOFT_OAUTH_SETUP.md
    │       ├── lemverify-kyc.md       # ✅ kyc/LEMVERIFY_INTEGRATION.md
    │       ├── docuseal.md            # 🆕 Extract from guides
    │       ├── sentry.md              # ✅ SENTRY_SETUP.md
    │       └── xero.md                # ✅ XERO_INTEGRATION_SETUP.md
    │
    ├── reference/                     # ♻️ Reorganized
    │   ├── README.md
    │   ├── api/
    │   │   ├── routers.md             # ✅ API_REFERENCE.md
    │   │   └── webhooks.md            # 🆕 Extract webhook docs
    │   ├── database/
    │   │   ├── schema.md              # ✅ DATABASE_SCHEMA.md
    │   │   ├── views.md               # 🆕 Extract from schema
    │   │   ├── indexes.md             # 🆕 Extract from schema
    │   │   └── scripts.md             # 📦 DATABASE_SCRIPTS.md
    │   ├── configuration/
    │   │   ├── environment.md         # ✅ ENVIRONMENT_VARIABLES.md
    │   │   └── docker.md              # 🆕 Docker setup
    │   ├── business-logic/
    │   │   └── proposals/             # ✅ proposal-reference/*
    │   ├── integrations.md            # 📦 INTEGRATIONS_REFERENCE.md
    │   ├── error-codes.md             # 📦 ERROR_CODES.md
    │   └── security/
    │       └── csrf.md                # ✅ security/CSRF_PROTECTION.md
    │
    ├── operations/                    # ♻️ Reorganized
    │   ├── README.md
    │   ├── deployment.md              # ✅ DEPLOYMENT_CHECKLIST.md
    │   ├── production-checklist.md    # 📦 PRODUCTION_READINESS.md
    │   ├── backup-recovery.md         # ✅ operations/BACKUP_RECOVERY.md
    │   ├── monitoring.md              # ✅ operations/MONITORING.md
    │   └── runbooks.md                # ✅ operations/RUNBOOKS.md
    │
    ├── development/                   # 🆕 Development standards
    │   ├── README.md
    │   ├── coding-standards.md        # 📦 CODE_STYLE_GUIDE.md + CLAUDE.md
    │   ├── git-workflow.md            # 🆕 Git conventions
    │   ├── testing-strategy.md        # 🆕 Testing patterns
    │   ├── technical-debt.md          # ✅ PRE_PRODUCTION_ISSUES.md
    │   └── security-guidelines.md     # 🆕 Security best practices
    │
    ├── troubleshooting/               # 🆕 Problem-solution DB
    │   ├── README.md
    │   ├── common-errors.md           # 📦 TROUBLESHOOTING_DEV.md
    │   ├── database-issues.md         # 🆕 Extract from common errors
    │   ├── authentication-issues.md   # 🆕 Extract from common errors
    │   └── integration-failures.md    # 🆕 Extract from common errors
    │
    ├── user-guides/                   # ✅ Keep as-is
    │   ├── README.md
    │   ├── admin-guide.md
    │   ├── staff-guide.md
    │   ├── client-onboarding.md
    │   └── faq.md
    │
    ├── .archive/                      # 🗄️ Historical documents
    │   ├── 2025-10-19-gap-analysis/   # gap-analysis/*
    │   ├── handovers/                 # HANDOVER*.md
    │   ├── phases/                    # proposal-hub/PHASE_*.md
    │   ├── audits/                    # *_AUDIT.md
    │   ├── prs/                       # PR.md
    │   ├── planning/                  # IMPLEMENTATION_PRIORITY.md
    │   └── wip/                       # WORKFLOW_VERSIONING_CONTINUATION.md
    │
    └── .meta/                         # 🆕 Documentation metadata
        ├── templates/
        │   ├── guide-template.md
        │   ├── reference-template.md
        │   └── troubleshooting-template.md
        ├── changelog.md
        └── ownership.yaml
```

---

## Migration Strategy

### Phase 1: Structure Creation (Day 1 - Morning)
✅ Create new directory structure
✅ Create document templates
✅ Create master index (docs/README.md)
✅ Create AI quickstart guide

### Phase 2: Core Consolidation (Day 1 - Afternoon)
1. **Architecture**:
   - Rename BROWNFIELD_ARCHITECTURE.md → system-overview.md
   - Extract multi-tenancy section → multi-tenancy.md
   - Extract auth section → authentication.md
   - Extract API section → api-design.md
   - Extract design system from CLAUDE.md → design-system.md
   - Consolidate DATABASE_SCHEMA.md → database-design.md

2. **Reference**:
   - Move API_REFERENCE.md → reference/api/routers.md
   - Move DATABASE_SCHEMA.md → reference/database/schema.md
   - Move ENVIRONMENT_VARIABLES.md → reference/configuration/environment.md
   - Consolidate INTEGRATIONS_REFERENCE.md + ERROR_CODES.md

3. **Guides**:
   - Consolidate DEVELOPER_ONBOARDING.md → getting-started/quickstart-developer.md
   - Move integration docs → guides/integrations/
   - Create development how-tos

### Phase 3: Operations & Development (Day 2 - Morning)
1. **Operations**:
   - Move DEPLOYMENT_CHECKLIST.md → operations/deployment.md
   - Consolidate PRODUCTION_READINESS.md → operations/production-checklist.md
   - Move operations/* as-is

2. **Development**:
   - Consolidate CODE_STYLE_GUIDE.md + CLAUDE.md → development/coding-standards.md
   - Move PRE_PRODUCTION_ISSUES.md → development/technical-debt.md
   - Create testing-strategy.md

3. **Troubleshooting**:
   - Consolidate TROUBLESHOOTING_DEV.md → troubleshooting/common-errors.md
   - Extract database, auth, integration sections

### Phase 4: Archival & Cleanup (Day 2 - Afternoon)
1. Create archive structure
2. Move historical docs (16 files)
3. Delete redundant docs (4 files)
4. Investigate AGENTS.md (218K - why so large?)

### Phase 5: BMAD Integration (Day 2 - Evening)
1. Update .bmad-core/core-config.yaml
2. Create documentation slash commands
3. Update agent skills
4. Test AI discovery

### Phase 6: Final Polish (Day 3)
1. Add cross-references between all docs
2. Validate all links work
3. Update README.md with new structure
4. Update CLAUDE.md references
5. Create migration guide

---

## Special Case: AGENTS.md (218K!)

**Size**: 218K (largest file!)
**Action**: 🔍 **INVESTIGATE**

**Possible scenarios**:
1. Symlink to another file
2. Large historical agent configuration
3. Concatenated multiple files
4. Generated documentation

**Investigation needed** before decision.

---

## Benefits of New Structure

### For AI Agents
✅ Clear discovery via metadata
✅ Task-oriented organization
✅ No redundancy = no confusion
✅ Automatic context loading by agent type
✅ Clear entry points for every workflow

### For Developers
✅ Find docs in <30 seconds
✅ Onboarding in <1 hour
✅ Clear how-to for every task
✅ Troubleshooting covers 90% of issues

### For Maintenance
✅ Clear ownership per document
✅ Outdated docs flagged
✅ Zero redundancy
✅ Version controlled changes

---

## Approval Required

**Ready to execute this plan?**

If yes, I will:
1. Create new structure
2. Migrate and consolidate 62 files
3. Update all cross-references
4. Archive historical docs
5. Update BMAD configuration
6. Create master index

**Estimated Time**: 2-3 days
**Result**: Clean, AI-optimized, zero-redundancy documentation

---

**Shall I proceed?**
