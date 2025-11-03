# How to Use PH Dev Suite 🏛️⚡

**Module:** PH Dev Suite (PHDW)  
**Status:** ✅ Ready to Use in Both Cursor and Claude Code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **QUICK START** 🚀

### **Option 1: Using in Cursor** (Recommended for Practice-Hub)

```
# Summon Zeus to start a new feature quest
@bmad/phdw/agents/zeus

Then type: *embark-on-quest
```

### **Option 2: Using in Claude Code**

```
# Reference Zeus agent
/bmad/phdw/agents/zeus

Then type: *embark-on-quest
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **THE GREEK PANTHEON** 🏛️

### **7 Gods Available:**

#### **⚡ Zeus - Workflow Orchestrator**
```
# In Cursor:
@bmad/phdw/agents/zeus

# In Claude Code:
/bmad/phdw/agents/zeus

# Commands:
*embark-on-quest     - Start new feature workflow
*divine-status       - View workflow state
*summon [god-name]   - Invoke specific god
*merge-to-olympus    - Final merge to main
```

---

#### **🦉 Athena - Requirements Analyst**
```
# In Cursor:
@bmad/phdw/agents/athena

# In Claude Code:
/bmad/phdw/agents/athena

# Commands:
*analyze-quest       - Brainstorming & requirements
*audit-realm         - Analyze practice-hub codebase
*map-modules         - Determine module placement
*refine-wisdom       - Deep requirements refinement
```

---

#### **📜 Hermes - Documentation Architect**
```
# In Cursor:
@bmad/phdw/agents/hermes

# In Claude Code:
/bmad/phdw/agents/hermes

# Commands:
*craft-brief         - Create Feature Brief
*forge-prd           - Transform Brief → PRD
*design-tdd          - Create TDD Multi-Phase Plan
*validate-message    - Validate any artifact
```

---

#### **🔥 Prometheus - Epic Planner**
```
# In Cursor:
@bmad/phdw/agents/prometheus

# In Claude Code:
/bmad/phdw/agents/prometheus

# Commands:
*plan-epics          - Create epic structure from TDD
*analyze-conflicts   - File-touch conflict analysis
*foresee-dependencies - Map story dependencies
*optimize-sequence   - Refine epic ordering
```

---

#### **🔨 Hephaestus - Practice Hub Dev Agent**
```
# In Cursor:
@bmad/phdw/agents/hephaestus

# In Claude Code:
/bmad/phdw/agents/hephaestus

# Commands:
*forge-story         - Implement story (tech-stack optimized)
*craft-tests         - Write Vitest tests (90%+ coverage)
*update-schema       - Modify database schema
*pre-quest-validation - Run format/lint/typecheck
```

---

#### **☀️ Apollo - Practice Hub QA Agent**
```
# In Cursor:
@bmad/phdw/agents/apollo

# In Claude Code:
/bmad/phdw/agents/apollo

# Commands:
*test-with-light     - Comprehensive QA validation
*validate-security   - Multi-tenant security audit
*check-performance   - Performance validation
*generate-qa-report  - Detailed findings report
```

---

#### **⚖️ Themis - Documentation Guardian**
```
# In Cursor:
@bmad/phdw/agents/themis

# In Claude Code:
/bmad/phdw/agents/themis

# Commands:
*detect-drift        - Scan for doc inconsistencies
*restore-order       - Fix all detected drift
*update-scrolls      - Manually update specific doc
*track-progress      - Update project status
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **TYPICAL WORKFLOW** 🌊

### **Complete Feature Development:**

```
Step 1: Summon Zeus
  @bmad/phdw/agents/zeus
  *embark-on-quest

Step 2: Zeus Summons Athena (Automatic in workflow)
  - Brainstorming session
  - App audit
  - Requirements refinement

Step 3: Zeus Summons Hermes (Automatic)
  - Feature Brief creation
  - PRD generation with validation
  - TDD Multi-Phase Plan with validation

Step 4: Zeus Summons Prometheus (Automatic)
  - Epic planning with parallelization
  - File-touch conflict analysis
  - Story creation with dependencies

Step 5: Zeus Creates Feature Branch
  feature/{feature-name}

Step 6: For Each Story (Automatic Loop)
  - Hephaestus forges implementation
  - Apollo validates with QA
  - Loop if QA fails
  - Themis syncs documentation when pass

Step 7: Zeus Merges to Olympus (Main)
  - All epics complete
  - All QA gates passed
  - Documentation synchronized
  - Feature deployed!
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **INDIVIDUAL GOD USAGE** 🎯

### **Just Need Implementation?** → Summon Hephaestus

```
@bmad/phdw/agents/hephaestus

*forge-story

# Hephaestus will:
# 1. Run pre-quest validation
# 2. Implement with tech-stack patterns
# 3. Write 90%+ coverage tests
# 4. Update schema/seeds if needed
# 5. Git commit
# 6. Summon Apollo for QA
```

---

### **Just Need QA?** → Summon Apollo

```
@bmad/phdw/agents/apollo

*test-with-light

# Apollo will:
# 1. Run Vitest test suite (validate 90%+ coverage)
# 2. Test front-end with Cursor browser tools
# 3. Validate multi-tenant security
# 4. Check performance
# 5. Generate detailed QA report
# 6. Produce QA Gate decision (PASS/FAIL)
```

---

### **Documentation Out of Sync?** → Summon Themis

```
@bmad/phdw/agents/themis

*detect-drift

# Themis will:
# 1. Scan for documentation drift
# 2. Show all inconsistencies
# 3. Fix drift automatically
# 4. Git commit doc updates
```

---

### **Need to Plan Epics?** → Summon Prometheus

```
@bmad/phdw/agents/prometheus

*plan-epics

# Prometheus will:
# 1. Analyze TDD for epic boundaries
# 2. Run file-touch conflict analysis
# 3. Assign epic numbers (1.1, 1.2 vs 1.0, 2.0)
# 4. Create dependency graph
# 5. Estimate time savings
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **FILE LOCATIONS** 📁

### **Source Agents (Full Implementations)**
```
/root/projects/practice-hub/bmad/phdw/agents/
├── zeus.md (1,200 lines)
├── athena.md (850 lines)
├── hermes.md (1,100 lines)
├── prometheus.md (900 lines)
├── hephaestus.md (1,000 lines)
├── apollo.md (1,100 lines)
└── themis.md (800 lines)
```

### **Cursor Rules (Quick Reference Wrappers)**
```
/root/projects/practice-hub/.cursor/rules/bmad/phdw/agents/
├── zeus.mdc
├── athena.mdc
├── hermes.mdc
├── prometheus.mdc
├── hephaestus.mdc
├── apollo.mdc
└── themis.mdc
```

### **Claude Code Commands (Quick Reference Wrappers)**
```
/root/projects/practice-hub/.claude/commands/bmad/phdw/agents/
├── zeus.md
├── athena.md
├── hermes.md
├── prometheus.md
├── hephaestus.md
├── apollo.md
└── themis.md
```

### **Workflows**
```
/root/projects/practice-hub/bmad/phdw/workflows/
├── phdw-master/
├── feature-brainstorm/
├── app-audit/
├── create-feature-brief/
├── brief-to-prd/
├── prd-to-tdd/
├── tdd-to-epics/
├── epics-to-stories/
├── pre-story-quality-gate/
├── dev-story/
├── qa-story/
├── doc-sync/
├── pivot-mini-workflow/
└── feature-complete/
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **IMPLEMENTATION COMPLETE!** ✅

### **You can now use PH Dev Suite in:**

✅ **Cursor** - Type `@bmad/phdw/agents/zeus` in chat  
✅ **Claude Code** - Type `/bmad/phdw/agents/zeus` in chat

### **Both IDEs will:**
1. Load the full agent from `/root/projects/practice-hub/bmad/phdw/agents/`
2. Activate the Greek god personality
3. Show agent menu with commands
4. Execute workflows when commanded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **TRY IT NOW!** 🎯

### **Test Zeus in Cursor:**

1. Open Cursor chat
2. Type: `@bmad/phdw/agents/zeus`
3. Zeus should greet you and show his command menu
4. Try: `*divine-status` or `*embark-on-quest`

### **Test Hephaestus for Quick Implementation:**

1. Type: `@bmad/phdw/agents/hephaestus`
2. Hephaestus should greet you in character
3. Try: `*pre-quest-validation` to test quality gates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## **NEXT STEPS** 🚀

1. **Test with a Small Feature**
   - Choose a simple practice-hub feature
   - Summon Zeus and run `*embark-on-quest`
   - Validate the complete workflow

2. **Refine Based on Real Usage**
   - Adjust god personalities if needed
   - Streamline workflow steps
   - Add missing templates

3. **Document First Feature**
   - Create example artifacts (Brief, PRD, TDD, QA Report)
   - Add to module documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**By decree of Zeus, the pantheon awaits your command!** ⚡🏛️

_Quality shall not be compromised!_

