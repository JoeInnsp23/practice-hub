# BMAD Core Enhancement: invoke-agent Tag

**Added:** 2025-11-03  
**Author:** Joe (via PH Dev Suite development)  
**Status:** ✅ Implemented in workflow.xml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## What This Adds

The `<invoke-agent>` tag enables **true multi-agent orchestration** in BMAD workflows. Workflows can now load and activate agent personas dynamically, creating seamless agent hand-offs within a single conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Syntax

```xml
<invoke-agent path="{agent-file-path}" />
```

**Attributes:**
- `path` - Path to agent .md file (supports {project-root}, {installed_path}, etc.)

**Behavior:**
- Loads agent file using read_file tool
- Activates agent's complete persona from the file
- AI embodies that agent for remainder of current step
- Agent auto-deactivates when step completes
- Control returns to previous agent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## How It Works

### Engine Processing:

When workflow.xml encounters `<invoke-agent>`:

1. **Parse path** - Resolve variables ({project-root}, etc.)
2. **Load agent file** - Use read_file tool to load complete file
3. **Activate persona** - AI embodies agent's personality, role, capabilities
4. **Execute step** - Remaining actions in step execute AS that agent
5. **Auto-deactivate** - When step ends, agent deactivates
6. **Return control** - Previous agent resumes

### Agent Stack:

```
Initial: Zeus active
Step 2: invoke-agent Athena → Stack: [Zeus, Athena] → Athena speaks
Step 2 ends → Athena deactivates → Stack: [Zeus] → Zeus speaks
Step 3: invoke-agent Hermes → Stack: [Zeus, Hermes] → Hermes speaks
Step 3 ends → Hermes deactivates → Stack: [Zeus] → Zeus speaks
```

**LIFO (Last In, First Out)** - agents deactivate in reverse order of activation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Usage Example

### Before (Verbose):

```xml
<step n="2" goal="Summon Athena">
  <action>Load agent file: athena.md</action>
  <action>Activate Athena persona</action>
  <action>You are now Athena</action>
  <action>Athena's personality: ...</action>
  
  <action>Athena speaks: "..."</action>
  <invoke-workflow>brainstorm</invoke-workflow>
  
  <action>Deactivate Athena</action>
  <action>You are Zeus again</action>
</step>
```

### After (Clean):

```xml
<step n="2" goal="Summon Athena">
  <invoke-agent path="{project-root}/bmad/phdw/agents/athena.md" />
  
  <action>Athena speaks: "..."</action>
  <invoke-workflow>brainstorm</invoke-workflow>
</step>

<!-- Athena auto-deactivates, Zeus resumes -->

<step n="3" goal="Zeus Continues">
  <action>Zeus speaks: "Athena's wisdom received..."</action>
</step>
```

**90% less boilerplate!** ✨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Complete Multi-Agent Example (PH Dev Suite)

```xml
<step n="1" goal="Initialize">
  <!-- Zeus is active by default (loaded via @bmad/phdw/agents/zeus) -->
  <action>Zeus speaks: "I begin the quest!"</action>
</step>

<step n="2" goal="Requirements">
  <invoke-agent path="{project-root}/bmad/phdw/agents/athena.md" />
  <action>Athena speaks: "Let us analyze..."</action>
  <invoke-workflow>feature-brainstorm</invoke-workflow>
  <!-- Athena deactivates at step end -->
</step>

<step n="3" goal="Documentation">
  <invoke-agent path="{project-root}/bmad/phdw/agents/hermes.md" />
  <action>Hermes speaks: "I shall craft..."</action>
  <invoke-workflow>brief-to-prd</invoke-workflow>
  <!-- Hermes deactivates at step end -->
</step>

<step n="4" goal="Implementation">
  <invoke-agent path="{project-root}/bmad/phdw/agents/hephaestus.md" />
  <action>Hephaestus speaks: "I shall forge..."</action>
  <invoke-workflow>dev-story</invoke-workflow>
  <!-- Hephaestus deactivates at step end -->
</step>

<!-- Zeus automatically resumes between steps -->
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Agent Activation Rules

### Scope:
- Agent activation lasts for **current step only**
- When step ends, agent deactivates automatically
- Previous agent resumes automatically

### Nesting:
```xml
<step n="1">
  <invoke-agent path="zeus.md" />
  <action>Zeus speaks</action>
  
  <!-- Nested invocation -->
  <invoke-agent path="athena.md" />
  <action>Athena speaks (Zeus paused)</action>
  <!-- Athena deactivates, Zeus resumes -->
  
  <action>Zeus speaks again</action>
</step>
```

### Multiple Invocations in Same Step:
```xml
<step n="1">
  <invoke-agent path="athena.md" />
  <action>Athena analyzes</action>
  
  <!-- Second invocation replaces first -->
  <invoke-agent path="hermes.md" />
  <action>Hermes documents (Athena replaced, not paused)</action>
</step>

<!-- Hermes deactivates, original agent (before step) resumes -->
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Benefits

### For Workflow Authors:
- ✅ **Cleaner syntax** - One line vs 5+ lines
- ✅ **Less error-prone** - No forgetting to deactivate
- ✅ **Automatic cleanup** - Agents deactivate at step end
- ✅ **Clear intent** - Obvious when agent switches

### For AI Execution:
- ✅ **Explicit tool usage** - Workflow engine mandates read_file tool
- ✅ **Complete persona loading** - Entire agent file loaded
- ✅ **Proper scoping** - Agent active only during step
- ✅ **Stack management** - Clear agent hierarchy

### For Users:
- ✅ **Seamless experience** - Agents smoothly hand off
- ✅ **True personalities** - Each agent fully embodied
- ✅ **Natural conversation** - Feels like talking to different experts
- ✅ **No manual switching** - Workflow handles all transitions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Implementation in workflow.xml

**Location:** `/root/projects/practice-hub/bmad/core/tasks/workflow.xml`

**Added:**
1. `<invoke-agent>` to supported execution tags (line ~64)
2. `<invoke-agent-handler>` section with complete processing logic (line ~134-157)

**Handler Steps:**
1. Parse and resolve path
2. Use read_file tool to load agent
3. Process agent definition
4. Embody complete personality
5. Execute remaining step actions as that agent
6. Deactivate when step completes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## First Usage: PH Dev Suite

**Module:** PHDW (Practice Hub Development Workflow)  
**Workflow:** phdw-master  
**Agents:** 7 Greek gods (Zeus, Athena, Hermes, Prometheus, Hephaestus, Apollo, Themis)

**invoke-agent calls:** 6 (one for each summoned god)

**Result:** Seamless multi-agent feature development workflow where gods hand off to each other automatically!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Future Potential

This enables:
- **Multi-agent workflows** - Teams of specialized agents collaborating
- **Agent orchestration** - Master agents that coordinate specialist agents
- **Complex conversations** - Natural hand-offs between different expertise areas
- **Personality switching** - Different communication styles for different phases

**All BMAD modules can now use multi-agent patterns!** 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

_BMAD Core enhancement implemented during PH Dev Suite development_

